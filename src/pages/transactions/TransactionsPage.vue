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
        <!-- Field selector: 选中字段按钮 + 箭头 -->
        <div class="search-field-selector" @click.stop="fieldSelectorOpen = !fieldSelectorOpen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <circle cx="10.5" cy="10.5" r="7"></circle>
            <line x1="15.5" y1="15.5" x2="21" y2="21"></line>
          </svg>
          <span class="search-field-label">{{ currentSearchFieldLabel }}</span>
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="#007aff" stroke-width="1.5" stroke-linecap="round" style="flex-shrink:0;">
            <path d="M1 1l3 3 3-3" />
          </svg>
        </div>
        <!-- 下拉菜单 -->
        <div v-if="fieldSelectorOpen" class="search-field-dropdown">
          <button
            v-for="opt in searchFieldOptions"
            :key="opt.value"
            class="search-field-option"
            :class="{ active: opt.value === searchField }"
            @click="searchField = opt.value; fieldSelectorOpen = false"
          >
            <svg v-if="opt.value === searchField" class="search-field-check" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#007aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6l2.5 2.5 4.5-5" /></svg>
            <span class="search-field-check-placeholder" v-else></span>
            {{ opt.label }}
          </button>
        </div>
        <span class="search-field-divider"></span>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          class="search-input"
          :placeholder="searchPlaceholder"
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

    <!-- Delete confirm dialog -->
    <ConfirmDialog
      :visible="showDeleteConfirm"
      title="确认删除"
      :message="`确定要删除${deleteTargetTx?.title ? '「' + deleteTargetTx.title + '」' : '' }这条记录吗？`"
      confirm-type="danger"
      @confirm="handleDeleteConfirmed"
      @update:visible="showDeleteConfirm = $event"
    />

    <!-- Detail bottom sheet -->
    <TransactionDetail
      v-if="detailTx != null"
      :transaction="detailTx"
      @edit="openEdit"
      @delete="showDeleteFor"
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
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()

// ── Core reactive state ──
const selectedCategoryId = ref<number | null>(null)
const searchQuery = ref('')
const searchOpen = ref(false)
const showDatePicker = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

// ── Search field selector ──
type SearchField = 'title' | 'note' | 'tag' | 'all'
const searchField = ref<SearchField>('all')
const fieldSelectorOpen = ref(false)
const searchFieldOptions: { value: SearchField; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'title', label: '标题' },
  { value: 'note', label: '备注' },
  { value: 'tag', label: '标签' },
]

const currentSearchFieldLabel = computed(
  () => searchFieldOptions.find((o) => o.value === searchField.value)!.label,
)
const searchPlaceholder = computed(() => {
  const labels: Record<SearchField, string> = {
    title: '搜索标题…',
    note: '搜索备注…',
    tag: '搜索标签…',
    all: '搜索…',
  }
  return labels[searchField.value]
})

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
// ── Initialize search field from route query ──
if (route.query.searchField && typeof route.query.searchField === 'string') {
  const validFields: SearchField[] = ['title', 'note', 'tag', 'all']
  if (validFields.includes(route.query.searchField as SearchField)) {
    searchField.value = route.query.searchField as SearchField
  }
}
// ── Initialize category filter from route query categoryId param ──
if (route.query.categoryId && typeof route.query.categoryId === 'string') {
  const id = parseInt(route.query.categoryId, 10)
  if (!isNaN(id)) {
    selectedCategoryId.value = id
  }
}
// ── Initialize month filter from route query yearMonth param ──
if (route.query.yearMonth && typeof route.query.yearMonth === 'string') {
  const parts = route.query.yearMonth.split('-')
  if (parts.length === 2) {
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      filterYear.value = y
      filterMonth.value = m
      dateFilterActive.value = true
      showDatePicker.value = true
    }
  }
}

// ── Cursor pagination ──
const PAGE_SIZE = 20
const transactions = ref<Transaction[]>([])
let cursorDate: string | null = null
let cursorId: number | null = null
const isLoading = ref(false)
const allLoaded = ref(false)

/** 单调递增 generation，resetPagination 时递增，废弃过时的 loadPage 结果 */
let resetGen = 0

/**
 * 根据当前 selectedCategoryId 返回 Dexie filter 回调。
 * - null → 返回 null（不过滤分类）
 * - 父分类 → 匹配父分类 ID 或任何子分类 ID
 * - 子分类 → 只匹配该子分类 ID
 */
function getCategoryFilter(): ((tx: Transaction) => boolean) | null {
  const sel = selectedCategoryId.value
  if (sel == null) return null
  const childIds = childIdsByParent.value.get(sel)
  if (!childIds || childIds.size === 0) {
    // 选中子分类或没有子分类的父分类
    return (tx: Transaction) => tx.categoryId === sel
  }
  // 选中父分类 → 匹配父分类 ID 或任何子分类 ID
  return (tx: Transaction) => tx.categoryId === sel || childIds.has(tx.categoryId!)
}

const isEmpty = computed(() => {
  if (isLoading.value) return false
  // 有搜索词时，用 filteredTransactions 判断（搜索在客户端侧）
  if (searchQuery.value.trim()) {
    return allLoaded.value && filteredTransactions.value.length === 0
  }
  // 无搜索词，DB 侧已按分类过滤，直接看 transactions
  return transactions.value.length === 0
})

// ── 核心分页加载逻辑 ──
async function loadPage() {
  if (allLoaded.value) return
  // 如果 isLoading 为 true 说明有过时请求 stuck，重置状态再试
  if (isLoading.value) {
    isLoading.value = false
    cursorDate = null
    cursorId = null
  }
  isLoading.value = true
  const gen = resetGen

  try {
    // 构建基础查询（按 [date+id] 倒序，带游标或首次加载）
    let query: ReturnType<typeof db.transactions.orderBy>

    if (dateFilterActive.value) {
      const start = toDateString(new Date(filterYear.value, filterMonth.value - 1, 1))
      const end = toDateString(new Date(filterYear.value, filterMonth.value, 0))

      if (cursorDate !== null && cursorId !== null) {
        query = db.transactions
          .where('[date+id]')
          .between([start, 0], [cursorDate, cursorId], true, false)
          .reverse() as any
      } else {
        query = db.transactions
          .where('[date+id]')
          .between([start, 0], [end, Number.MAX_SAFE_INTEGER])
          .reverse() as any
      }
    } else {
      if (cursorDate !== null && cursorId !== null) {
        query = db.transactions
          .where('[date+id]')
          .below([cursorDate, cursorId])
          .reverse() as any
      } else {
        query = db.transactions
          .orderBy('[date+id]')
          .reverse() as any
      }
    }

    // 如果有分类筛选，在 DB 层 filter（惰性求值，遍历游标时按需过滤）
    const catFilter = getCategoryFilter()
    const items = catFilter
      ? await query.filter(catFilter).limit(PAGE_SIZE + 1).toArray()
      : await query.limit(PAGE_SIZE + 1).toArray()

    // 如果在此期间发生了新的 reset（resetGen 变了），丢弃这批数据
    if (gen !== resetGen) return

    if (items.length > PAGE_SIZE) {
      items.length = PAGE_SIZE
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
    if (gen !== resetGen) return
    console.error('[钱书] 加载明细失败', e)
    allLoaded.value = true
  } finally {
    if (gen === resetGen) {
      isLoading.value = false
      // 当有搜索词激活且已加载可见数据不足 PAGE_SIZE 时，自动补充加载
      if (searchQuery.value.trim() && !allLoaded.value && gen === resetGen) {
        if (filteredTransactions.value.length < PAGE_SIZE) {
          loadPage()
        }
      }
    }
  }
}

// ── 重置分页（筛选变更时调用） ──
async function resetPagination() {
  resetGen++
  // 强制释放 isLoading，避免过时请求 stuck 导致后续加载永久阻塞
  isLoading.value = false
  cursorDate = null
  cursorId = null
  allLoaded.value = false
  transactions.value = []
  await loadPage()
}

// ── 日期筛选变更 → 重置分页（防抖）──
let filterWatchTimer: ReturnType<typeof setTimeout> | null = null
watch([dateFilterActive, filterYear, filterMonth], () => {
  if (filterWatchTimer) clearTimeout(filterWatchTimer)
  filterWatchTimer = setTimeout(() => {
    resetPagination()
  }, 150)
})

// ── 分类筛选 / 搜索变更 → 重置分页（防抖）──
let categoryWatchTimer: ReturnType<typeof setTimeout> | null = null
watch([selectedCategoryId, searchQuery], () => {
  if (categoryWatchTimer) clearTimeout(categoryWatchTimer)
  categoryWatchTimer = setTimeout(() => {
    resetPagination()
  }, 100)
})

// ── 关闭日期选择器时清除筛选 ──
watch(showDatePicker, (open, prev) => {
  if (prev !== undefined && !open && dateFilterActive.value) {
    clearDateFilter()
  }
})

// ── 全局版本号变更 → 静默刷新（来自记账页/编辑窗的增删改） ──
watch(() => transactionStore.version, () => {
  resetPagination()
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

// ── 路由 query 变更（如从统计页点击分类跳转） ──
watch(
  () => route.query.categoryId,
  (categoryId) => {
    if (typeof categoryId === 'string') {
      const id = parseInt(categoryId, 10)
      if (!isNaN(id)) {
        selectedCategoryId.value = id
      }
    }
  },
)

// ── 路由 query 变更（如从统计页点击分类跳转，附带年月） ──
watch(
  () => route.query.yearMonth,
  (yearMonth) => {
    if (typeof yearMonth === 'string') {
      const parts = yearMonth.split('-')
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          filterYear.value = y
          filterMonth.value = m
          dateFilterActive.value = true
          showDatePicker.value = true
        }
      }
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

// ── 点击空白关闭字段选择下拉框 ──
function onDocumentClick() {
  fieldSelectorOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

// ── 搜索栏焦点管理 ──
watch(searchOpen, (open, prev) => {
  if (open) {
    nextTick(() => searchInputRef.value?.focus())
  } else if (prev !== undefined && !open) {
    searchQuery.value = ''
    fieldSelectorOpen.value = false
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
  const typeOrder = { expense: 0, income: 1, transfer: 2 }
  return categoryStore.getParents()
    .slice()
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type])
    .map((c) => ({
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

// ── 客户端侧筛选（搜索关键词按选中字段过滤，分类已在 DB 侧 filter） ──
const filteredTransactions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return transactions.value
  const field = searchField.value
  return transactions.value.filter((tx) => {
    if (field === 'title') {
      return (tx.title || '').toLowerCase().includes(q)
    }
    if (field === 'note') {
      return (tx.note || '').toLowerCase().includes(q)
    }
    if (field === 'tag') {
      return (tx.tags || []).some((t) => t.toLowerCase().includes(q))
    }
    // field === 'all'：标题、备注、标签任一匹配
    if ((tx.title || '').toLowerCase().includes(q)) return true
    if ((tx.note || '').toLowerCase().includes(q)) return true
    return (tx.tags || []).some((t) => t.toLowerCase().includes(q))
  })
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

// ── Delete with confirm dialog ──
const showDeleteConfirm = ref(false)
const deleteTargetTx = ref<Transaction | null>(null)

function showDeleteFor(tx: Transaction) {
  deleteTargetTx.value = tx
  showDeleteConfirm.value = true
}

async function handleDeleteConfirmed() {
  const tx = deleteTargetTx.value
  if (!tx || tx.id == null) return
  await transactionStore.deleteTransaction(tx.id)
  detailTx.value = null
  deleteTargetTx.value = null
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
  background: var(--color-bg);
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
  color: var(--color-text);
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
  position: relative;
  z-index: 100;
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
  gap: 6px;
  height: 36px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 0 8px 0 4px;
  position: relative;
  border: 1px solid rgba(0, 122, 255, 0.12);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--color-text);
  outline: none;
  font-family: inherit;
}

.search-input::placeholder {
  color: #c7c7cc;
  font-weight: 400;
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

/* Search field selector */
.search-field-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px 4px 6px;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 6px;
  transition: background 0.15s;
}
.search-field-selector:active {
  background: rgba(0, 122, 255, 0.08);
}

/* 竖线分隔符 */
.search-field-divider {
  display: inline-block;
  width: 1px;
  height: 18px;
  background: #d1d1d6;
  flex-shrink: 0;
}

.search-field-label {
  font-size: 13px;
  color: #007aff;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1;
}

/* 下拉菜单：相对 field selector 定位，宽度自动 */
.search-field-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 16px;
  min-width: 120px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  padding: 4px;
  z-index: 1000;
  animation: dropdownFadeIn 0.15s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-field-option {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 14px;
  color: #1c1c1e;
  cursor: pointer;
  border-radius: 8px;
  text-align: left;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.1s;
}

.search-field-option:active {
  background: #f2f2f7;
}

.search-field-option.active {
  color: #007aff;
  font-weight: 600;
  background: rgba(0, 122, 255, 0.06);
}

.search-field-check,
.search-field-check-placeholder {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
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