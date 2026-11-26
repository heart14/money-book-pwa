<template>
  <div class="transactions-page">
    <!-- 沉浸式头部：大标题 + 图标动作 -->
    <header class="tx-head">
      <span class="tx-title">明细</span>
      <div class="tx-actions">
        <button class="tx-action" :class="{ on: showDatePicker }" @click="showDatePicker = !showDatePicker" aria-label="日期筛选">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
        <button class="tx-action" :class="{ on: searchOpen }" @click="searchOpen = !searchOpen" aria-label="搜索">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10.5" cy="10.5" r="7"></circle>
            <line x1="15.5" y1="15.5" x2="21" y2="21"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- 日期筛选条（展开） -->
    <div v-if="showDatePicker" class="tx-datebar">
      <div class="tx-datebar-inner glass">
        <button class="tx-date-nav" @click="prevMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="tx-date-label" v-if="isRangeFilter">{{ dateFrom.slice(5) }} ~ {{ dateTo.slice(5) }}</span>
        <span class="tx-date-label" v-else>{{ filterYear }}年{{ filterMonth }}月</span>
        <button class="tx-date-nav" @click="nextMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
        <button v-if="dateFilterActive" class="tx-date-clear" @click="clearDateFilter">清除</button>
      </div>
    </div>

    <!-- 搜索条（展开） -->
    <div v-if="searchOpen" class="tx-search">
      <div class="tx-search-inner glass">
        <div class="tx-search-field" @click.stop="fieldSelectorOpen = !fieldSelectorOpen">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <circle cx="10.5" cy="10.5" r="7"></circle>
            <line x1="15.5" y1="15.5" x2="21" y2="21"></line>
          </svg>
          <span class="tx-search-field-label">{{ currentSearchFieldLabel }}</span>
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="flex-shrink:0;"><path d="M1 1l3 3 3-3" /></svg>
        </div>
        <div v-if="fieldSelectorOpen" class="tx-search-dropdown glass">
          <button
            v-for="opt in searchFieldOptions"
            :key="opt.value"
            class="tx-search-option"
            :class="{ active: opt.value === searchField }"
            @click="searchField = opt.value; fieldSelectorOpen = false"
          >
            <svg v-if="opt.value === searchField" class="tx-search-check" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6l2.5 2.5 4.5-5" /></svg>
            <span v-else class="tx-search-check-placeholder"></span>
            {{ opt.label }}
          </button>
        </div>
        <span class="tx-search-divider"></span>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          class="tx-search-input"
          :placeholder="searchPlaceholder"
        />
        <button v-if="searchQuery" class="tx-search-clear" @click="searchQuery = ''">✕</button>
      </div>
    </div>

    <!-- 分类筛选：横向流式 chips -->
    <div class="tx-filter">
      <FilterChips
        :categories="parentCategories"
        :selected-id="chipSelectedId"
        :context-id="isFilteringByChild ? effectiveSelectedParentId : null"
        @select="onParentCategorySelect"
      />
    </div>

    <!-- 子分类 chips（当父或子被选中时） -->
    <div v-if="childCategories.length > 0" class="tx-children">
      <div class="tx-children-scroll">
        <button
          class="tx-child-chip"
          :class="{ on: isChildActive(child) }"
          v-for="child in childCategories"
          :key="child.id!"
          @click="onChildCategorySelect(child)"
        >
          {{ child.name }}
        </button>
      </div>
    </div>

    <!-- 沉浸式连续账页 -->
    <div class="tx-content">
      <EmptyState
        v-if="isEmpty && !isLoading"
        icon="📋"
        message="暂无流水记录"
      />

      <div v-else class="tx-list">
        <div v-for="group in groupedTransactions" :key="group.dateStr" class="tx-day glass">
          <div class="tx-day-label">
            <span class="f6">{{ group.dateLabel }}</span>
            <span v-if="group.dayIncome > 0 || group.dayExpense > 0" class="tx-day-sum">
              <span v-if="group.dayExpense > 0" class="c-exp">-{{ formatPure(group.dayExpense) }}</span>
              <span v-if="group.dayIncome > 0" class="c-inc">+{{ formatPure(group.dayIncome) }}</span>
            </span>
          </div>
          <div class="tx-rows">
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

        <!-- 无限滚动哨兵 -->
        <div ref="sentinelEl" class="tx-sentinel">
          <div v-if="isLoading" class="tx-loading">
            <div class="tx-spinner" />
            <span>加载中…</span>
          </div>
          <div v-else-if="allLoaded && transactions.length > 0" class="tx-finished">
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
import { useRoute, useRouter } from 'vue-router'
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
// 范围筛选（月/年/自选跳转钻取）：仅当 URL 携带 from/to 时启用
const dateFrom = ref('')
const dateTo = ref('')
const isRangeFilter = ref(false)

/** 校验 YYYY-MM-DD 日期字符串 */
function isValidDateStr(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

// ── Initialize search from route query tag param ──
const route = useRoute()
const router = useRouter()
// from/to 均合法且 from<=to 才启用范围筛选
const hasValidRange = isValidDateStr(route.query.from) && isValidDateStr(route.query.to) && route.query.from <= route.query.to
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
// ── Initialize month filter from route query yearMonth param（from/to 有效时优先范围模式，屏蔽本年月） ──
if (!hasValidRange && route.query.yearMonth && typeof route.query.yearMonth === 'string') {
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

// ── Initialize range filter from route query from/to (统计页年/自选钻取) ──
// 仅当 from/to 均为合法日期且 from<=to 时才启用，非法值静默忽略并回退全量
if (hasValidRange) {
  dateFrom.value = route.query.from as string
  dateTo.value = route.query.to as string
  isRangeFilter.value = true
  dateFilterActive.value = true
  showDatePicker.value = true
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
      // 范围筛选（年/自选钻取）直接用 from/to，单月则按月算
      const start = isRangeFilter.value ? dateFrom.value : toDateString(new Date(filterYear.value, filterMonth.value - 1, 1))
      const end = isRangeFilter.value ? dateTo.value : toDateString(new Date(filterYear.value, filterMonth.value, 0))

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
watch([dateFilterActive, filterYear, filterMonth, isRangeFilter, dateFrom, dateTo], () => {
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
          isRangeFilter.value = false
          dateFilterActive.value = true
          showDatePicker.value = true
        }
      }
    }
  },
)

// ── 路由 query 变更（统计页年/自选钻取，from/to 日期范围） ──
watch(
  () => [route.query.from, route.query.to],
  ([from, to]) => {
    // 仅当 from/to 均合法且 from<=to 时才应用范围，非法值静默忽略
    if (isValidDateStr(from) && isValidDateStr(to) && from <= to) {
      dateFrom.value = from
      dateTo.value = to
      isRangeFilter.value = true
      dateFilterActive.value = true
      showDatePicker.value = true
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
/** 范围模式的月数跨度（整数） */
function rangeMonthSpan(): number {
  const [fy, fm] = dateFrom.value.split('-').map(Number)
  const [ty, tm] = dateTo.value.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm) + 1
}

/** 范围模式：区间整体前后平移 span 个月（delta 为 -1/1） */
function shiftRange(delta: number) {
  const span = rangeMonthSpan()
  const [fy, fm] = dateFrom.value.split('-').map(Number)
  const d = new Date(fy, fm - 1 + delta * span)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  dateFrom.value = `${y}-${String(m).padStart(2, '0')}-01`
  dateTo.value = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  // 同步 URL query（replace 不推历史栈），保证可复现
  router.replace({ query: { ...route.query, from: dateFrom.value, to: dateTo.value } })
}

function prevMonth() {
  dateFilterActive.value = true
  if (isRangeFilter.value) {
    shiftRange(-1)
    return
  }
  if (filterMonth.value === 1) {
    filterMonth.value = 12
    filterYear.value--
  } else {
    filterMonth.value--
  }
}

function nextMonth() {
  dateFilterActive.value = true
  if (isRangeFilter.value) {
    shiftRange(1)
    return
  }
  if (filterMonth.value === 12) {
    filterMonth.value = 1
    filterYear.value++
  } else {
    filterMonth.value++
  }
}

function clearDateFilter() {
  dateFilterActive.value = false
  isRangeFilter.value = false
  dateFrom.value = ''
  dateTo.value = ''
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
  min-height: 100%;
  min-height: 100svh;
  padding: 0 16px 16px;
  background: transparent;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

/* ── 沉浸式头部 ── */
.tx-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 2px 8px; }
.tx-title { font-size: var(--fs-page-title); font-weight: 800; letter-spacing: -0.03em; color: var(--ink); }
.tx-actions { display: flex; gap: 4px; }
.tx-action {
  width: 38px; height: 38px; border: none; background: none; color: var(--ink3);
  display: flex; align-items: center; justify-content: center; border-radius: 12px; cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: background 0.15s, color 0.15s;
}
.tx-action:active { background: var(--act-bg); }
.tx-action.on { color: var(--ink); background: var(--act-bg); }

/* ── 日期筛选条 ── */
.tx-datebar { padding: 10px 2px 4px; }
.tx-datebar-inner { display: flex; align-items: center; justify-content: center; gap: 14px; height: 42px; border-bottom: 1px solid var(--line-soft); padding-bottom: 12px; }
.tx-date-nav { width: 30px; height: 30px; border: 1px solid var(--line); background: none; color: var(--ink2); border-radius: 999px; display: grid; place-items: center; cursor: pointer; }
.tx-date-label { font-size: var(--fs-title); font-weight: 600; color: var(--ink); min-width: 96px; text-align: center; }
.tx-date-clear { border: none; background: none; color: var(--ink2); font-size: var(--fs-small); font-weight: 600; cursor: pointer; padding: 4px 8px; }

/* ── 搜索条 ── */
.tx-search { padding: 8px 2px 12px; }
.tx-search-inner {
  display: flex; align-items: center; gap: 6px; height: 40px;
  border-bottom: 1px solid var(--line); padding: 0 2px;
  color: var(--ink2);
}
.tx-search-field { display: flex; align-items: center; gap: 4px; cursor: pointer; flex-shrink: 0; padding: 4px 6px; border-radius: 6px; -webkit-tap-highlight-color: transparent; }
.tx-search-field:active { background: var(--act-bg); }
.tx-search-field-label { font-size: var(--fs-ui); font-weight: 500; color: var(--ink); white-space: nowrap; }
.tx-search-divider { width: 1px; height: 18px; background: var(--line); flex-shrink: 0; }
.tx-search-input { flex: 1; min-width: 0; border: none; background: none; font-size: var(--fs-title); color: var(--ink); outline: none; font-family: inherit; }
.tx-search-input::placeholder { color: var(--ink3); }
.tx-search-clear { width: 20px; height: 20px; border: none; background: var(--line); color: var(--accent-fg); border-radius: 999px; font-size: var(--fs-small); cursor: pointer; display: grid; place-items: center; flex-shrink: 0; line-height: 1; }
.tx-search-dropdown { position: absolute; top: calc(100% + 6px); left: 0; min-width: 128px; /* 玻璃浮层，背景/描边/阴影由 .glass 提供 */ border-radius: 12px; padding: 6px; z-index: 1000; }
.tx-search-option { display: flex; align-items: center; gap: 6px; width: 100%; padding: 9px 12px; border: none; background: none; font-size: var(--fs-ui); color: var(--ink); cursor: pointer; border-radius: 8px; text-align: left; font-family: inherit; white-space: nowrap; }
.tx-search-option:active { background: var(--act-bg); }
.tx-search-option.active { color: var(--ink); font-weight: 600; }
.tx-search-check, .tx-search-check-placeholder { width: 12px; height: 12px; flex-shrink: 0; }

/* ── 分类筛选 chips（子组件自身样式，此处仅微调行距与底线） ── */
.tx-filter { padding: 4px 0 0; }
.tx-filter :deep(.filter-chips) { padding: 10px 0 12px; border-bottom: 1px solid var(--line-soft); }

/* ── 子分类 chips ── */
.tx-children { padding: 10px 0 0; }
.tx-children-scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.tx-children-scroll::-webkit-scrollbar { display: none; }
.tx-child-chip { display: inline-flex; padding: 6px 14px; border: 1px solid var(--line); background: none; color: var(--ink2); font-size: var(--fs-ui); font-weight: 500; border-radius: 999px; cursor: pointer; white-space: nowrap; font-family: inherit; }
.tx-child-chip.on { background: var(--ink); border-color: var(--ink); color: var(--accent-fg); }

/* ── 连续账页 ── */
.tx-content { padding-top: 8px; }
/* 日分组玻璃卡：.glass 提供磨砂底/描边/阴影，这里补齐内缩与外距 */
.tx-day { padding: 14px 16px 14px; margin-bottom: 14px; border-radius: var(--radius-big); }
.tx-day-label { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--fs-small); font-weight: 600; color: var(--ink2); padding: 0 2px 6px; }
.f6 { font-weight: 600; }
.tx-day-sum { display: inline-flex; gap: 8px; font-weight: 500; }
.c-inc { color: var(--inc); }
.c-exp { color: var(--exp); }
.tx-rows { }

/* 连续流水行：无浮卡，靠细分隔线排布 */
.tx-rows :deep(.transaction-item) { padding: 15px 0; }
.tx-rows :deep(.transaction-item + .transaction-item) { border-top: 1px solid var(--line-soft); }

/* ── 无限滚动 ── */
.tx-sentinel { display: flex; align-items: center; justify-content: center; padding: 20px; min-height: 48px; }
.tx-loading { display: flex; align-items: center; gap: 8px; font-size: var(--fs-ui); color: var(--ink3); }
.tx-spinner { width: 14px; height: 14px; border: 2px solid var(--line); border-top-color: var(--ink); border-radius: 50%; animation: txspin 0.6s linear infinite; }
@keyframes txspin { to { transform: rotate(360deg); } }
.tx-finished { font-size: var(--fs-small); color: var(--ink3); }
</style>