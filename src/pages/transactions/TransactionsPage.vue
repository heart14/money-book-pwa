<template>
  <PullToRefresh ref="ptrRef" @refresh="handleRefresh">
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
        <div class="date-nav-group">
          <button class="date-nav-btn" @click="prevMonth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span class="date-filter-label">{{ filterYear }}年{{ filterMonth }}月</span>
          <button class="date-nav-btn" @click="nextMonth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
        </div>
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
        <button v-if="searchQuery" class="search-clear-btn" @click="searchQuery = ''">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#007aff"><circle cx="12" cy="12" r="12"/></svg>
          <span class="search-clear-x">✕</span>
        </button>
      </div>
    </div>

    <!-- Filter chips -->
    <FilterChips
      :categories="parentCategories"
      :selected-id="chipSelectedId"
      :context-id="isFilteringByChild ? effectiveSelectedParentId : null"
      @select="onParentCategorySelect"
    />

    <!-- Child category chips (shown when a parent or its child is selected) -->
    <div v-if="childCategories.length > 0" class="children-bar">
      <div class="children-scroll">
        <button
          class="child-chip"
          :class="{ active: isChildActive(child) }"
          v-for="child in childCategories"
          :key="child.id!"
          @click="onChildCategorySelect(child)"
        >
          {{ child.name }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="content-area">
      <!-- Empty state -->
      <EmptyState
        v-if="isEmpty && !isLoading"
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

        <!-- Scroll sentinel + loading indicator for infinite scroll -->
        <div ref="sentinelEl" class="scroll-sentinel">
          <div v-if="isLoading" class="scroll-loading">
            <div class="scroll-spinner" />
            <span>加载中…</span>
          </div>
          <div v-else-if="allLoaded && transactions.length > 0" class="scroll-finished">
            — 没有更多账单了 —
          </div>
        </div>
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
  </PullToRefresh>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/db'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { formatCurrency, toDateString } from '@/utils/format'
import type { Transaction, Category } from '@/types'
import TransactionItem from '@/components/transactions/TransactionItem.vue'
import TransactionDetail from '@/components/transactions/TransactionDetail.vue'
import TransactionEdit from '@/components/transactions/TransactionEdit.vue'
import FilterChips from '@/components/transactions/FilterChips.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PullToRefresh from '@/components/common/PullToRefresh.vue'

const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()

// ── Core reactive state ──
const selectedCategoryId = ref<number | null>(null)
const searchQuery = ref('')
const searchOpen = ref(false)
const showDatePicker = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const ptrRef = ref<InstanceType<typeof PullToRefresh> | null>(null)

// ── Date filter state (declared before route init) ──
const now = new Date()
const filterYear = ref(now.getFullYear())
const filterMonth = ref(now.getMonth() + 1)
const dateFilterActive = ref(false)

// ── Initialize search from route query tag param ──
const route = useRoute()
if (route.query.tag && typeof route.query.tag === 'string') {
  searchQuery.value = route.query.tag
  searchOpen.value = true
}

// ── Cursor pagination ──
const PAGE_SIZE = 20
const transactions = ref<Transaction[]>([])
let cursorDate: string | null = null
let cursorId: number | null = null
const isLoading = ref(false)
const allLoaded = ref(false)

const isEmpty = computed(() => {
  if (isLoading.value) return false
  if (transactions.value.length === 0) return true
  // 数据已加载但筛选无匹配，且没有更多数据可加载
  if (allLoaded.value && filteredTransactions.value.length === 0) return true
  return false
})

// ── 核心分页加载逻辑 ──
async function loadPage() {
  if (isLoading.value || allLoaded.value) return
  isLoading.value = true

  try {
    let items: Transaction[]

    if (dateFilterActive.value) {
      const start = toDateString(new Date(filterYear.value, filterMonth.value - 1, 1))
      const end = toDateString(new Date(filterYear.value, filterMonth.value, 0))

      if (cursorDate !== null && cursorId !== null) {
        // 月份内带游标翻页
        items = await db.transactions
          .where('[date+id]')
          .between([start, 0], [cursorDate, cursorId], true, false)
          .reverse()
          .limit(PAGE_SIZE + 1)
          .toArray()
      } else {
        // 月份内首次加载
        items = await db.transactions
          .where('[date+id]')
          .between([start, 0], [end, Number.MAX_SAFE_INTEGER])
          .reverse()
          .limit(PAGE_SIZE + 1)
          .toArray()
      }
    } else {
      // 全部流水（游标分页核心场景）
      if (cursorDate !== null && cursorId !== null) {
        items = await db.transactions
          .where('[date+id]')
          .below([cursorDate, cursorId])
          .reverse()
          .limit(PAGE_SIZE + 1)
          .toArray()
      } else {
        items = await db.transactions
          .orderBy('[date+id]')
          .reverse()
          .limit(PAGE_SIZE + 1)
          .toArray()
      }
    }

    if (items.length > PAGE_SIZE) {
      items = items.slice(0, PAGE_SIZE)
    } else {
      allLoaded.value = true
    }

    if (items.length > 0) {
      const last = items[items.length - 1]
      cursorDate = last.date!
      cursorId = last.id!
    }

    transactions.value.push(...items)
  } catch (e) {
    console.error('[钱书] 加载明细失败', e)
    allLoaded.value = true
  } finally {
    isLoading.value = false
  }
}

/** 当前是否有客户端侧筛选条件激活 */
function hasActiveFilter(): boolean {
  return selectedCategoryId.value != null || searchQuery.value.trim() !== ''
}

/**
 * 在筛选激活时，持续加载后续页面直到有足够匹配数据填满屏幕（PAGE_SIZE 条），
 * 或耗尽全部数据。避免下拉刷新后只显示零星几条的糟糕体验。
 */
async function loadUntilMatchFound() {
  while (!allLoaded.value && filteredTransactions.value.length < PAGE_SIZE) {
    await loadPage()
  }
}

// ── 重置分页（筛选变更或下拉刷新时调用） ──
async function resetPagination() {
  cursorDate = null
  cursorId = null
  allLoaded.value = false
  transactions.value = []
  await loadPage()
  // 若有激活的筛选条件，持续加载直到看到匹配数据或耗尽
  if (hasActiveFilter()) {
    await loadUntilMatchFound()
  }
}

// ── 下拉刷新 ──
async function handleRefresh() {
  await resetPagination()
  ptrRef.value?.doneRefreshing()
}

// ── 日期筛选变更 → 重置分页（防抖 + 并发保护）──
let filterWatchTimer: ReturnType<typeof setTimeout> | null = null
watch([dateFilterActive, filterYear, filterMonth], () => {
  if (filterWatchTimer) clearTimeout(filterWatchTimer)
  filterWatchTimer = setTimeout(async () => {
    if (isLoading.value) return
    await resetPagination()
  }, 150)
})

// ── 关闭日期选择器时清除筛选 ──
watch(showDatePicker, (open, prev) => {
  if (prev !== undefined && !open && dateFilterActive.value) {
    clearDateFilter()
  }
})

// ── 全局版本号变更 → 静默刷新（来自记账页/编辑窗的增删改） ──
watch(() => transactionStore.version, () => {
  if (!isLoading.value) {
    resetPagination()
  }
})

// ── 路由 query 变更（如从统计页点击标签跳转） ──
watch(
  () => route.query.tag,
  (tag) => {
    if (typeof tag === 'string') {
      searchQuery.value = tag
      searchOpen.value = true
    }
  },
)

// ── IntersectionObserver 无限滚动 ──
const sentinelEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function initObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  const el = sentinelEl.value
  if (!el) return

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !allLoaded.value && !isLoading.value) {
        loadPage()
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(el)
}

onMounted(() => {
  // 首次加载
  loadPage()
  // DOM 已就绪，初始化观察器
  nextTick(() => initObserver())
})

watch(sentinelEl, () => {
  // 哨兵元素重建时（如从空态切换回列表），重新连接 observer
  nextTick(() => initObserver())
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})

// ── 搜索栏焦点管理 ──
watch(searchOpen, (open, prev) => {
  if (open) {
    nextTick(() => searchInputRef.value?.focus())
  } else if (prev !== undefined && !open) {
    searchQuery.value = ''
  }
})

// ── Category mapping ──
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

// ── 子分类 chips 展示 ──
/** 判断给定 ID 是否为子分类 */
function isChildCategory(id: number): boolean {
  const cat = categoryStore.categories.find((c) => c.id === id)
  return cat != null && cat.parentId != null
}

/** 当前选中的父分类 ID（用于展示其子分类列表） */
const selectedParentForChildren = computed<number | null>(() => {
  const id = selectedCategoryId.value
  if (id == null) return null
  const cat = categoryStore.categories.find((c) => c.id === id)
  if (!cat) return null
  // 若选中的是父分类，直接返回；若是子分类，返回其父
  return cat.parentId ?? cat.id!
})

/** 传给 FilterChips 的高亮 ID：选中子分类时高亮其父分类 */
const effectiveSelectedParentId = computed<number | null>(() => {
  const id = selectedCategoryId.value
  if (id == null) return null
  const cat = categoryStore.categories.find((c) => c.id === id)
  if (!cat) return null
  return cat.parentId ?? cat.id!
})

/** 当前筛选的是子分类 */
const isFilteringByChild = computed(() => {
  return selectedCategoryId.value != null && isChildCategory(selectedCategoryId.value)
})

/**
 * 传给 FilterChips 的 selectedId：
 * - null       → "全部"高亮（无筛选）
 * - 父分类 ID   → 该父分类蓝色填充（选中了父分类）
 * - -1         → 都不高亮（选中了子分类，防止"全部"误高亮）
 */
const chipSelectedId = computed<number | null>(() => {
  const id = selectedCategoryId.value
  if (id == null) return null
  // 选中子分类 → 传 -1 占位，"全部"和父分类都不高亮
  if (isChildCategory(id)) return -1
  // 选中父分类 → 蓝色填充
  return id
})

/** 当前应展示的子分类列表 */
const childCategories = computed(() => {
  const parentId = selectedParentForChildren.value
  if (parentId == null) return []
  return categoryStore.getChildren(parentId)
})

/** 子分类 chip 是否激活（用户已点选该子分类） */
function isChildActive(child: Category): boolean {
  return selectedCategoryId.value === child.id
}

function onParentCategorySelect(id: number | null) {
  selectedCategoryId.value = id
}

function onChildCategorySelect(child: Category) {
  // 点击已激活的子分类 → 回退到父分类筛选
  if (selectedCategoryId.value === child.id) {
    selectedCategoryId.value = child.parentId
  } else {
    selectedCategoryId.value = child.id!
  }
}

// ── 客户端侧筛选（分类 + 搜索，仅对当前已加载页操作） ──
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
      if ((tx.note || '').toLowerCase().includes(q)) return true
      return (tx.tags || []).some((t) => t.toLowerCase().includes(q))
    })
  }

  return list
})

// ── 日期分组 ──
const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface DayGroup {
  dateStr: string
  dateLabel: string
  transactions: Transaction[]
  dayIncome: number
  dayExpense: number
}

function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
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

// ── 辅助函数 ──
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

// ── 日期导航 ──
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 0 12px;
}

.date-nav-group {
  display: flex;
  align-items: center;
  gap: 12px;
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
  position: absolute;
  right: 12px;
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

.search-clear-btn {
  position: relative;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.search-clear-x {
  position: absolute;
  font-size: 10px;
  color: #fff;
  line-height: 1;
  pointer-events: none;
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

/* Scroll sentinel for infinite scroll */
.scroll-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-height: 48px;
}

.scroll-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8e8e93;
}

.scroll-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #c7c7cc;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.scroll-finished {
  font-size: 13px;
  color: #c7c7cc;
}

/* Child category chips — matches CategoryPicker style */
.children-bar {
  display: flex;
  align-items: center;
  padding: 0 16px 4px;
}

.children-scroll {
  overflow-x: auto;
  white-space: nowrap;
  display: flex;
  gap: 6px;
  flex: 1;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.children-scroll::-webkit-scrollbar {
  display: none;
}

.child-chip {
  display: inline-flex;
  padding: 6px 14px;
  border: none;
  border-radius: 16px;
  background: #f2f2f7;
  color: #1c1c1e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  font-family: inherit;
}

.child-chip.active {
  background: #007aff;
  color: #fff;
}
</style>