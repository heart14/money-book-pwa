<template>
  <div class="page stats-page">
    <!-- Time Switcher -->
    <div class="time-switcher">
      <button class="nav-btn" @click="prevPeriod">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div class="period-label">{{ periodLabel }}</div>
      <button class="nav-btn" @click="nextPeriod">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: timeMode === 'month' }"
          @click="timeMode = 'month'"
        >月</button>
        <button
          class="mode-btn"
          :class="{ active: timeMode === 'year' }"
          @click="timeMode = 'year'"
        >年</button>
      </div>
    </div>

    <!-- Income / Expense Overview -->
    <div class="overview-row">
      <div class="overview-card income">
        <div class="overview-label">收入</div>
        <div class="overview-amount">{{ formatCurrency(totalIncome) }}</div>
      </div>
      <div class="overview-card expense">
        <div class="overview-label">支出</div>
        <div class="overview-amount">{{ formatCurrency(totalExpense) }}</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <ExpenseChart
        type="bar"
        :data="barChartData"
        title="收支趋势"
        height="280px"
      />
      <ExpenseChart
        type="pie"
        :data="pieChartData"
        title="支出构成"
        height="300px"
      />
    </div>

    <!-- Expense Ranking & Tags Grid -->
    <div class="charts-grid">
      <div class="chart-card ranking-card">
        <div class="chart-title">支出排行</div>
        <div v-if="expenseRanking.length === 0" class="empty-text">暂无数据</div>
        <div
          v-for="(item, index) in expenseRanking"
          :key="item.name"
          class="ranking-row"
        >
          <span class="ranking-index">{{ rankLabel(index) }}</span>
          <span class="ranking-icon">{{ item.icon }}</span>
          <span class="ranking-name">{{ item.name }}</span>
          <span class="ranking-amount">{{ formatCurrency(item.amount) }}</span>
          <div class="ranking-bar-bg">
            <div
              class="ranking-bar-fill"
              :style="{ width: item.percent + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="chart-card tags-card">
        <div class="chart-title">标签聚合</div>
        <div v-if="tagAggregation.length === 0" class="empty-text">暂无数据</div>
        <div class="tags-wrap">
          <div
            v-for="tag in tagAggregation"
            :key="tag.name"
            class="tag-chip"
          >
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-amount">{{ formatCurrency(tag.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { liveQuery } from 'dexie'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { formatCurrency } from '@/utils/format'
import ExpenseChart from '@/components/stats/ExpenseChart.vue'
import type { Transaction } from '@/types'

const txStore = useTransactionStore()
const categoryStore = useCategoryStore()

const timeMode = ref<'month' | 'year'>('month')
const currentDate = ref(new Date())

const periodLabel = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth() + 1
  if (timeMode.value === 'year') return `${y}年`
  return `${y}年${m}月`
})

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}

function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31)
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dateRange = computed(() => {
  if (timeMode.value === 'year') {
    return {
      start: toDateStr(startOfYear(currentDate.value)),
      end: toDateStr(endOfYear(currentDate.value)),
    }
  }
  return {
    start: toDateStr(startOfMonth(currentDate.value)),
    end: toDateStr(endOfMonth(currentDate.value)),
  }
})

const transactions = ref<Transaction[]>([])

watch(
  () => [dateRange.value.start, dateRange.value.end],
  ([start, end]) => {
    const observable = txStore.getByDateRange(start, end)
    const sub = observable.subscribe({
      next: (result: Transaction[]) => {
        transactions.value = result
      },
    })
    return () => sub.unsubscribe()
  },
  { immediate: true },
)

// ---- Navigation ----
function prevPeriod() {
  const d = new Date(currentDate.value)
  if (timeMode.value === 'year') {
    d.setFullYear(d.getFullYear() - 1)
  } else {
    d.setMonth(d.getMonth() - 1)
  }
  currentDate.value = d
}

function nextPeriod() {
  const d = new Date(currentDate.value)
  if (timeMode.value === 'year') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  currentDate.value = d
}

// ---- Aggregation ----
const totalIncome = computed(() => {
  return transactions.value
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
})

const totalExpense = computed(() => {
  return transactions.value
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
})

function aggregateByDate(txList: Transaction[]): { categories: string[]; income: number[]; expense: number[] } {
  if (timeMode.value === 'year') {
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
    const income = Array(12).fill(0)
    const expense = Array(12).fill(0)
    for (const tx of txList) {
      const monthIdx = parseInt(tx.date.split('-')[1], 10) - 1
      if (tx.type === 'income') income[monthIdx] += tx.amount
      else if (tx.type === 'expense') expense[monthIdx] += tx.amount
    }
    return { categories: months, income, expense }
  }

  // month mode: daily
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`)
  const income = Array(daysInMonth).fill(0)
  const expense = Array(daysInMonth).fill(0)
  for (const tx of txList) {
    const dayIdx = parseInt(tx.date.split('-')[2], 10) - 1
    if (tx.type === 'income') income[dayIdx] += tx.amount
    else if (tx.type === 'expense') expense[dayIdx] += tx.amount
  }
  return { categories: days, income, expense }
}

function aggregateByCategory(txList: Transaction[]): { name: string; icon: string; amount: number }[] {
  const map = new Map<number, { name: string; icon: string; amount: number }>()
  const expenseTxs = txList.filter((tx) => tx.type === 'expense')
  for (const tx of expenseTxs) {
    if (!tx.categoryId) continue
    const cat = categoryStore.categories.find((c) => c.id === tx.categoryId)
    if (!cat) continue
    const parent = cat.parentId ? categoryStore.categories.find((c) => c.id === cat.parentId) : cat
    if (!parent) continue
    const key = parent.id!
    if (!map.has(key)) map.set(key, { name: parent.name, icon: parent.icon, amount: 0 })
    map.get(key)!.amount += tx.amount
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
}

function aggregateByTag(txList: Transaction[]): { name: string; amount: number }[] {
  const map = new Map<string, number>()
  const expenseTxs = txList.filter((tx) => tx.type === 'expense')
  for (const tx of expenseTxs) {
    for (const tag of tx.tags) {
      map.set(tag, (map.get(tag) || 0) + tx.amount)
    }
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

const barChartData = computed(() => aggregateByDate(transactions.value))

const categoryAggregation = computed(() => aggregateByCategory(transactions.value))

const pieChartData = computed(() =>
  categoryAggregation.value.map((item) => ({
    name: item.name,
    value: item.amount,
  })),
)

const totalExpenseForPercent = computed(() =>
  categoryAggregation.value.reduce((sum, item) => sum + item.amount, 0),
)

const expenseRanking = computed(() =>
  categoryAggregation.value.slice(0, 10).map((item) => ({
    ...item,
    percent:
      totalExpenseForPercent.value > 0
        ? Math.round((item.amount / totalExpenseForPercent.value) * 100)
        : 0,
  })),
)

const tagAggregation = computed(() => aggregateByTag(transactions.value))

function rankLabel(index: number): string {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return String(index + 1)
}
</script>

<style scoped>
.stats-page {
  background: var(--color-bg);
}

/* Time Switcher */
.time-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-card);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.nav-btn:active {
  opacity: 0.6;
}

.period-label {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 100px;
  text-align: center;
}

.mode-toggle {
  display: flex;
  background: var(--color-card);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-left: 4px;
}

.mode-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-secondary-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.15s;
}

.mode-btn.active {
  background: var(--color-primary);
  color: #fff;
}

/* Overview */
.overview-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.overview-card {
  background: var(--color-card);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.overview-card.income {
  border-left: 4px solid var(--color-success);
}

.overview-card.expense {
  border-left: 4px solid var(--color-destructive);
}

.overview-label {
  font-size: 13px;
  color: var(--color-secondary-text);
  margin-bottom: 4px;
}

.overview-amount {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.overview-card.income .overview-amount {
  color: var(--color-success);
}

.overview-card.expense .overview-amount {
  color: var(--color-destructive);
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: var(--color-card);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.empty-text {
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
  color: var(--color-secondary-text);
}

/* Ranking */
.ranking-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-separator);
}

.ranking-row:last-child {
  border-bottom: none;
}

.ranking-index {
  width: 24px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-secondary-text);
}

.ranking-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
}

.ranking-name {
  flex: 1;
  font-size: 14px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-amount {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-destructive);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  margin-right: 4px;
}

.ranking-bar-bg {
  width: 60px;
  min-width: 40px;
  height: 6px;
  border-radius: 3px;
  background: var(--color-separator);
  overflow: hidden;
}

.ranking-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--color-destructive);
  transition: width 0.3s ease;
}

/* Tags */
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f2f2f6;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 13px;
}

.tag-name {
  color: var(--color-text);
  font-weight: 500;
}

.tag-amount {
  color: var(--color-destructive);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
</style>