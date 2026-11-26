<template>
  <div class="stats-page">
    <!-- 沉浸式头部 -->
    <header class="st-head">
      <span class="st-title">统计</span>
      <div class="st-mode">
        <button class="st-mode-btn" :class="{ on: timeMode === 'week' }" @click="timeMode = 'week'">周</button>
        <button class="st-mode-btn" :class="{ on: timeMode === 'month' }" @click="timeMode = 'month'">月</button>
        <button class="st-mode-btn" :class="{ on: timeMode === 'year' }" @click="timeMode = 'year'">年</button>
        <button class="st-mode-btn" :class="{ on: timeMode === 'custom' }" @click="timeMode = 'custom'">自选</button>
      </div>
    </header>

    <!-- 期间选择 -->
    <template v-if="timeMode === 'custom'">
      <div class="st-period st-period--custom">
        <span class="st-period-label">从</span>
        <button class="st-period-nav" @click="customRange.startMonth--; if(customRange.startMonth<1){customRange.startMonth=12;customRange.startYear--}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="st-period-label sm">{{ customRange.startYear }}年{{ customRange.startMonth }}月</span>
        <button class="st-period-nav" @click="customRange.startMonth++; if(customRange.startMonth>12){customRange.startMonth=1;customRange.startYear++}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
        <span class="st-period-label sm">至</span>
        <button class="st-period-nav" @click="customRange.endMonth--; if(customRange.endMonth<1){customRange.endMonth=12;customRange.endYear--}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="st-period-label sm">{{ customRange.endYear }}年{{ customRange.endMonth }}月</span>
        <button class="st-period-nav" @click="customRange.endMonth++; if(customRange.endMonth>12){customRange.endMonth=1;customRange.endYear++}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
      </div>
    </template>
    <template v-else>
      <div class="st-period">
        <button class="st-period-nav" @click="prevPeriod">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="st-period-label">{{ periodLabel }}</span>
        <button class="st-period-nav" @click="nextPeriod">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
      </div>
    </template>

    <!-- 收支 hero：本月支出大数字 + 收入副行 -->
    <div class="st-hero glass">
      <span class="st-hero-label">本期支出</span>
      <div class="st-hero-amount num c-exp">{{ formatCurrency(totalExpense) }}</div>
      <div class="st-hero-comps">
        <span class="st-hero-comp">
          <span class="st-hero-comp-label">{{ prevCompareLabel }}</span>
          <span class="st-hero-comp-val" :class="trendClass(totalExpense, prevExpense)">{{ compareLabel(totalExpense, prevExpense) }}</span>
        </span>
        <span v-if="yoyRange" class="st-hero-comp">
          <span class="st-hero-comp-label">{{ yoyCompareLabel }}</span>
          <span class="st-hero-comp-val" :class="trendClass(totalExpense, yoyExpense)">{{ compareLabel(totalExpense, yoyExpense) }}</span>
        </span>
      </div>
      <div class="st-hero-sub">
        <span>期间收入 <b class="num c-inc">{{ formatCurrency(totalIncome) }}</b></span>
      </div>
    </div>

    <!-- 收支趋势 -->
    <section class="st-block glass">
      <div class="st-block-row">
        <span class="st-label">收支趋势</span>
        <div class="st-seg">
          <button class="st-seg-btn" :class="{ on: trendType === 'income' }" @click="trendType = 'income'">收入</button>
          <button class="st-seg-btn" :class="{ on: trendType === 'expense' }" @click="trendType = 'expense'">支出</button>
        </div>
      </div>
      <v-chart class="echart-line" :option="lineOption" autoresize />
    </section>

    <!-- 支出构成（饼图） -->
    <section class="st-block glass">
      <span class="st-label">支出构成</span>
      <v-chart class="echart-pie" :option="pieOption" autoresize />
    </section>

    <!-- 支出排行 -->
    <section class="st-block glass">
      <div class="st-block-row">
        <span class="st-label">支出排行</span>
        <div class="st-seg">
          <button class="st-seg-btn" :class="{ on: rankingLevel === 'parent' }" @click="rankingLevel = 'parent'">一级</button>
          <button class="st-seg-btn" :class="{ on: rankingLevel === 'child' }" @click="rankingLevel = 'child'">二级</button>
        </div>
      </div>
      <div v-if="expenseRanking.length === 0" class="st-empty">暂无数据</div>
      <div v-else class="st-rows">
        <div v-for="(item, index) in expenseRanking" :key="item.categoryId + '-' + rankingLevel" class="st-rank-row clickable" @click="navigateToCategory(item)">
          <span class="st-rank-badge" :style="{ background: rankColor(index) }">{{ rankLabel(index) }}</span>
          <span class="st-rank-icon"><TwemojiIcon :emoji="item.icon" /></span>
          <span class="st-rank-name">{{ item.name }}</span>
          <span class="st-rank-pct">{{ item.percent }}%</span>
          <span class="num st-rank-amt">{{ formatCurrency(item.amount) }}</span>
        </div>
      </div>
    </section>

    <!-- 高频支出 -->
    <section class="st-block glass">
      <span class="st-label">高频支出</span>
      <div v-if="highFrequencyExpenses.length === 0" class="st-empty">暂无数据</div>
      <div v-else class="st-rows">
        <div v-for="(item, index) in highFrequencyExpenses" :key="item.categoryId" class="st-rank-row clickable" @click="navigateToCategory(item)">
          <span class="st-rank-num">{{ index + 1 }}</span>
          <span class="st-rank-icon"><TwemojiIcon :emoji="item.icon" /></span>
          <span class="st-rank-name">{{ item.name }}</span>
          <div class="st-freq">
            <span class="st-freq-count">{{ item.count }}次</span>
            <span class="num st-freq-amt">{{ formatCurrency(item.amount) }}</span>
            <span class="st-freq-avg">均{{ formatCurrency(item.avgAmount) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 大额支出 -->
    <section class="st-block glass">
      <div class="st-block-row">
        <span class="st-label">大额支出</span>
        <button class="st-hide" :class="{ on: hideCarHousing }" @click="hideCarHousing = !hideCarHousing">屏蔽车贷房贷</button>
      </div>
      <div v-if="largeExpenses.length === 0" class="st-empty">暂无数据</div>
      <div v-else class="st-rows">
        <div v-for="(item, index) in largeExpenses" :key="item.id" class="st-rank-row">
          <span class="st-rank-num">{{ index + 1 }}</span>
          <span class="st-rank-icon"><TwemojiIcon :emoji="item.icon" /></span>
          <div class="st-large-info">
            <span class="st-large-title">{{ item.title }}</span>
            <span class="st-large-date">{{ item.shortDate }}</span>
          </div>
          <span class="num st-rank-amt">{{ formatCurrency(item.amount) }}</span>
        </div>
      </div>
    </section>

    <!-- 标签聚合 -->
    <section class="st-block glass">
      <span class="st-label">标签聚合</span>
      <div v-if="tagAggregation.length === 0" class="st-empty">暂无数据</div>
      <div v-else class="st-tags">
        <div class="st-tag st-tag--total" @click="navigateToTag('')">
          <span class="st-tag-text">汇总</span>
          <span class="num st-tag-amt">{{ formatCurrency(tagTotalAmount) }}</span>
        </div>
        <div v-for="tag in tagAggregation" :key="tag.name" class="st-tag" @click="navigateToTag(tag.name)">
          <span class="st-tag-text">#{{ tag.name }}</span>
          <span class="num st-tag-amt">{{ formatCurrency(tag.amount) }}</span>
        </div>
      </div>
    </section>
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
  const lineColor = txType === 'expense' ? '#d5503c' : '#17a065'
  const areaColor = txType === 'expense' ? 'rgba(213,80,60,0.12)' : 'rgba(23,160,101,0.12)'

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
const chartColors = ['#d5503c', '#e0992e', '#e2b93b', '#17a065', '#2e9e9b', '#9a5e9e', '#5d6570', '#b34a3a']

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
  // 跳到顶层 Tab（明细）用 replace，不往 history 栈压入记录，
  // 避免“左右边缘滑动前进/后退”能在顶层 Tab 间来回切换。
  if (tagName) {
    router.replace({ name: 'transactions', query: { tag: tagName, searchField: 'tag' } })
  } else {
    router.replace({ name: 'transactions' })
  }
}

function navigateToCategory(item: { categoryId: number }) {
  // 月/年/自选均支持跳转，带本期日期范围 to from/to 参数到明细页（同理用 replace）
  const r = dateRange.value
  router.replace({ name: 'transactions', query: { categoryId: String(item.categoryId), from: r.start, to: r.end } })
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
  return chartColors[index] || '#5d6570'
}

function rankLabel(index: number): string {
  return String(index + 1)
}
</script>

<style scoped>
.stats-page {
  min-height: 100%;
  min-height: 100svh;
  padding: 0 24px 24px;
  background: transparent;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

/* ── 沉浸式头部 ── */
.st-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 2px 8px; }
.st-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); }
.st-mode { display: flex; background: var(--act-bg); border-radius: 10px; padding: 3px; gap: 2px; }
.st-mode-btn { padding: 5px 12px; border: none; background: transparent; font-size: 12px; font-weight: 500; color: var(--ink3); border-radius: 8px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.st-mode-btn.on { background: var(--ink); color: var(--accent-fg); font-weight: 600; }

/* ── 期间选择 ── */
.st-period { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px 2px 0; }
.st-period--custom { gap: 4px; flex-wrap: nowrap; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
.st-period--custom .st-period-nav { width: 26px; height: 30px; flex-shrink: 0; }
.st-period--custom .st-period-label { gap: 0; margin: 0 2px; min-width: auto; }
.st-period--custom .st-period-label.sm { font-size: 14px; flex-shrink: 0; }
.st-period-nav { width: 32px; height: 32px; border: 1px solid var(--line); background: none; color: var(--ink2); display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 999px; -webkit-tap-highlight-color: transparent; transition: background 0.15s; }
.st-period-nav:active { background: var(--act-bg); }
.st-period-label { font-size: 15px; font-weight: 600; color: var(--ink); min-width: 104px; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 2px; }

/* ── 收支 hero ── */
.st-hero { padding: 20px 18px 24px; border-radius: var(--radius-big); margin: 8px 0 30px; }
.st-hero-label { font-size: 13px; color: var(--ink2); font-weight: 600; letter-spacing: 0.3px; }
.st-hero-amount { font-size: 58px; font-weight: 800; letter-spacing: -0.04em; margin: 8px 0 10px; font-variant-numeric: tabular-nums; line-height: 1.1; }
.c-inc { color: var(--inc); }
.c-exp { color: var(--exp); }
.st-hero-comps { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-bottom: 14px; align-items: center; }
.st-hero-comp { display: inline-flex; align-items: baseline; gap: 5px; }
.st-hero-comp-label { font-size: 11px; color: var(--ink3); }
.st-hero-comp-val { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.st-hero-comp-val.up { color: var(--inc); }
.st-hero-comp-val.down { color: var(--exp); }
.st-hero-comp-val.flat { color: var(--ink3); }
.st-hero-sub { font-size: 12px; color: var(--ink3); }
.st-hero-sub b { font-weight: 700; }

/* ── 连续区块 ── */
.st-block { padding: 18px; border-radius: var(--radius-big); margin-bottom: 20px; }
.st-block-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.st-label { font-size: 13px; font-weight: 600; color: var(--ink2); margin-bottom: 16px; display: block; }
.st-block-row .st-label { margin-bottom: 0; }
.st-seg { display: flex; background: var(--act-bg); border-radius: 8px; padding: 2px; gap: 2px; }
.st-seg-btn { padding: 3px 12px; border: none; background: transparent; font-size: 12px; font-weight: 500; color: var(--ink3); border-radius: 6px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.st-seg-btn.on { background: var(--ink); color: var(--accent-fg); font-weight: 600; }
.st-hide { padding: 4px 12px; border: 1px solid var(--line); background: none; font-size: 11px; font-weight: 500; color: var(--ink2); border-radius: 999px; cursor: pointer; transition: all 0.15s; font-family: inherit; white-space: nowrap; }
.st-hide.on { background: var(--exp); border-color: var(--exp); color: var(--accent-fg); font-weight: 600; }
.st-empty { text-align: center; padding: 30px 0; font-size: 14px; color: var(--ink3); }

/* ECharts 容器 */
.echart-line { width: 100%; height: 160px; }
.echart-pie { width: 100%; height: 200px; }

/* ── 连续排行行 ── */
.st-rows { }
.st-rank-row { display: flex; align-items: center; gap: 12px; padding: 14px 0; }
.st-rank-row + .st-rank-row { border-top: 1px solid var(--line-soft); }
.st-rank-row.clickable { cursor: pointer; }
.st-rank-row.clickable:active { background: var(--act-bg); }
.st-rank-badge { width: 18px; height: 18px; border-radius: 6px; color: var(--accent-fg); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.st-rank-num { width: 18px; height: 18px; font-size: 12px; font-weight: 700; color: var(--ink2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.st-rank-icon { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }
.st-rank-name { flex: 1; font-size: 14px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-rank-pct { font-size: 11px; color: var(--ink3); width: 36px; text-align: right; flex-shrink: 0; }
.st-rank-amt { font-size: 14px; font-weight: 700; color: var(--exp); white-space: nowrap; font-variant-numeric: tabular-nums; }

/* 高频支出 */
.st-freq { display: flex; align-items: baseline; gap: 8px; flex-shrink: 0; }
.st-freq-count { font-size: 12px; font-weight: 600; color: var(--ink); white-space: nowrap; }
.st-freq-amt { font-size: 13px; font-weight: 700; color: var(--exp); white-space: nowrap; font-variant-numeric: tabular-nums; }
.st-freq-avg { font-size: 11px; color: var(--ink3); white-space: nowrap; }

/* 大额支出 */
.st-large-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.st-large-title { font-size: 14px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-large-date { font-size: 11px; color: var(--ink3); }

/* 标签聚合 */
.st-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.st-tag { background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 7px 14px; font-size: 13px; color: var(--ink2); cursor: pointer; transition: all 0.15s; user-select: none; -webkit-tap-highlight-color: transparent; }
.st-tag:active { opacity: 0.6; }
.st-tag--total { background: var(--ink); border-color: var(--ink); color: var(--accent-fg); }
.st-tag--total .st-tag-amt { color: var(--accent-fg); opacity: 0.85; }
.st-tag-text { font-weight: 500; }
.st-tag-amt { color: var(--ink3); margin-left: 4px; font-variant-numeric: tabular-nums; }
.st-tag--total .st-tag-amt { color: var(--accent-fg); opacity: 0.85; }
</style>