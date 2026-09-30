<template>
  <div class="stats-page">
    <!-- Header: 统计 + mode toggle -->
    <div class="page-header">
      <span class="page-title">统计</span>
      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: timeMode === 'week' }"
          @click="timeMode = 'week'"
        >周</button>
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
        <div class="overview-compare">
          <span class="compare-item">
            <span class="compare-label">{{ prevCompareLabel }}</span>
            <span class="compare-val" :class="trendClass(totalIncome, prevIncome)">{{ compareLabel(totalIncome, prevIncome) }}</span>
          </span>
          <span v-if="yoyRange" class="compare-item">
            <span class="compare-label">{{ yoyCompareLabel }}</span>
            <span class="compare-val" :class="trendClass(totalIncome, yoyIncome)">{{ compareLabel(totalIncome, yoyIncome) }}</span>
          </span>
        </div>
      </div>
      <div class="overview-card expense">
        <div class="overview-label">支出</div>
        <div class="overview-amount">{{ formatCurrency(totalExpense) }}</div>
        <div class="overview-compare">
          <span class="compare-item">
            <span class="compare-label">{{ prevCompareLabel }}</span>
            <span class="compare-val" :class="trendClass(totalExpense, prevExpense)">{{ compareLabel(totalExpense, prevExpense) }}</span>
          </span>
          <span v-if="yoyRange" class="compare-item">
            <span class="compare-label">{{ yoyCompareLabel }}</span>
            <span class="compare-val" :class="trendClass(totalExpense, yoyExpense)">{{ compareLabel(totalExpense, yoyExpense) }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Trend Line Chart -->
    <div class="chart-card">
      <div class="chart-title-row">
        <span class="chart-title">收支趋势</span>
        <div class="trend-toggle">
          <button
            class="toggle-btn"
            :class="{ active: trendType === 'income' }"
            @click="trendType = 'income'"
          >收入</button>
          <button
            class="toggle-btn"
            :class="{ active: trendType === 'expense' }"
            @click="trendType = 'expense'"
          >支出</button>
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
          class="ranking-row clickable"
          @click="navigateToCategory(item)"
        >
          <span class="ranking-badge" :style="{ background: rankColor(index) }">{{ rankLabel(index) }}</span>
          <span class="ranking-icon"><TwemojiIcon :emoji="item.icon" /></span>
          <span class="ranking-name">{{ item.name }}</span>
          <span class="ranking-amount">{{ formatCurrency(item.amount) }}</span>
          <span class="ranking-pct">{{ item.percent }}%</span>
        </div>
      </div>



    <!-- High Frequency Expenses -->
    <div class="chart-card freq-card">
      <div class="chart-title">高频支出</div>
      <div v-if="highFrequencyExpenses.length === 0" class="empty-text">暂无数据</div>
      <div
        v-for="(item, index) in highFrequencyExpenses"
        :key="item.categoryId"
        class="freq-row clickable"
        @click="navigateToCategory(item)"
      >
        <span class="freq-rank">{{ index + 1 }}</span>
        <span class="freq-icon"><TwemojiIcon :emoji="item.icon" /></span>
        <span class="freq-name">{{ item.name }}</span>
        <div class="freq-stats">
          <span class="freq-count">{{ item.count }}次</span>
          <span class="freq-amount">{{ formatCurrency(item.amount) }}</span>
          <span class="freq-avg">均{{ formatCurrency(item.avgAmount) }}</span>
        </div>
      </div>
    </div>

      <!-- Large Expenses -->
    <div class="chart-card large-expense-card">
      <div class="chart-title-row">
        <span class="chart-title">大额支出</span>
        <button
          class="hide-toggle"
          :class="{ active: hideCarHousing }"
          @click="hideCarHousing = !hideCarHousing"
        >屏蔽车贷房贷</button>
      </div>
      <div v-if="largeExpenses.length === 0" class="empty-text">暂无数据</div>
      <div
        v-for="(item, index) in largeExpenses"
        :key="item.id"
        class="large-row"
      >
        <span class="large-rank">{{ index + 1 }}</span>
        <span class="large-icon"><TwemojiIcon :emoji="item.icon" /></span>
        <div class="large-info">
          <span class="large-title">{{ item.title }}</span>
          <span class="large-date">{{ item.shortDate }}</span>
        </div>
        <span class="large-amount">{{ formatCurrency(item.amount) }}</span>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/uiStore'
import { db } from '@/db'
import { useCategoryStore } from '@/stores/categoryStore'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { formatCurrency } from '@/utils/format'
import VChart from 'vue-echarts'
import type { Transaction } from '@/types'
import TwemojiIcon from '@/components/common/TwemojiIcon.vue'
const categoryStore = useCategoryStore()
const uiStore = useUiStore()

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#8e8e93'
}

type RankLevel = 'parent' | 'child'

const rankingLevel = ref<RankLevel>('child')
const timeMode = ref<'month' | 'year' | 'week' | 'custom'>('month')
const trendType = ref<'expense' | 'income'>('expense')
const currentDate = ref(new Date())
const hideCarHousing = ref(false)

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
  if (timeMode.value === 'week') {
    // 所在周的周一，作为标题基准（如 9-28 所在周）
    const rStart = shiftWeek(currentDate.value, 0)
    const w = rStart.getDate()
    const ym = rStart.getMonth() + 1
    return `${rStart.getFullYear()}年${ym}月${w}日周`
  }
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

/**
 * 周模式（周一为一周起点）：返回 date 所在周的周一，offsetWeeks 支持前后整周偏移。
 * 处理跨月/跨年：基于 setDate 运算，new Date(y, m, d±n) 自动进位。
 */
function shiftWeek(date: Date, offsetWeeks: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() || 7 // getDay(): 0 周日 → 映射为 7，使周一起算
  d.setDate(d.getDate() - day + 1 + offsetWeeks * 7)
  return d
}

/** 返回 date 所在周的 {周一(start), 周日(end)} */
function weekRange(d: Date): { start: Date; end: Date } {
  const start = shiftWeek(d, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end }
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
  if (timeMode.value === 'week') {
    const r = weekRange(currentDate.value)
    return { start: toDateStr(r.start), end: toDateStr(r.end) }
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
  else if (timeMode.value === 'week') { return currentDate.value = shiftWeek(currentDate.value, -1) }
  else { d.setMonth(d.getMonth() - 1) }
  currentDate.value = d
}

function nextPeriod() {
  const d = new Date(currentDate.value)
  if (timeMode.value === 'year') { d.setFullYear(d.getFullYear() + 1) }
  else if (timeMode.value === 'week') { return currentDate.value = shiftWeek(currentDate.value, 1) }
  else { d.setMonth(d.getMonth() + 1) }
  currentDate.value = d
}

/**
 * 本期单次遍历聚合：一次性产出收入/支出合计、父分类聚合、标签聚合，
 * 避免同一份 transactions 被多个 computed 重复遍历。
 */
const periodBase = computed(() => {
  let income = 0
  let expense = 0
  const catMap = new Map<number, { name: string; icon: string; amount: number; categoryId: number }>()
  const tagMap = new Map<string, number>()
  const catById = new Map(categoryStore.categories.map((c) => [c.id, c]))

  for (const tx of transactions.value) {
    if (tx.type === 'income') {
      income += tx.amount
      continue
    }
    if (tx.type !== 'expense') continue
    expense += tx.amount

    // 父分类聚合（向上归并到父分类）
    if (tx.categoryId) {
      const cat = catById.get(tx.categoryId)
      if (cat) {
        const parent = cat.parentId ? (catById.get(cat.parentId) ?? cat) : cat
        if (parent?.id != null) {
          const entry = catMap.get(parent.id) ?? { name: parent.name, icon: parent.icon, amount: 0, categoryId: parent.id }
          entry.amount += tx.amount
          catMap.set(parent.id, entry)
        }
      }
    }

    // 标签聚合
    for (const tag of tx.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + tx.amount)
    }
  }

  const categoryAggregation = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount)
  const tagAggregation = Array.from(tagMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  return { income, expense, categoryAggregation, tagAggregation }
})

const totalIncome = computed(() => periodBase.value.income)
const totalExpense = computed(() => periodBase.value.expense)

// ---------- 环比 / 同比 对比区间 ----------

/** 自选模式跨越的月数（本期长度），月=1、年=12 */
const customSpanMonths = computed(() => {
  if (timeMode.value === 'month') return 1
  if (timeMode.value === 'year') return 12
  return (customRange.endYear - customRange.startYear) * 12 + (customRange.endMonth - customRange.startMonth) + 1
})

/** 把一个年月平移 delta 个月，返回 {year, month} */
function shiftYM(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

/**
 * 环比区间：与本期长度完全相同的「紧邻上一段」。
 * 月→上月整月；年→上年整年；自选→整体前移 N 个月。
 */
const prevRange = computed(() => {
  if (timeMode.value === 'year') {
    return {
      start: toDateStr(startOfYear(new Date(currentDate.value.getFullYear() - 1, 0))),
      end: toDateStr(endOfYear(new Date(currentDate.value.getFullYear() - 1, 0))),
    }
  }
  if (timeMode.value === 'custom') {
    const span = customSpanMonths.value
    const prevStart = shiftYM(customRange.startYear, customRange.startMonth, -span)
    const endYm = shiftYM(prevStart.year, prevStart.month, span - 1)
    const start = new Date(prevStart.year, prevStart.month - 1, 1)
    const end = new Date(endYm.year, endYm.month, 0)
    return { start: toDateStr(start), end: toDateStr(end) }
  }
  if (timeMode.value === 'week') {
    const r = weekRange(shiftWeek(currentDate.value, -1))
    return { start: toDateStr(r.start), end: toDateStr(r.end) }
  }
  // month
  const prev = shiftYM(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, -1)
  return { start: toDateStr(new Date(prev.year, prev.month - 1, 1)), end: toDateStr(new Date(prev.year, prev.month, 0)) }
})

/**
 * 同比区间：去年同一期。仅月/自选有意义（长度固定为整数月）。
 * 年模式本身即年粒度，返回 null（不展示同比）。
 */
const yoyRange = computed(() => {
  if (timeMode.value === 'year') return null
  if (timeMode.value === 'custom') {
    const start = new Date(customRange.startYear - 1, customRange.startMonth - 1, 1)
    const end = new Date(customRange.endYear - 1, customRange.endMonth, 0)
    return { start: toDateStr(start), end: toDateStr(end) }
  }
  if (timeMode.value === 'week') {
    // 同比 = 去年当前日期的所在完整自然周（对齐周一起算）
    const sameWeekLastYear = new Date(currentDate.value.getFullYear() - 1, currentDate.value.getMonth(), currentDate.value.getDate())
    const r = weekRange(sameWeekLastYear)
    return { start: toDateStr(r.start), end: toDateStr(r.end) }
  }
  // month
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth() + 1
  return { start: toDateStr(new Date(y - 1, m - 1, 1)), end: toDateStr(new Date(y - 1, m, 0)) }
})

/** 环比交易（仅当区间有效且非空时展示箭头） */
const prevTransactions = useLiveQuery<Transaction[]>(() => {
  const r = prevRange.value
  return db.transactions.where('date').between(r.start, r.end, true, true).reverse().toArray()
}, [])

/** 同比交易 */
const yoyTransactions = useLiveQuery<Transaction[]>(() => {
  const r = yoyRange.value
  if (!r) return Promise.resolve([])
  return db.transactions.where('date').between(r.start, r.end, true, true).reverse().toArray()
}, [])

// 环比、同比合计：各自单次遍历同时求得收入/支出，避免两次 filter+reduce
const prevTotals = computed(() => {
  let income = 0
  let expense = 0
  for (const tx of prevTransactions.value) {
    if (tx.type === 'income') income += tx.amount
    else if (tx.type === 'expense') expense += tx.amount
  }
  return { income, expense }
})
const yoyTotals = computed(() => {
  let income = 0
  let expense = 0
  for (const tx of yoyTransactions.value) {
    if (tx.type === 'income') income += tx.amount
    else if (tx.type === 'expense') expense += tx.amount
  }
  return { income, expense }
})

const prevIncome = computed(() => prevTotals.value.income)
const prevExpense = computed(() => prevTotals.value.expense)
const yoyIncome = computed(() => yoyTotals.value.income)
const yoyExpense = computed(() => yoyTotals.value.expense)

/** 百分比变化，prev 为 0 或空返回 null（展示占位） */
function pctChange(cur: number, prev: number): number | null {
  if (!prev) return cur > 0 ? 100 : null
  return Math.round(((cur - prev) / prev) * 100)
}

/** 本期的环比/同比标签文字，供模板直接渲染 */
function compareLabel(cur: number, prev: number): string {
  const pct = pctChange(cur, prev)
  if (pct === null) return '—'
  return `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}%`
}

/** 对比箭头配色：上涨红色、下跌绿色、无变化/空数据灰色 */
function trendClass(cur: number, prev: number): string {
  const pct = pctChange(cur, prev)
  if (pct === null || pct === 0) return 'flat'
  return pct > 0 ? 'up' : 'down'
}

/** 环比标签文案，随模式变化 */
const prevCompareLabel = computed(() => {
  if (timeMode.value === 'year') return '环比上年'
  if (timeMode.value === 'custom') return '环比上一区间'
  if (timeMode.value === 'week') return '环比上周'
  return '环比上月'
})

/** 同比标签（周模式语义更具体） */
const yoyCompareLabel = computed(() => (timeMode.value === 'week' ? '同比去年同周' : '同比去年'))

const lineOption = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _theme = uiStore.theme // ensure recompute on theme change
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
  } else if (timeMode.value === 'week') {
    // Week: 周一~周日，7 个点（跨月周照常显示）
    const { start } = weekRange(currentDate.value)
    const allDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      allDates.push(toDateStr(d))
    }
    const dailyMap = new Map<string, number>()
    for (const tx of transactions.value) {
      if (tx.type !== txType) continue
      dailyMap.set(tx.date, (dailyMap.get(tx.date) || 0) + tx.amount)
    }
    const WEEK = ['一', '二', '三', '四', '五', '六', '日']
    categories = allDates.map(d => {
      const p = d.split('-')
      return `周${WEEK[(new Date(d + 'T00:00:00').getDay() || 7) - 1]}·${parseInt(p[2])}`
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
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: cssVar('--color-card'),
      borderColor: cssVar('--color-separator'),
      textStyle: { color: cssVar('--color-text'), fontSize: 12 },
      valueFormatter: (v: number) => `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    grid: { left: 8, right: 8, top: 8, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 10, color: cssVar('--color-secondary-text'), interval: 'auto' },
      axisLine: { show: true, lineStyle: { color: cssVar('--color-separator') } },
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
        lineStyle: { color: cssVar('--color-secondary-text'), type: 'dashed', width: 1 },
        label: {
          formatter: (params: any) => `均值 ¥${params.value.toFixed(2)}`,
          fontSize: 10,
          color: cssVar('--color-secondary-text'),
          position: 'insideEndTop',
        },
        data: [{ type: 'average' }],
      },
    }],
  }
})

// 统一图表色板：前 3 项为排行榜前三渐变，其余为饼图补充色
const chartColors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#8e8e93', '#af52de', '#ff2d55']

const pieOption = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _theme = uiStore.theme // ensure recompute on theme change
  const items = categoryAggregation.value.slice(0, 6).map((item, idx) => ({
    name: item.name,
    value: Math.round(item.amount / 100),
    itemStyle: { color: chartColors[idx % chartColors.length] },
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c}', backgroundColor: cssVar('--color-card'), borderColor: cssVar('--color-separator'), textStyle: { color: cssVar('--color-text') } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      data: items,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: cssVar('--color-text') },
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

const categoryAggregation = computed(() => periodBase.value.categoryAggregation)

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

const tagAggregation = computed(() => periodBase.value.tagAggregation)

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
  // 月/年/自选均支持跳转，带本期日期范围 to from/to 参数到明细页
  const r = dateRange.value
  router.push({ name: 'transactions', query: { categoryId: String(item.categoryId), from: r.start, to: r.end } })
}

/** 需要屏蔽的二级分类 ID（车贷房贷相关） */
const excludedCategoryIds = computed(() => {
  const ids = new Set<number>()
  const cats = categoryStore.categories
  // "居住" → "房租房贷"
  const livingParent = cats.find((c) => c.type === 'expense' && c.parentId === null && c.name === '居住')
  if (livingParent) {
    const rentChild = cats.find((c) => c.parentId === livingParent.id && c.name === '房租房贷')
    if (rentChild) ids.add(rentChild.id!)
  }
  // "特别" → "购车"、"购房"
  const specialParent = cats.find((c) => c.type === 'expense' && c.parentId === null && c.name === '特别')
  if (specialParent) {
    for (const name of ['购车', '购房']) {
      const child = cats.find((c) => c.parentId === specialParent.id && c.name === name)
      if (child) ids.add(child.id!)
    }
  }
  return ids
})

/** 大额支出: 单笔 > 1000 元 (100000 分), 按金额降序, 最多 10 条 */
const largeExpenses = computed(() => {
  const LARGE_THRESHOLD = 100000 // 1000 元 = 100000 分
  return transactions.value
    .filter((tx) => {
      if (tx.type !== 'expense' || tx.amount <= LARGE_THRESHOLD) return false
      if (hideCarHousing.value && tx.categoryId != null && excludedCategoryIds.value.has(tx.categoryId)) return false
      return true
    })
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

/** 高频支出: 按二级分类聚合, 按交易次数降序, 取前 8 条 */
const highFrequencyExpenses = computed(() => {
  const map = new Map<number, { name: string; icon: string; count: number; amount: number; categoryId: number }>()

  for (const tx of transactions.value) {
    if (tx.type !== 'expense' || !tx.categoryId) continue
    const cat = categoryStore.categories.find((c) => c.id === tx.categoryId)
    if (!cat || cat.parentId === null) continue // 仅统计二级分类

    const parent = categoryStore.categories.find((c) => c.id === cat.parentId)
    const entry = map.get(tx.categoryId)
    if (entry) {
      entry.count++
      entry.amount += tx.amount
    } else {
      map.set(tx.categoryId, {
        name: cat.name,
        icon: parent?.icon || cat.icon,
        count: 1,
        amount: tx.amount,
        categoryId: tx.categoryId,
      })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      avgAmount: Math.round(item.amount / item.count),
    }))
})

function rankColor(index: number): string {
  return chartColors[index] || '#8e8e93'
}

function rankLabel(index: number): string {
  return String(index + 1)
}
</script>

<style scoped>
.stats-page {
  padding: 16px;
  background: transparent;
  /* min-height 用视口高度单位（% 相对 auto 高度父级会失效）：
     内容不足一屏时也撑满整屏，避免底部露出背景空白 */
  min-height: 100%;
  min-height: 100svh;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.page-title {
  font-size: var(--fs-page-title);
  font-weight: 700;
  color: var(--color-text);
}

.mode-toggle {
  display: flex;
  background: var(--color-card);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.mode-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  font-size: var(--fs-small);
  font-weight: 500;
  color: var(--color-secondary-text);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.mode-btn.active {
  background: var(--color-primary);
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
  font-size: var(--fs-title);
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
  font-size: var(--fs-title);
  font-weight: 600;
  color: var(--color-text);
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

.overview-card.income { background: var(--color-destructive); }
.overview-card.expense { background: var(--color-success); }

.overview-label {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 2px;
}

.overview-amount {
  font-size: var(--fs-hero);
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.overview-compare {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 5px;
  align-items: center;
}

.compare-item {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
}

.compare-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.compare-val {
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.compare-val.up { color: #ffcc00; }
.compare-val.down { color: #a4f2c8; }
.compare-val.flat { color: rgba(255, 255, 255, 0.55); }

/* Chart Cards */
.chart-card {
  background: var(--glass-highlight), var(--color-card);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
}

.chart-title {
  font-size: var(--fs-ui);
  font-weight: 600;
  color: var(--color-text);
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
  background: var(--color-bg);
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
  color: var(--color-secondary-text);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.toggle-btn.active {
  background: var(--color-surface);
  color: var(--color-primary);
  font-weight: 600;
}

.hide-toggle {
  padding: 3px 10px;
  border: 1px solid var(--color-placeholder);
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-secondary-text);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
}

.hide-toggle.active {
  background: var(--color-destructive);
  border-color: var(--color-destructive);
  color: #fff;
  font-weight: 600;
}

.empty-text {
  text-align: center;
  padding: 24px 0;
  font-size: var(--fs-body);
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
  background: var(--color-bg);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.trend-toggle .toggle-btn {
  padding: 3px 12px;
  border: none;
  background: transparent;
  font-size: var(--fs-small);
  font-weight: 500;
  color: var(--color-secondary-text);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.trend-toggle .toggle-btn.active {
  background: var(--color-surface);
  color: var(--color-primary);
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
  font-size: var(--fs-micro);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ranking-icon {
  font-size: var(--fs-body);
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.ranking-name {
  flex: 1;
  font-size: var(--fs-ui);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-amount {
  font-size: var(--fs-ui);
  font-weight: 600;
  color: var(--color-success);
  white-space: nowrap;
}

.ranking-pct {
  font-size: 11px;
  color: var(--color-secondary-text);
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
  background: var(--color-bg);
  color: var(--color-secondary-text);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.large-row:nth-child(1) .large-rank {
  background: var(--color-destructive);
  color: #fff;
}

.large-row:nth-child(2) .large-rank {
  background: var(--color-warning);
  color: #fff;
}

.large-row:nth-child(3) .large-rank {
  background: #ffcc00;
  color: #fff;
}

.large-icon {
  font-size: var(--fs-amount);
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
  font-size: var(--fs-ui);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.large-date {
  font-size: 11px;
  color: var(--color-secondary-text);
}

.large-amount {
  font-size: var(--fs-body);
  font-weight: 700;
  color: var(--color-destructive);
  white-space: nowrap;
  flex-shrink: 0;
}

/* High Frequency Expenses */
.freq-card {
  margin-top: 2px;
}

.freq-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid var(--color-separator);
}

.freq-row:last-child {
  border-bottom: none;
}

.freq-row.clickable {
  cursor: pointer;
}

.freq-row.clickable:active {
  opacity: 0.5;
}

.freq-rank {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-secondary-text);
  font-size: var(--fs-micro);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.freq-row:nth-child(1) .freq-rank {
  background: var(--color-destructive);
  color: #fff;
}

.freq-row:nth-child(2) .freq-rank {
  background: var(--color-warning);
  color: #fff;
}

.freq-row:nth-child(3) .freq-rank {
  background: #ffcc00;
  color: #fff;
}

.freq-icon {
  font-size: var(--fs-body);
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.freq-name {
  flex: 1;
  font-size: var(--fs-ui);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.freq-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.freq-count {
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
}

.freq-amount {
  font-size: var(--fs-ui);
  font-weight: 600;
  color: var(--color-success);
  white-space: nowrap;
}

.freq-avg {
  font-size: 11px;
  color: var(--color-secondary-text);
  white-space: nowrap;
}

/* Tags */
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  background: var(--color-bg);
  border-radius: 10px;
  padding: 6px 14px;
  font-size: var(--fs-ui);
  color: var(--color-text);
  cursor: pointer;
  transition: opacity 0.15s;
  user-select: none;
}

.tag-chip:active {
  opacity: 0.6;
}

.tag-chip--total {
  background: var(--color-primary);
  color: #fff;
}

.tag-chip--total .tag-amount {
  color: rgba(255,255,255,0.85);
}

.tag-text {
  font-weight: 500;
}

.tag-amount {
  color: var(--color-secondary-text);
  margin-left: 4px;
}
</style>