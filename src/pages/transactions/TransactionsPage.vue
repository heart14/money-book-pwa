<template>
  <div class="transactions-page">
    <!-- Header: 明细 + icons -->
    <div class="page-header">
      <span class="page-title">明细</span>
      <div class="header-actions">
        <button class="header-icon-btn" @click="showDatePicker = !showDatePicker">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
        <button class="header-icon-btn" @click="searchOpen = !searchOpen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10.5" cy="10.5" r="7"></circle>
            <line x1="15.5" y1="15.5" x2="21" y2="21"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Date filter bar (expandable) -->
    <div v-if="showDatePicker" class="date-filter-bar">
      <div class="date-filter-inner">
        <button class="date-nav-btn" @click="prevMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="date-filter-label">{{ filterYear }}年{{ filterMonth }}月</span>
        <button class="date-nav-btn" @click="nextMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
        <button v-if="dateFilterActive" class="date-clear-btn" @click="clearDateFilter">清除</button>
      </div>
    </div>

    <!-- Search bar (expandable) -->
    <div v-if="searchOpen" class="search-bar">
      <div class="search-inner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <circle cx="10.5" cy="10.5" r="7"></circle>
          <line x1="15.5" y1="15.5" x2="21" y2="21"></line>
        </svg>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索标题、备注或标签..."
        />
      </div>
    </div>

    <!-- Filter chips -->
    <FilterChips
      :categories="parentCategories"
      :selected-id="selectedCategoryId"
      @select="selectedCategoryId = $event"
    />

    <!-- Content -->
    <div class="content-area">
      <!-- Empty state -->
      <EmptyState
        v-if="displayTransactions.length === 0"
        icon="📋"
        message="暂无流水记录"
      />

      <!-- Transaction list -->
      <div v-else class="transaction-list">
        <div v-for="group in groupedTransactions" :key="group.dateStr" class="day-group">
          <div class="day-header">
            <span class="day-label">{{ group.dateLabel }}</span>
            <span v-if="group.dayIncome > 0 || group.dayExpense > 0" class="day-total">
              <span v-if="group.dayExpense > 0" class="total-expense">-{{ formatPure(group.dayExpense) }}</span>
              <span v-if="group.dayIncome > 0" class="total-income">+{{ formatPure(group.dayIncome) }}</span>
            </span>
          </div>
          <div class="day-items">
            <TransactionItem
              v-for="tx in group.transactions"
              :key="tx.id"
              :transaction="tx"
              :title="tx.title || getCategoryName(tx.categoryId)"
              :category-name="getCategoryName(tx.categoryId)"
              :category-icon="getCategoryIcon(tx.categoryId)"
              @click="openDetail(tx)"
            />
          </div>
        </div>
        <!-- Load more button -->
        <button
          v-if="hasMore"
          class="load-more-btn"
          @click="loadMore"
        >
          加载更多
        </button>
      </div>
    </div>

    <!-- Detail bottom sheet -->
    <TransactionDetail
      v-if="detailTx != null"
      :transaction="detailTx"
      @edit="openEdit"
      @delete="handleDelete"
      @close="detailTx = null"
    />

    <!-- Edit bottom sheet -->
    <TransactionEdit
      v-if="editTx != null"
      :transaction="editTx"
      @save="handleEditSave"
      @close="editTx = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/db'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { formatCurrency, toDateString } from '@/utils/format'
import type { Transaction, Category } from '@/types'
import TransactionItem from '@/components/transactions/TransactionItem.vue'
import TransactionDetail from '@/components/transactions/TransactionDetail.vue'
import TransactionEdit from '@/components/transactions/TransactionEdit.vue'
import FilterChips from '@/components/transactions/FilterChips.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()

// ── Core reactive state (must be declared before any usage) ──
const selectedCategoryId = ref<number | null>(null)
const searchQuery = ref('')
const searchOpen = ref(false)
const showDatePicker = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

// ── Initialize search from route query tag param ──
const route = useRoute()
if (route.query.tag && typeof route.query.tag === 'string') {
  searchQuery.value = route.query.tag
  searchOpen.value = true
}

// ── Date filter state (must be declared before queryDateRange) ──
const now = new Date()
const filterYear = ref(now.getFullYear())
const filterMonth = ref(now.getMonth() + 1)
const dateFilterActive = ref(false)

// ── Count-based pagination ──
// Always load from DB with a count limit. If results exceed PAGE_SIZE,
// show a "加载更多" button to increase the limit.
const PAGE_SIZE = 100
const loadLimit = ref(PAGE_SIZE + 1) // +1 to detect if more records exist

const transactions = useLiveQuery<Transaction[]>(() => {
  let query
  if (dateFilterActive.value) {
    const start = new Date(filterYear.value, filterMonth.value - 1, 1)
    const end = new Date(filterYear.value, filterMonth.value, 0)
    query = db.transactions
      .where('date')
      .between(toDateString(start), toDateString(end), true, true)
  } else {
    query = db.transactions
      .where('date')
      .above('') // all records, ordered by date index
  }
  return query
    .reverse()
    .limit(loadLimit.value)
    .toArray()
}, [])

/** Whether there are more DB records beyond the current limit */
const hasMore = computed(() => transactions.value.length === loadLimit.value)

function loadMore() {
  loadLimit.value += PAGE_SIZE
}

// Reset pagination whenever the query scope changes
watch([dateFilterActive, filterYear, filterMonth, () => route.query.tag], () => {
  loadLimit.value = PAGE_SIZE + 1
})

const categoryMap = computed(() => {
  const map = new Map<number, Category>()
  for (const c of categoryStore.categories) {
    if (c.id != null) map.set(c.id, c)
  }
  return map
})

const parentCategories = computed(() => {
  return categoryStore.getParents().map((c) => ({
    id: c.id as number,
    name: c.name,
    icon: c.icon,
  }))
})

const childIdsByParent = computed(() => {
  const map = new Map<number, Set<number>>()
  for (const c of categoryStore.categories) {
    if (c.parentId != null && c.id != null) {
      if (!map.has(c.parentId)) map.set(c.parentId, new Set())
      map.get(c.parentId)!.add(c.id)
    }
  }
  return map
})

// React to route query changes (e.g. navigating from stats page while already on transactions page)
watch(
  () => route.query.tag,
  (tag) => {
    if (typeof tag === 'string') {
      searchQuery.value = tag
      searchOpen.value = true
    }
  },
)

function prevMonth() {
  dateFilterActive.value = true
  if (filterMonth.value === 1) {
    filterMonth.value = 12
    filterYear.value--
  } else {
    filterMonth.value--
  }
}

function nextMonth() {
  dateFilterActive.value = true
  if (filterMonth.value === 12) {
    filterMonth.value = 1
    filterYear.value++
  } else {
    filterMonth.value++
  }
}

function clearDateFilter() {
  dateFilterActive.value = false
  filterYear.value = now.getFullYear()
  filterMonth.value = now.getMonth() + 1
}

watch(searchOpen, (open, prev) => {
  if (open) {
    nextTick(() => searchInputRef.value?.focus())
  } else if (prev !== undefined && !open) {
    // Closing search bar — clear search query
    searchQuery.value = ''
  }
})

const filteredTransactions = computed(() => {
  let list = transactions.value

  if (selectedCategoryId.value != null) {
    const sel = selectedCategoryId.value
    const childIds = childIdsByParent.value.get(sel) ?? new Set<number>()
    list = list.filter((tx) => {
      if (tx.categoryId == null) return false
      return tx.categoryId === sel || childIds.has(tx.categoryId)
    })
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((tx) => {
      if ((tx.title || '').toLowerCase().includes(q)) return true
      if (tx.note.toLowerCase().includes(q)) return true
      return tx.tags.some((t) => t.toLowerCase().includes(q))
    })
  }

  return list
})

function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface DayGroup {
  dateStr: string
  dateLabel: string
  transactions: Transaction[]
  dayIncome: number
  dayExpense: number
}

const groupedTransactions = computed(() => {
  const now = new Date()
  const todayStr = toDateString(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateString(yesterday)
  const weekStart = getWeekStart(now)
  const weekStartStr = toDateString(weekStart)

  const groups = new Map<string, Transaction[]>()
  for (const tx of filteredTransactions.value) {
    const key = tx.date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const sortedDates = [...groups.keys()].sort().reverse()
  const result: DayGroup[] = []

  for (const dateStr of sortedDates) {
    const txs = groups.get(dateStr)!
    let dayIncome = 0
    let dayExpense = 0
    for (const tx of txs) {
      if (tx.type === 'income') dayIncome += tx.amount
      else if (tx.type === 'expense') dayExpense += tx.amount
    }

    const d = new Date(dateStr)
    const weekday = weekDayNames[d.getDay()]

    let dateLabel: string
    if (dateStr === todayStr) {
      dateLabel = '今天'
    } else if (dateStr === yesterdayStr) {
      dateLabel = '昨天'
    } else if (dateStr >= weekStartStr) {
      dateLabel = `${parseInt(dateStr.split('-')[2])}日 ${weekday}`
    } else {
      dateLabel = `${parseInt(dateStr.split('-')[1])}月${parseInt(dateStr.split('-')[2])}日 ${weekday}`
    }

    result.push({
      dateStr,
      dateLabel,
      transactions: txs,
      dayIncome,
      dayExpense,
    })
  }

  return result
})

const displayTransactions = computed(() => {
  // When hasMore is true, only render the first PAGE_SIZE items in DOM
  const all = filteredTransactions.value
  if (hasMore.value && all.length > PAGE_SIZE) {
    return all.slice(0, PAGE_SIZE)
  }
  return all
})

function getCategoryName(categoryId: number | null | undefined): string {
  if (categoryId == null) return ''
  return categoryMap.value.get(categoryId)?.name ?? ''
}

function getCategoryIcon(categoryId: number | null | undefined): string {
  if (categoryId == null) return ''
  return categoryMap.value.get(categoryId)?.icon ?? ''
}

function formatPure(amount: number): string {
  return formatCurrency(amount).replace('¥', '')
}

// ── Detail bottom sheet ──
const detailTx = ref<Transaction | null>(null)

function openDetail(tx: Transaction) {
  detailTx.value = tx
}

async function handleDelete(tx: Transaction) {
  if (tx.id == null) return
  if (!confirm('确定要删除这条记录吗？')) return
  await transactionStore.deleteTransaction(tx.id)
  detailTx.value = null
}

// ── Edit bottom sheet ──
const editTx = ref<Transaction | null>(null)

function openEdit(tx: Transaction) {
  detailTx.value = null
  editTx.value = tx
}

async function handleEditSave(id: number, updates: Partial<Transaction>) {
  try {
    await transactionStore.updateTransaction(id, updates)
    // Sync detail sheet if still open for the same transaction
    if (detailTx.value?.id === id) {
      Object.assign(detailTx.value, updates)
    }
    editTx.value = null
  } catch (e) {
    console.error('编辑失败', e)
  }
}
</script>

<style scoped>
.transactions-page {
  padding: 0;
  background: #f2f2f6;
  min-height: 100%;
  padding-bottom: 64px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
}

.header-icon-btn:active {
  background: rgba(0,0,0,0.05);
}

/* Search bar */
.search-bar {
  padding: 8px 16px 0;
}

/* Date filter bar */
.date-filter-bar {
  padding: 8px 16px 0;
}

.date-filter-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 40px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 0 12px;
}

.date-nav-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
}

.date-filter-label {
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
  min-width: 80px;
  text-align: center;
}

.date-clear-btn {
  border: none;
  background: #007aff;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 0 12px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--color-text);
  outline: none;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--color-secondary-text);
}

/* Content area */
.content-area {
  padding: 0;
}

/* Day groups */
.day-group {
  margin: 8px 12px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 6px;
}

.day-label {
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
}

.day-total {
  font-size: 13px;
  font-weight: 600;
}

.total-income {
  color: #ff3b30;
}

.total-expense {
  color: #34c759;
}

/* Load more button */
.load-more-btn {
  display: block;
  width: calc(100% - 24px);
  margin: 12px;
  padding: 12px;
  border: 1px dashed #c7c7cc;
  border-radius: 10px;
  background: rgba(255,255,255,0.5);
  font-size: 14px;
  color: #007aff;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.load-more-btn:active {
  background: rgba(0, 122, 255, 0.08);
}
</style>