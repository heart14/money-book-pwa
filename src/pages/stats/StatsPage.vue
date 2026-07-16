<template>
  <div class="stats-page">
    <!-- Header: 统计 + mode toggle -->
    <div class="page-header">
      <span class="page-title">统计</span>
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
        <button
          class="mode-btn"
          :class="{ active: timeMode === 'custom' }"
          @click="timeMode = 'custom'"
        >自选</button>
      </div>
    </div>

    <!-- Month/Year selector -->
    <template v-if="timeMode === 'custom'">
      <div class="period-selector custom">
        <span class="period-label">从</span>
        <button class="period-nav" @click="customStartMonth--; if(customStartMonth<1){customStartMonth=12;customStartYear--}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="period-label small">{{ customStartYear }}年{{ customStartMonth }}月</span>
        <button class="period-nav" @click="customStartMonth++; if(customStartMonth>12){customStartMonth=1;customStartYear++}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
        <span class="period-label small">至</span>
        <button class="period-nav" @click="customEndMonth--; if(customEndMonth<1){customEndMonth=12;customEndYear--}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="period-label small">{{ customEndYear }}年{{ customEndMonth }}月</span>
        <button class="period-nav" @click="customEndMonth++; if(customEndMonth>12){customEndMonth=1;customEndYear++}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
      </div>
    </template>
    <template v-else>
      <div class="period-selector">
        <button class="period-nav" @click="prevPeriod">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="period-label">{{ periodLabel }}</span>
        <button class="period-nav" @click="nextPeriod">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
      </div>
    </template>

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

    <!-- Monthly Trend Bar Chart -->
    <div class="chart-card">
      <div class="chart-title">月度趋势</div>
      <div class="bar-chart">
        <div v-for="(bar, idx) in barChartData" :key="idx" class="bar-column">
          <div class="bar-stack">
            <div
              class="bar-expense"
              :style="{ height: bar.expenseHeight + '%', opacity: 0.3 }"
            ></div>
            <div
              class="bar-income"
              :style="{ height: bar.incomeHeight + '%' }"
            ></div>
          </div>
          <span class="bar-label" :class="{ active: bar.active }">{{ bar.label }}</span>
        </div>
      </div>
      <div class="bar-legend">
        <span class="legend-item"><span class="legend-dot income"></span>收入</span>
        <span class="legend-item"><span class="legend-dot expense"></span>支出</span>
      </div>
    </div>

    <!-- Expense Composition (Pie) -->
    <div class="chart-card">
      <div class="chart-title">支出构成</div>
      <div class="pie-section">
        <div class="pie-visual" v-if="pieSegments.length > 0">
          <div class="pie" :style="pieGradient"></div>
        </div>
        <div class="pie-legend">
          <div v-for="seg in pieSegments" :key="seg.name" class="pie-legend-row">
            <span class="pie-dot" :style="{ color: seg.color }">●</span>
            <span class="pie-name">{{ seg.name }}</span>
            <span class="pie-pct">{{ seg.percent }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expense Ranking + Tags Grid -->
    <div class="bottom-grid">
      <div class="chart-card">
        <div class="chart-title">支出排行</div>
        <div v-if="expenseRanking.length === 0" class="empty-text">暂无数据</div>
        <div
          v-for="(item, index) in expenseRanking"
          :key="item.name"
          class="ranking-row"
        >
          <span class="ranking-badge" :style="{ background: rankColor(index) }">{{ rankLabel(index) }}</span>
          <span class="ranking-icon">{{ item.icon }}</span>
          <span class="ranking-name">{{ item.name }}</span>
          <span class="ranking-amount">{{ formatCurrency(item.amount) }}</span>
          <span class="ranking-pct">{{ item.percent }}%</span>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">标签聚合</div>
        <div v-if="tagAggregation.length === 0" class="empty-text">暂无数据</div>
        <div class="tags-wrap">
          <div
            v-for="tag in tagAggregation"
            :key="tag.name"
            class="tag-chip"
          >
            <span class="tag-text">#{{ tag.name }}</span>
            <span class="tag-amount">· {{ formatCurrency(tag.amount) }}</span>
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
import type { Transaction } from '@/types'

const txStore = useTransactionStore()
const categoryStore = useCategoryStore()

const timeMode = ref<'month' | 'year' | 'custom'>('month')
const currentDate = ref(new Date())

// Custom date range state
const now2 = new Date()
const customStartYear = ref(now2.getFullYear())
const customStartMonth = ref(now2.getMonth() + 1)
const customEndYear = ref(now2.getFullYear())
const customEndMonth = ref(now2.getMonth() + 1)

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
    return { start: toDateStr(startOfYear(currentDate.value)), end: toDateStr(endOfYear(currentDate.value)) }
  }
  if (timeMode.value === 'custom') {
    const start = new Date(customStartYear.value, customStartMonth.value - 1, 1)
    const end = new Date(customEndYear.value, customEndMonth.value, 0)
    return { start: toDateStr(start), end: toDateStr(end) }
  }
  return { start: toDateStr(startOfMonth(currentDate.value)), end: toDateStr(endOfMonth(currentDate.value)) }
})

const transactions = ref<Transaction[]>([])

watch(
  () => [dateRange.value.start, dateRange.value.end],
  ([start, end]) => {
    const observable = txStore.getByDateRange(start, end)
    const sub = observable.subscribe({
      next: (result: Transaction[]) => { transactions.value = result },
    })
    return () => sub.unsubscribe()
  },
  { immediate: true },
)

function prevPeriod() {
  const d = new Date(currentDate.value)
  if (timeMode.value === 'year') { d.setFullYear(d.getFullYear() - 1) }
  else { d.setMonth(d.getMonth() - 1) }
  currentDate.value = d
}

function nextPeriod() {
  const d = new Date(currentDate.value)
  if (timeMode.value === 'year') { d.setFullYear(d.getFullYear() + 1) }
  else { d.setMonth(d.getMonth() + 1) }
  currentDate.value = d
}

const totalIncome = computed(() =>
  transactions.value.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
)
const totalExpense = computed(() =>
  transactions.value.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
)

const barChartData = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  if (timeMode.value === 'year') {
    const months = Array.from({ length: 12 }, (_, i) => i)
    const incomes = Array(12).fill(0)
    const expenses = Array(12).fill(0)
    let maxVal = 0
    for (const tx of transactions.value) {
      const monthIdx = parseInt(tx.date.split('-')[1], 10) - 1
      if (tx.type === 'income') { incomes[monthIdx] += tx.amount; maxVal = Math.max(maxVal, incomes[monthIdx]) }
      else if (tx.type === 'expense') { expenses[monthIdx] += tx.amount; maxVal = Math.max(maxVal, expenses[monthIdx]) }
    }
    maxVal = maxVal || 1
    return months.map((m) => ({
      label: `${m + 1}月`,
      incomeHeight: (incomes[m] / maxVal) * 100,
      expenseHeight: (expenses[m] / maxVal) * 100,
      active: m === currentMonth,
    }))
  }
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()
  const incomes = Array(daysInMonth).fill(0)
  const expenses = Array(daysInMonth).fill(0)
  let maxVal = 0
  for (const tx of transactions.value) {
    const dayIdx = parseInt(tx.date.split('-')[2], 10) - 1
    if (tx.type === 'income') { incomes[dayIdx] += tx.amount; maxVal = Math.max(maxVal, incomes[dayIdx]) }
    else if (tx.type === 'expense') { expenses[dayIdx] += tx.amount; maxVal = Math.max(maxVal, expenses[dayIdx]) }
  }
  const step = Math.max(1, Math.floor(daysInMonth / 7))
  maxVal = maxVal || 1
  return Array.from({ length: daysInMonth }, (_, i) => ({
    label: i % step === 0 ? `${i + 1}` : '',
    incomeHeight: (incomes[i] / maxVal) * 100,
    expenseHeight: (expenses[i] / maxVal) * 100,
    active: year === now.getFullYear() && month === currentMonth && i + 1 === today,
  }))
})

// Pie segments
const pieColors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#8e8e93', '#af52de', '#ff2d55']

function aggregateByCategory(txList: Transaction[]): { name: string; icon: string; amount: number }[] {
  const map = new Map<number, { name: string; icon: string; amount: number }>()
  for (const tx of txList.filter((t) => t.type === 'expense')) {
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
  for (const tx of txList.filter((t) => t.type === 'expense')) {
    for (const tag of tx.tags) {
      map.set(tag, (map.get(tag) || 0) + tx.amount)
    }
  }
  return Array.from(map.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
}

const categoryAggregation = computed(() => aggregateByCategory(transactions.value))

const totalExpenseForPercent = computed(() => categoryAggregation.value.reduce((sum, item) => sum + item.amount, 0))

const pieSegments = computed(() => {
  const total = totalExpenseForPercent.value || 1
  return categoryAggregation.value.slice(0, 6).map((item, idx) => ({
    name: item.name,
    percent: Math.round((item.amount / total) * 100),
    color: pieColors[idx % pieColors.length],
    amount: item.amount,
  }))
})

const pieGradient = computed(() => {
  if (pieSegments.value.length === 0) return ''
  let angle = 0
  const parts = pieSegments.value.map((seg) => {
    const start = angle
    angle += seg.percent * 3.6
    return `${seg.color} ${start}deg ${angle}deg`
  })
  return { background: `conic-gradient(${parts.join(', ')})` }
})

const expenseRanking = computed(() =>
  categoryAggregation.value.slice(0, 5).map((item) => ({
    ...item,
    percent: totalExpenseForPercent.value > 0 ? Math.round((item.amount / totalExpenseForPercent.value) * 100) : 0,
  })),
)

const tagAggregation = computed(() => aggregateByTag(transactions.value))

const rankColors = ['#ff3b30', '#ff9500', '#ffcc00']

function rankColor(index: number): string {
  return rankColors[index] || '#8e8e93'
}

function rankLabel(index: number): string {
  return String(index + 1)
}
</script>

<style scoped>
.stats-page {
  padding: 16px;
  background: var(--color-bg);
  min-height: 100%;
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
}

.mode-toggle {
  display: flex;
  background: rgba(255,255,255,0.85);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.mode-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: #8e8e93;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.mode-btn.active {
  background: #007aff;
  color: #fff;
  font-weight: 600;
}

/* Period selector */
.period-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.period-selector.custom {
  gap: 2px;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  justify-content: center;
  white-space: nowrap;
}

.period-selector.custom .period-nav {
  width: 24px;
  height: 32px;
  flex-shrink: 0;
}

.period-selector.custom .period-label:first-child {
  min-width: auto;
  margin-right: 2px;
}

.period-selector.custom .period-label.small {
  font-size: 15px;
  min-width: auto;
  flex-shrink: 0;
  white-space: nowrap;
}

.period-selector.custom .period-label.small:last-of-type {
  margin-right: 4px;
}

.period-nav {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}

.period-label {
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
  min-width: 100px;
  text-align: center;
}

/* Overview */
.overview-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.overview-card {
  border-radius: 12px;
  padding: 10px 12px;
}

.overview-card.income { background: #34c759; }
.overview-card.expense { background: #ff3b30; }

.overview-label {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 2px;
}

.overview-amount {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

/* Chart Cards */
.chart-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #1c1c1e;
  margin-bottom: 10px;
}

.empty-text {
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
  color: var(--color-secondary-text);
}

/* Bar Chart */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100px;
}

.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.bar-stack {
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  position: relative;
  flex: 1;
  justify-content: flex-end;
}

.bar-income {
  width: 100%;
  background: #34c759;
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}

.bar-expense {
  width: 100%;
  background: #ff3b30;
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 8px;
  color: #8e8e93;
  white-space: nowrap;
}

.bar-label.active {
  color: #1c1c1e;
  font-weight: 600;
}

.bar-legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #8e8e93;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.legend-dot.income { background: #34c759; }
.legend-dot.expense { background: #ff3b30; opacity: 0.3; }

/* Pie Section */
.pie-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pie-visual {
  flex-shrink: 0;
}

.pie {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pie-legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.pie-dot {
  font-size: 14px;
  line-height: 1;
}

.pie-name {
  flex: 1;
  color: #1c1c1e;
}

.pie-pct {
  color: #8e8e93;
}

/* Bottom Grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 768px) {
  .bottom-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Ranking */
.ranking-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-separator);
}

.ranking-row:last-child { border-bottom: none; }

.ranking-badge {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ranking-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.ranking-name {
  flex: 1;
  font-size: 13px;
  color: #1c1c1e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-amount {
  font-size: 13px;
  font-weight: 600;
  color: #ff3b30;
  white-space: nowrap;
}

.ranking-pct {
  font-size: 11px;
  color: #8e8e93;
  width: 28px;
  text-align: right;
}

/* Tags */
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  background: #f2f2f7;
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 13px;
  color: #1c1c1e;
}

.tag-text {
  font-weight: 500;
}

.tag-amount {
  color: #8e8e93;
}
</style>