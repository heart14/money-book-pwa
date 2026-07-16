<template>
  <div class="chart-card">
    <div v-if="title" class="chart-title">{{ title }}</div>
    <div ref="chartRef" class="chart-container" :style="{ height }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = withDefaults(defineProps<{
  type: 'bar' | 'pie'
  data: any
  height?: string
  title?: string
}>(), {
  height: '300px',
})

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

function buildOption(): echarts.EChartsOption {
  if (props.type === 'pie') {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}: ¥${params.value} (${params.percent}%)`
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 12,
          },
          labelLine: {
            show: true,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.15)',
            },
          },
          data: props.data,
        },
      ],
    }
  }

  // bar chart
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return ''
        return params
          .map((p: any) => `${p.seriesName}: ¥${(p.value / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`)
          .join('<br/>')
      },
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '20%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.data.categories || [],
      axisLabel: {
        fontSize: 11,
        rotate: props.data.categories?.length > 10 ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => `¥${(v / 100).toLocaleString('zh-CN')}`,
      },
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: '#34c759',
          borderRadius: [4, 4, 0, 0],
        },
        data: props.data.income || [],
      },
      {
        name: '支出',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: '#ff3b30',
          borderRadius: [4, 4, 0, 0],
        },
        data: props.data.expense || [],
      },
    ],
  }
}

function updateChart() {
  if (!chartInstance) return
  const option = buildOption()
  chartInstance.setOption(option, true)
}

onMounted(() => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  updateChart()
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onUnmounted(() => {
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.chart-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 16px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.chart-container {
  width: 100%;
  min-height: 200px;
}
</style>