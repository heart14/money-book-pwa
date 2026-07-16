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
              :account-name="getAccountLabel(tx)"
              :category-name="getCategoryName(tx.categoryId)"
              :category-icon="getCategoryIcon(tx.categoryId)"
              @click="openDetail(tx)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Detail bottom sheet -->
    <Teleport to="body">
      <div v-if="detailTx != null" class="sheet-overlay" @click.self="detailTx = null">
        <div class="sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-body">
            <div class="sheet-header">
              <div class="sheet-icon-wrap">
                <span class="sheet-icon">{{ getCategoryIcon(detailTx.categoryId) || '🔄' }}</span>
              </div>
              <div class="sheet-title">{{ detailTx.title || getCategoryName(detailTx.categoryId) || '转账' }}</div>
              <div class="sheet-type-badge" :class="`badge-${detailTx.type}`">
                {{ typeLabel(detailTx.type) }}
              </div>
            </div>
            <div class="sheet-amount" :class="`amount-${detailTx.type}`">
              <span class="sheet-amount-sign">{{ detailTx.type === 'income' ? '+' : '-' }}</span>
              <span class="sheet-amount-value">{{ formatPure(detailTx.amount) }}</span>
            </div>
            <div class="sheet-details">
              <div v-if="detailTx.title" class="detail-row">
                <span class="detail-label">标题</span>
                <span class="detail-value">{{ detailTx.title }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">分类</span>
                <span class="detail-value">{{ getCategoryName(detailTx.categoryId) || '转账' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">账户</span>
                <span class="detail-value">{{ getAccountLabel(detailTx) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">日期</span>
                <span class="detail-value">{{ detailTx.date }} {{ detailTx.time?.slice(0, 5) || '' }}</span>
              </div>
              <div v-if="detailTx.note" class="detail-row">
                <span class="detail-label">备注</span>
                <span class="detail-value">{{ detailTx.note }}</span>
              </div>
              <div v-if="detailTx.tags && detailTx.tags.length > 0" class="detail-row">
                <span class="detail-label">标签</span>
                <span class="detail-value">
                  <span v-for="tag in detailTx.tags" :key="tag" class="detail-tag">{{ tag }}</span>
                </span>
              </div>
            </div>
            <div class="sheet-actions">
              <button class="btn btn-secondary" disabled>编辑</button>
              <button class="btn btn-danger" @click="handleDelete">删除</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, nextTick } from 'vue'
import { db } from '@/db'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { formatCurrency, formatDate, toDateString } from '@/utils/format'
import type { Transaction, Category, Account } from '@/types'
import TransactionItem from '@/components/transactions/TransactionItem.vue'
import FilterChips from '@/components/transactions/FilterChips.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()

const transactions = useLiveQuery<Transaction[]>(() =>
  db.transactions.orderBy('id').reverse().toArray(),
  [],
)

const accountMap = computed(() => {
  const map = new Map<number, Account>()
  for (const a of accountStore.accounts) {
    if (a.id != null) map.set(a.id, a)
  }
  return map
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

const selectedCategoryId = ref<number | null>(null)
const searchQuery = ref('')
const searchOpen = ref(false)
const showDatePicker = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Date filter state
const now = new Date()
const filterYear = ref(now.getFullYear())
const filterMonth = ref(now.getMonth() + 1)
const dateFilterActive = ref(false)

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

watchEffect(() => {
  if (searchOpen.value) {
    nextTick(() => searchInputRef.value?.focus())
  }
})

const filteredTransactions = computed(() => {
  let list = transactions.value

  // Date filter
  if (dateFilterActive.value) {
    const prefix = `${filterYear.value}-${String(filterMonth.value).padStart(2, '0')}`
    list = list.filter((tx) => tx.date.startsWith(prefix))
  }

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

const displayTransactions = computed(() => filteredTransactions.value)

function getAccountLabel(tx: Transaction): string {
  if (tx.type === 'transfer') {
    const fromName = tx.fromAccountId != null
      ? (accountMap.value.get(tx.fromAccountId)?.name ?? '未知')
      : '未知'
    const toName = tx.toAccountId != null
      ? (accountMap.value.get(tx.toAccountId)?.name ?? '未知')
      : '未知'
    return `${fromName} → ${toName}`
  }
  const accountId = tx.type === 'income' ? tx.toAccountId : tx.fromAccountId
  if (accountId == null) return '未知'
  return accountMap.value.get(accountId)?.name ?? '未知'
}

function getCategoryName(categoryId: number | null | undefined): string {
  if (categoryId == null) return ''
  return categoryMap.value.get(categoryId)?.name ?? ''
}

function getCategoryIcon(categoryId: number | null | undefined): string {
  if (categoryId == null) return ''
  return categoryMap.value.get(categoryId)?.icon ?? ''
}

function typeLabel(type: Transaction['type']): string {
  switch (type) {
    case 'expense': return '支出'
    case 'income': return '收入'
    case 'transfer': return '转账'
  }
}

function formatPure(amount: number): string {
  return formatCurrency(amount).replace('¥', '')
}

const detailTx = ref<Transaction | null>(null)

function openDetail(tx: Transaction) {
  detailTx.value = tx
}

async function handleDelete() {
  const tx = detailTx.value
  if (!tx || tx.id == null) return
  if (!confirm('确定要删除这条记录吗？')) return
  await transactionStore.deleteTransaction(tx.id)
  detailTx.value = null
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

/* Bottom sheet overlay */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.sheet {
  width: 100%;
  max-width: 480px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  max-height: 85vh;
  overflow-y: auto;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d1d1d6;
  margin: 8px auto 0;
}

.sheet-body {
  padding: 16px 24px 32px;
}

.sheet-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.sheet-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f2f2f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.sheet-icon {
  font-size: 28px;
  line-height: 1;
}

.sheet-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

.sheet-type-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  margin-top: 6px;
  color: #fff;
}

.badge-expense { background: #34c759; }
.badge-income { background: #ff3b30; }
.badge-transfer { background: #007aff; }

.sheet-amount {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 24px;
}

.sheet-amount.amount-expense { color: #34c759; }
.sheet-amount.amount-income { color: #ff3b30; }
.sheet-amount.amount-transfer { color: #007aff; }

.sheet-details {
  border-top: 1px solid var(--color-separator);
  padding-top: 16px;
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  font-size: 15px;
}

.detail-label {
  width: 56px;
  flex-shrink: 0;
  color: var(--color-secondary-text);
}

.detail-value {
  flex: 1;
  color: var(--color-text);
  word-break: break-all;
}

.detail-tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f2f2f6;
  color: var(--color-secondary-text);
  margin-right: 4px;
  margin-bottom: 2px;
}

.sheet-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:active { opacity: 0.7; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { background: #f2f2f6; color: var(--color-text); }
.btn-danger { background: #ff3b30; color: #fff; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>