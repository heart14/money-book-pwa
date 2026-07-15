<script setup lang="ts">
import { computed, watch, ref, shallowRef } from 'vue'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import * as echarts from 'echarts'
import VChart from 'vue-echarts'
import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/pie'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'

const tStore = useTransactionStore()
const catStore = useCategoryStore()

const selectedMonth = ref(new Date().toISOString().slice(0, 7))

// Monthly bar chart
const barOption = computed(() => {
  const monthData = getMonthData(selectedMonth.value)
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: monthData.dates },
    yAxis: { type: 'value' },
    series: [
      { name: '支出', type: 'bar', data: monthData.expenses, itemStyle: { color: '#ee0a24' } },
      { name: '收入', type: 'bar', data: monthData.incomes, itemStyle: { color: '#07c160' } },
    ],
    grid: { left: 40, right: 16, top: 20, bottom: 24 },
  }
})

// Category pie chart (current month)
const pieOption = computed(() => {
  const transactions = tStore.transactions ?? []
  const monthly = transactions.filter(
    t => t.type === 'expense' && t.date.startsWith(selectedMonth.value)
  )
  const cats = catStore.categories ?? []
  const grouped: Record<string, number> = {}
  monthly.forEach(t => {
    const cat = cats.find(c => c.id === t.categoryId)
    const parent = cat ? cats.find(c => c.id === cat.parentId) : null
    const key = parent ? `${parent.icon} ${parent.name}` : '未分类'
    grouped[key] = (grouped[key] || 0) + t.amount
  })
  const data = Object.entries(grouped).map(([name, value]) => ({ name, value }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c}' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        data,
        label: { show: true, formatter: '{b}\n{d}%' },
      },
    ],
  }
})

function getMonthData(month: string) {
  const daysInMonth = new Date(Number(month), Number(month.split('-')[1]), 0).getDate()
  const dates = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
  const expenses = new Array(daysInMonth).fill(0)
  const incomes = new Array(daysInMonth).fill(0)

  const transactions = tStore.transactions ?? []
  transactions
    .filter(t => t.date.startsWith(month))
    .forEach(t => {
      const day = parseInt(t.date.split('-')[2]) - 1
      if (t.type === 'expense') expenses[day] += t.amount
      else if (t.type === 'income') incomes[day] += t.amount
    })

  return { dates, expenses, incomes }
}

function prevMonth() {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  selectedMonth.value = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

function nextMonth() {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  selectedMonth.value = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}
</script>

<template>
  <div class="expense-chart">
    <div class="month-nav">
      <van-button size="small" plain @click="prevMonth">‹ 上月</van-button>
      <span class="month-label">{{ selectedMonth }}</span>
      <van-button size="small" plain @click="nextMonth">下月 ›</van-button>
    </div>
    <VChart class="chart" :option="barOption" autoresize />
    <div class="section-title">分类占比</div>
    <VChart class="chart pie" :option="pieOption" autoresize />
  </div>
</template>

<style scoped>
.expense-chart {
  padding: 16px;
}
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}
.month-label {
  font-size: 16px;
  font-weight: 600;
}
.chart {
  height: 240px;
  margin-bottom: 16px;
}
.chart.pie {
  height: 280px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
</style>