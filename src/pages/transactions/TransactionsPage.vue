<template>
  <div class="page transactions-page">
    <!-- Search bar -->
    <div class="search-bar">
      <div class="search-inner" :class="{ expanded: searchOpen }">
        <button class="search-btn" @click="searchOpen = !searchOpen">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <circle cx="10.5" cy="10.5" r="7" />
            <line x1="15.5" y1="15.5" x2="21" y2="21" />
          </svg>
        </button>
        <input
          v-if="searchOpen"
          ref="searchInputRef"
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索备注或标签..."
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
              <span v-if="group.dayIncome > 0" class="total-income">+{{ formatPure(group.dayIncome) }}</span>
              <span v-if="group.dayIncome > 0 && group.dayExpense > 0" class="total-sep"> </span>
              <span v-if="group.dayExpense > 0" class="total-expense">-{{ formatPure(group.dayExpense) }}</span>
            </span>
          </div>
          <div class="day-items">
            <TransactionItem
              v-for="tx in group.transactions"
              :key="tx.id"
              :transaction="tx"
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
            <!-- Header: icon + type -->
            <div class="sheet-header">
              <div class="sheet-icon-wrap">
                <span class="sheet-icon">{{ getCategoryIcon(detailTx.categoryId) || '🔄' }}</span>
              </div>
              <div class="sheet-category">{{ getCategoryName(detailTx.categoryId) || '转账' }}</div>
              <div class="sheet-type-badge" :class="`badge-${detailTx.type}`">
                {{ typeLabel(detailTx.type) }}
              </div>
            </div>

            <!-- Amount -->
            <div class="sheet-amount" :class="`amount-${detailTx.type}`">
              <span class="sheet-amount-sign">{{ detailTx.type === 'income' ? '+' : '-' }}</span>
              <span class="sheet-amount-value">{{ formatPure(detailTx.amount) }}</span>
            </div>

            <!-- Details -->
            <div class="sheet-details">
              <div class="detail-row">
                <span class="detail-label">账户</span>
                <span class="detail-value">{{ getAccountLabel(detailTx) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">日期</span>
                <span class="detail-value">{{ detailTx.date }} {{ detailTx.time.slice(0, 5) }}</span>
              </div>
              <div v-if="detailTx.note" class="detail-row">
                <span class="detail-label">备注</span>
                <span class="detail-value">{{ detailTx.note }}</span>
              </div>
              <div v-if="detailTx.tags.length > 0" class="detail-row">
                <span class="detail-label">标签</span>
                <span class="detail-value">
                  <span v-for="tag in detailTx.tags" :key="tag" class="detail-tag">{{ tag }}</span>
                </span>
              </div>
            </div>

            <!-- Actions -->
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
import { liveQuery } from 'dexie'
import { db } from '@/db'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useAccountStore } from '@/stores/accountStore'
import { formatCurrency, formatDate, toDateString } from '@/utils/format'
import type { Transaction, Category, Account } from '@/types'
import TransactionItem from '@/components/transactions/TransactionItem.vue'
import FilterChips from '@/components/transactions/FilterChips.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()

// ---- Live transactions ----
const transactions = ref<Transaction[]>([])

watchEffect((onCleanup) => {
  const observable = liveQuery(() =>
    db.transactions.orderBy('id').reverse().toArray(),
  )
  const sub = observable.subscribe({
    next: (result) => {
      transactions.value = result
    },
  })
  onCleanup(() => sub.unsubscribe())
})

// ---- Lookup maps ----
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

/** Parent categories from store */
const parentCategories = computed(() => {
  return categoryStore.getParents().map((c) => ({
    id: c.id as number,
    name: c.name,
    icon: c.icon,
  }))
})

/** Map parentId -> Set of childIds */
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

// ---- Filter state ----
const selectedCategoryId = ref<number | null>(null)
const searchQuery = ref('')
const searchOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Watch search open to auto-focus
watchEffect(() => {
  if (searchOpen.value) {
    nextTick(() => searchInputRef.value?.focus())
  }
})

// ---- Filtered transactions ----
const filteredTransactions = computed(() => {
  let list = transactions.value

  // Category filter
  if (selectedCategoryId.value != null) {
    const sel = selectedCategoryId.value
    const childIds = childIdsByParent.value.get(sel) ?? new Set<number>()
    list = list.filter((tx) => {
      if (tx.categoryId == null) return false
      return tx.categoryId === sel || childIds.has(tx.categoryId)
    })
  }

  // Search filter
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((tx) => {
      if (tx.note.toLowerCase().includes(q)) return true
      return tx.tags.some((t) => t.toLowerCase().includes(q))
    })
  }

  return list
})

// ---- Date grouping helpers ----
function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// ---- Grouped transactions ----
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

  // Group by date string
  const groups = new Map<string, Transaction[]>()
  for (const tx of filteredTransactions.value) {
    const key = tx.date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  // Sort by date descending
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

    // Determine label
    let dateLabel: string
    if (dateStr === todayStr) {
      dateLabel = '今天'
    } else if (dateStr === yesterdayStr) {
      dateLabel = '昨天'
    } else if (dateStr >= weekStartStr) {
      dateLabel = formatDate(dateStr)
    } else {
      dateLabel = formatDate(dateStr)
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

// ---- Computed for display (need to consider empty after filtering) ----
const displayTransactions = computed(() => filteredTransactions.value)

// ---- Helper functions ----
function getAccountLabel(tx: Transaction): string {
  if (tx.type === 'transfer') {
    const fromName = tx.fromAccountId != null
      ? (accountMap.value.get(tx.fromAccountId)?.name ?? '未知账户')
      : '未知账户'
    const toName = tx.toAccountId != null
      ? (accountMap.value.get(tx.toAccountId)?.name ?? '未知账户')
      : '未知账户'
    return `${fromName} → ${toName}`
  }
  const accountId = tx.type === 'income' ? tx.toAccountId : tx.fromAccountId
  if (accountId == null) return '未知账户'
  return accountMap.value.get(accountId)?.name ?? '未知账户'
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
    case 'expense':
      return '支出'
    case 'income':
      return '收入'
    case 'transfer':
      return '转账'
  }
}

function formatPure(amount: number): string {
  return formatCurrency(amount).replace('¥', '')
}

// ---- Bottom sheet ----
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
  background: var(--color-bg);
  min-height: 100%;
}

/* Search bar */
.search-bar {
  padding: 8px 16px 0;
}

.search-inner {
  display: flex;
  align-items: center;
  height: 36px;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 10px;
  padding: 0 8px;
  transition: all 0.2s;
}

.search-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--color-secondary-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--color-text);
  outline: none;
  margin-left: 4px;
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
  background: var(--color-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.day-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
  background: var(--color-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.day-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.day-total {
  font-size: 13px;
  font-weight: 500;
}

.total-income {
  color: #34c759;
}

.total-expense {
  color: #ff3b30;
}

.total-sep {
  display: inline-block;
  width: 6px;
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
  background: #fff;
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

.sheet-category {
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

.badge-expense {
  background: #ff3b30;
}

.badge-income {
  background: #34c759;
}

.badge-transfer {
  background: #007aff;
}

.sheet-amount {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 24px;
}

.sheet-amount.amount-expense {
  color: #ff3b30;
}

.sheet-amount.amount-income {
  color: #34c759;
}

.sheet-amount.amount-transfer {
  color: #007aff;
}

/* Detail rows */
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

/* Actions */
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
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.btn:active {
  opacity: 0.7;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f2f2f6;
  color: var(--color-text);
}

.btn-danger {
  background: #ff3b30;
  color: #fff;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>