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
        <button class="period-nav" @click="customRange.startMonth--; if(customRange.startMonth<1){customRange.startMonth=12;customRange.startYear--}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="period-label small">{{ customRange.startYear }}年{{ customRange.startMonth }}月</span>
        <button class="period-nav" @click="customRange.startMonth++; if(customRange.startMonth>12){customRange.startMonth=1;customRange.startYear++}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
        <span class="period-label small">至</span>
        <button class="period-nav" @click="customRange.endMonth--; if(customRange.endMonth<1){customRange.endMonth=12;customRange.endYear--}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="period-label small">{{ customRange.endYear }}年{{ customRange.endMonth }}月</span>
        <button class="period-nav" @click="customRange.endMonth++; if(customRange.endMonth>12){customRange.endMonth=1;customRange.endYear++}">
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

    <!-- Trend Line Chart -->
    <div class="chart-card">
      <div class="chart-title-row">
        <span class="chart-title">收支趋势</span>
        <div class="trend-toggle">
          <button
            class="toggle-btn"
            :class="{ active: trendType === 'expense' }"
            @click="trendType = 'expense'"
          >支出</button>
          <button
            class="toggle-btn"
            :class="{ active: trendType === 'income' }"
            @click="trendType = 'income'"
          >收入</button>
        </div>
      </div>
      <v-chart class="echart-line" :option="lineOption" autoresize />
    </div>

    <!-- Expense Composition (Pie) -->
    <div class="chart-card">
      <div class="chart-title">支出构成</div>
      <v-chart class="echart-pie" :option="pieOption" autoresize />
    </div>

    <!-- Expense Ranking + Tags Grid -->
    <div class="bottom-grid">
      <div class="chart-card">
        <div class="chart-title-row">
          <span class="chart-title">支出排行</span>
          <div class="ranking-toggle">
            <button
              class="toggle-btn"
              :class="{ active: rankingLevel === 'parent' }"
              @click="rankingLevel = 'parent'"
            >一级</button>
            <button
              class="toggle-btn"
              :class="{ active: rankingLevel === 'child' }"
              @click="rankingLevel = 'child'"
            >二级</button>
          </div>
        </div>
        <div v-if="expenseRanking.length === 0" class="empty-text">暂无数据</div>
        <div
          v-for="(item, index) in expenseRanking"
          :key="item.categoryId + '-' + rankingLevel"
          class="ranking-row"
          :class="{ clickable: timeMode === 'month' }"
          @click="navigateToCategory(item)"
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
        <div class="tags-wrap" v-if="tagAggregation.length > 0">
          <div class="tag-chip tag-chip--total" @click="navigateToTag('')">
            <span class="tag-text">汇总</span>
            <span class="tag-amount">{{ formatCurrency(tagTotalAmount) }}</span>
          </div>
          <div
            v-for="tag in tagAggregation"
            :key="tag.name"
            class="tag-chip"
            @click="navigateToTag(tag.name)"
          >
            <span class="tag-text">#{{ tag.name }}</span>
            <span class="tag-amount">{{ formatCurrency(tag.amount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Large Expenses -->
    <div class="chart-card large-expense-card">
      <div class="chart-title">大额支出</div>
      <div v-if="largeExpenses.length === 0" class="empty-text">暂无大额支出</div>
      <div
        v-for="(item, index) in largeExpenses"
        :key="item.id"
        class="large-row"
      >
        <span class="large-rank">{{ index + 1 }}</span>
        <span class="large-icon">{{ item.icon }}</span>
        <div class="large-info">
          <span class="large-title">{{ item.title }}</span>
          <span class="large-date">{{ item.shortDate }}</span>
        </div>
        <span class="large-amount">{{ formatCurrency(item.amount) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/db'
import { useCategoryStore } from '@/stores/categoryStore'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { formatCurrency } from '@/utils/format'
import VChart from 'vue-echarts'
import type { Transaction } from '@/types'
const categoryStore = useCategoryStore()

type RankLevel = 'parent' | 'child'

const rankingLevel = ref<RankLevel>('parent')
const timeMode = ref<'month' | 'year' | 'custom'>('month')
const trendType = ref<'expense' | 'income'>('expense')
const currentDate = ref(new Date())

// Custom date range state
const customRange = reactive({
  startYear: new Date().getFullYear(),
  startMonth: new Date().getMonth() + 1,
  endYear: new Date().getFullYear(),
  endMonth: new Date().getMonth() + 1,
})

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
    const start = new Date(customRange.startYear, customRange.startMonth - 1, 1)
    const end = new Date(customRange.endYear, customRange.endMonth, 0)
    return { start: toDateStr(start), end: toDateStr(end) }
  }
  return { start: toDateStr(startOfMonth(currentDate.value)), end: toDateStr(endOfMonth(currentDate.value)) }
})

const transactions = useLiveQuery<Transaction[]>(() =>
  db.transactions
    .where('date')
    .between(dateRange.value.start, dateRange.value.end, true, true)
    .reverse()
    .toArray(),
  [],
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

const lineOption = computed(() => {
  const txType = trendType.value
  const lineColor = txType === 'expense' ? '#34c759' : '#ff3b30'
  const areaColor = txType === 'expense' ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)'

  let categories: string[] = []
  let values: number[] = []

  if (timeMode.value === 'year') {
    // Year: monthly data (12 months)
    categories = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const monthly = new Array(12).fill(0)
    for (const tx of transactions.value) {
      if (tx.type !== txType) continue
      const idx = parseInt(tx.date.split('-')[1], 10) - 1
      monthly[idx] += tx.amount
    }
    values = monthly.map(v => +(v / 100).toFixed(2))
  } else if (timeMode.value === 'custom') {
    // Custom: daily data within the custom range
    const start = new Date(customRange.startYear, customRange.startMonth - 1, 1)
    const end = new Date(customRange.endYear, customRange.endMonth, 0)
    const allDates: string[] = []
    const cur = new Date(start)
    while (cur <= end) {
      allDates.push(toDateStr(cur))
      cur.setDate(cur.getDate() + 1)
    }

    const dailyMap = new Map<string, number>()
    for (const tx of transactions.value) {
      if (tx.type !== txType) continue
      dailyMap.set(tx.date, (dailyMap.get(tx.date) || 0) + tx.amount)
    }

    categories = allDates.map(d => {
      const p = d.split('-')
      return `${parseInt(p[1])}月${parseInt(p[2])}日`
    })
    values = allDates.map(d => +((dailyMap.get(d) || 0) / 100).toFixed(2))
  } else {
    // Month: daily data
    const daysInMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0).getDate()
    categories = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`)
    const daily = new Array(daysInMonth).fill(0)
    for (const tx of transactions.value) {
      if (tx.type !== txType) continue
      const idx = parseInt(tx.date.split('-')[2], 10) - 1
      daily[idx] += tx.amount
    }
    values = daily.map(v => +(v / 100).toFixed(2))
  }

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    grid: { left: 8, right: 8, top: 8, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 10, color: '#8e8e93', interval: 'auto' },
      axisLine: { show: true, lineStyle: { color: '#e5e5ea' } },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', show: true, min: 0 },
    series: [{
      type: 'line',
      data: values,
      smooth: false,
      lineStyle: { color: lineColor, width: 2 },
      itemStyle: { color: lineColor },
      areaStyle: { color: areaColor },
      symbol: 'circle',
      symbolSize: 6,
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#8e8e93', type: 'dashed', width: 1 },
        label: {
          formatter: (params: any) => `均值 ¥${params.value.toFixed(2)}`,
          fontSize: 10,
          color: '#8e8e93',
          position: 'insideEndTop',
        },
        data: [{ type: 'average' }],
      },
    }],
  }
})

// Pie colors
const pieColors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#8e8e93', '#af52de', '#ff2d55']

const pieOption = computed(() => {
  const items = categoryAggregation.value.slice(0, 6).map((item, idx) => ({
    name: item.name,
    value: Math.round(item.amount / 100),
    itemStyle: { color: pieColors[idx % pieColors.length] },
  }))

  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c}' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      data: items,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#1c1c1e' },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
    }],
  }
})

function aggregateByCategory(txList: Transaction[], level: RankLevel): { name: string; icon: string; amount: number; categoryId: number }[] {
  const map = new Map<number, { name: string; icon: string; amount: number; categoryId: number }>()
  for (const tx of txList.filter((t) => t.type === 'expense')) {
    if (!tx.categoryId) continue
    const cat = categoryStore.categories.find((c) => c.id === tx.categoryId)
    if (!cat) continue

    let key: number
    let name: string
    let icon: string

    if (level === 'child' && cat.parentId !== null) {
      // 子分类聚合: 使用子分类自身
      key = cat.id!
      name = cat.name
      icon = categoryStore.categories.find((c) => c.id === cat.parentId)?.icon || ''
    } else {
      // 父分类聚合: 向上找到父分类
      const parent = cat.parentId ? categoryStore.categories.find((c) => c.id === cat.parentId) : cat
      if (!parent) continue
      key = parent.id!
      name = parent.name
      icon = parent.icon
    }

    if (!map.has(key)) map.set(key, { name, icon, amount: 0, categoryId: key })
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

const categoryAggregation = computed(() => aggregateByCategory(transactions.value, 'parent'))

const totalExpenseForPercent = computed(() => categoryAggregation.value.reduce((sum, item) => sum + item.amount, 0))

const expenseRanking = computed(() => {
  const items = rankingLevel.value === 'child'
    ? aggregateByCategory(transactions.value, 'child')
    : categoryAggregation.value
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return items.slice(0, 8).map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.amount / total) * 100) : 0,
  }))
})

const tagAggregation = computed(() => aggregateByTag(transactions.value))

const tagTotalAmount = computed(() =>
  tagAggregation.value.reduce((sum, t) => sum + t.amount, 0),
)

const router = useRouter()

function navigateToTag(tagName: string) {
  if (tagName) {
    router.push({ name: 'transactions', query: { tag: tagName, searchField: 'tag' } })
  } else {
    router.push({ name: 'transactions' })
  }
}

function navigateToCategory(item: { categoryId: number }) {
  // 仅月模式支持跳转
  if (timeMode.value !== 'month') return
  const ym = `${currentDate.value.getFullYear()}-${String(currentDate.value.getMonth() + 1).padStart(2, '0')}`
  router.push({ name: 'transactions', query: { categoryId: String(item.categoryId), yearMonth: ym } })
}

/** 大额支出: 单笔 > 1000 元 (100000 分), 按金额降序, 最多 10 条 */
const largeExpenses = computed(() => {
  const LARGE_THRESHOLD = 100000 // 1000 元 = 100000 分
  return transactions.value
    .filter((tx) => tx.type === 'expense' && tx.amount > LARGE_THRESHOLD)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((tx) => {
      const cat = tx.categoryId
        ? categoryStore.categories.find((c) => c.id === tx.categoryId)
        : null
      const parentCat = cat?.parentId
        ? categoryStore.categories.find((c) => c.id === cat.parentId)
        : null
      return {
        id: tx.id!,
        title: tx.title || cat?.name || '',
        amount: tx.amount,
        date: tx.date,
        shortDate: tx.date.slice(5), // MM-DD
        icon: parentCat?.icon || cat?.icon || '💸',
      }
    })
})

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

.overview-card.income { background: #ff3b30; }
.overview-card.expense { background: #34c759; }

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

.chart-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chart-title-row .chart-title {
  margin-bottom: 0;
}

.ranking-toggle {
  display: flex;
  background: #f2f2f7;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.toggle-btn {
  padding: 2px 10px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  color: #8e8e93;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.toggle-btn.active {
  background: #fff;
  color: #007aff;
  font-weight: 600;
}

.empty-text {
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
  color: var(--color-secondary-text);
}

/* ECharts containers */
.echart-line {
  width: 100%;
  height: 160px;
}

.echart-pie {
  width: 100%;
  height: 200px;
}

/* Trend toggle */
.trend-toggle {
  display: flex;
  background: #f2f2f7;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.trend-toggle .toggle-btn {
  padding: 3px 12px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: #8e8e93;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.trend-toggle .toggle-btn.active {
  background: #fff;
  color: #007aff;
  font-weight: 600;
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
  transition: opacity 0.15s;
}

.ranking-row.clickable {
  cursor: pointer;
}

.ranking-row.clickable:active {
  opacity: 0.5;
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
  color: #34c759;
  white-space: nowrap;
}

.ranking-pct {
  font-size: 11px;
  color: #8e8e93;
  width: 28px;
  text-align: right;
}

/* Large Expenses */
.large-expense-card {
  margin-top: 2px;
}

.large-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-separator);
}

.large-row:last-child {
  border-bottom: none;
}

.large-rank {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: #f2f2f7;
  color: #8e8e93;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.large-row:nth-child(1) .large-rank {
  background: #ff3b30;
  color: #fff;
}

.large-row:nth-child(2) .large-rank {
  background: #ff9500;
  color: #fff;
}

.large-row:nth-child(3) .large-rank {
  background: #ffcc00;
  color: #fff;
}

.large-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.large-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.large-title {
  font-size: 13px;
  font-weight: 500;
  color: #1c1c1e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.large-date {
  font-size: 11px;
  color: #8e8e93;
}

.large-amount {
  font-size: 14px;
  font-weight: 700;
  color: #ff3b30;
  white-space: nowrap;
  flex-shrink: 0;
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
  cursor: pointer;
  transition: opacity 0.15s;
  user-select: none;
}

.tag-chip:active {
  opacity: 0.6;
}

.tag-chip--total {
  background: #007aff;
  color: #fff;
}

.tag-chip--total .tag-amount {
  color: rgba(255,255,255,0.85);
}

.tag-text {
  font-weight: 500;
}

.tag-amount {
  color: #8e8e93;
  margin-left: 4px;
}
</style>