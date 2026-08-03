<template>
  <CommonBottomSheet :visible="visible" title="" @close="onCancel">
    <!-- 顶部操作栏 -->
    <div class="dt-header">
      <button class="dt-header-btn" @click="onCancel">&#x2715;</button>
      <span class="dt-header-title">选择日期和时间</span>
      <button class="dt-header-btn dt-header-confirm" @click="onConfirm">&#x2713;</button>
    </div>

    <!-- 日期选择区 -->
    <div class="dt-section">
      <div class="dt-month-nav">
        <button class="dt-nav-btn" @click="prevMonth">&#x25C0;</button>
        <span class="dt-month-label">{{ navYear }}年{{ navMonth }}月</span>
        <button class="dt-nav-btn" @click="nextMonth">&#x25B6;</button>
      </div>
      <div class="dt-date-chips">
        <button
          v-for="day in daysInMonth"
          :key="day.value"
          class="dt-date-chip"
          :class="{
            'dt-date-chip--today': day.isToday,
            'dt-date-chip--selected': day.value === localDate,
            'dt-date-chip--future': day.isFuture,
            'dt-date-chip--weekend': day.isWeekend,
          }"
          :disabled="day.isFuture"
          @click="selectDate(day.value)"
        >
          <span class="dt-date-chip-day">{{ day.dayOfMonth }}</span>
          <span class="dt-date-chip-weekday">{{ day.weekday }}</span>
        </button>
      </div>
    </div>

    <!-- 时间选择区 -->
    <div class="dt-section">
      <div class="dt-time-picker">
        <div class="dt-time-col">
          <button class="dt-time-btn" @click="adjustHour(1)" :disabled="localHour >= 23">&#x25B2;</button>
          <div class="dt-time-value">{{ String(localHour).padStart(2, '0') }}</div>
          <button class="dt-time-btn" @click="adjustHour(-1)" :disabled="localHour <= 0">&#x25BC;</button>
        </div>
        <span class="dt-time-sep">:</span>
        <div class="dt-time-col">
          <button class="dt-time-btn" @click="adjustMinute(1)" :disabled="localMinute >= 59">&#x25B2;</button>
          <div class="dt-time-value">{{ String(localMinute).padStart(2, '0') }}</div>
          <button class="dt-time-btn" @click="adjustMinute(-1)" :disabled="localMinute <= 0">&#x25BC;</button>
        </div>
      </div>
    </div>

    <!-- 快捷按钮 -->
    <div class="dt-footer">
      <button class="dt-today-btn" @click="setToNow">设为今天</button>
    </div>
  </CommonBottomSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'
import { toDateString } from '@/utils/format'

const props = defineProps<{
  date: string
  time: string
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:date', value: string): void
  (e: 'update:time', value: string): void
  (e: 'close'): void
}>()

// 本地状态（用于选择器中编辑，确认后同步到父组件）
const localDate = ref(props.date)
const localHour = ref(0)
const localMinute = ref(0)

// 导航月份
const navYear = ref(0)
const navMonth = ref(0)

const WEEKDAY_NAMES_SHORT = ['日', '一', '二', '三', '四', '五', '六']

// 初始化本地状态
function initLocal() {
  localDate.value = props.date
  const [h, m] = props.time.split(':').map(Number)
  localHour.value = h
  localMinute.value = m
  // 导航到选中日期所在月
  const d = parseLocalDate(props.date)
  navYear.value = d.getFullYear()
  navMonth.value = d.getMonth() + 1
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toLocalDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// 当月天数
const daysInMonth = computed(() => {
  const year = navYear.value
  const month = navMonth.value
  const daysCount = new Date(year, month, 0).getDate() // month is 1-based in navMonth
  const todayStr = toDateString(new Date())
  const today = new Date()

  const days = []
  for (let d = 1; d <= daysCount; d++) {
    const dateStr = toLocalDateString(year, month, d)
    const dateObj = new Date(year, month - 1, d)
    const isToday = dateStr === todayStr
    const isFuture = dateObj > new Date(today.getFullYear(), today.getMonth(), today.getDate())
    days.push({
      value: dateStr,
      dayOfMonth: d,
      weekday: WEEKDAY_NAMES_SHORT[dateObj.getDay()],
      isToday,
      isFuture,
      isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
    })
  }
  return days
})

function prevMonth() {
  if (navMonth.value === 1) {
    navYear.value--
    navMonth.value = 12
  } else {
    navMonth.value--
  }
  // 如果当前选中日在新月中不存在，调整到月末
  adjustSelectedDateToMonth()
}

function nextMonth() {
  if (navMonth.value === 12) {
    navYear.value++
    navMonth.value = 1
  } else {
    navMonth.value++
  }
  adjustSelectedDateToMonth()
}

function adjustSelectedDateToMonth() {
  const lastDay = new Date(navYear.value, navMonth.value, 0).getDate()
  const currentDay = parseLocalDate(localDate.value).getDate()
  if (currentDay > lastDay) {
    localDate.value = toLocalDateString(navYear.value, navMonth.value, lastDay)
  }
}

function selectDate(value: string) {
  localDate.value = value
}

function adjustHour(delta: number) {
  const newVal = localHour.value + delta
  if (newVal >= 0 && newVal <= 23) {
    localHour.value = newVal
  }
}

function adjustMinute(delta: number) {
  const newVal = localMinute.value + delta
  if (newVal >= 0 && newVal <= 59) {
    localMinute.value = newVal
  }
}

function setToNow() {
  const now = new Date()
  localDate.value = toDateString(now)
  localHour.value = now.getHours()
  localMinute.value = now.getMinutes()
  const d = now
  navYear.value = d.getFullYear()
  navMonth.value = d.getMonth() + 1
}

function onConfirm() {
  emit('update:date', localDate.value)
  emit('update:time', `${String(localHour.value).padStart(2, '0')}:${String(localMinute.value).padStart(2, '0')}`)
  emit('close')
}

function onCancel() {
  // 不发射 update:date/update:time，回退到之前的选择
  emit('close')
}

// 打开时初始化（immediate 确保挂载时 visible=true 也执行）
watch(() => props.visible, (v) => {
  if (v) {
    initLocal()
  }
}, { immediate: true })

// 父组件 date/time 变化时同步（如外部 reset）
watch(() => props.date, (v) => {
  if (!props.visible) {
    localDate.value = v
  }
})

watch(() => props.time, (v) => {
  if (!props.visible) {
    const [h, m] = v.split(':').map(Number)
    localHour.value = h
    localMinute.value = m
  }
})
</script>

<style scoped>
/* ── 头部操作栏 ── */
.dt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 12px;
  border-bottom: 1px solid var(--color-separator-heavy);
  margin-bottom: 16px;
}

.dt-header-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  color: var(--color-secondary-text);
  cursor: pointer;
  padding: 4px 8px;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.dt-header-confirm {
  color: var(--color-primary);
  font-size: 18px;
  font-weight: 600;
}

.dt-header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

/* ── 分区 ── */
.dt-section {
  margin-bottom: 20px;
}

/* ── 月份导航 ── */
.dt-month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 14px;
}

.dt-nav-btn {
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-secondary-text);
  cursor: pointer;
  padding: 4px 8px;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.dt-nav-btn:active {
  color: var(--color-text);
}

.dt-month-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 100px;
  text-align: center;
}

/* ── 日期芯片 ── */
.dt-date-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.dt-date-chips::-webkit-scrollbar {
  display: none;
}

.dt-date-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 44px;
  padding: 8px 6px;
  border: none;
  border-radius: 10px;
  background: var(--color-card);
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  flex-shrink: 0;
}

.dt-date-chip:active:not(:disabled) {
  transform: scale(0.95);
}

.dt-date-chip--today {
  background: var(--color-primary-light, rgba(0, 122, 255, 0.1));
  border: 1px solid var(--color-primary);
}

.dt-date-chip--selected {
  background: var(--color-primary);
  color: #fff;
}

.dt-date-chip--selected .dt-date-chip-weekday {
  color: rgba(255, 255, 255, 0.8);
}

.dt-date-chip--future {
  opacity: 0.3;
  cursor: not-allowed;
}

.dt-date-chip--weekend:not(.dt-date-chip--selected):not(.dt-date-chip--today) {
  color: var(--color-secondary-text);
}

.dt-date-chip-day {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.dt-date-chip-weekday {
  font-size: 11px;
  color: var(--color-secondary-text);
  line-height: 1;
}

/* ── 时间选择器 ── */
.dt-time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
}

.dt-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.dt-time-btn {
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-secondary-text);
  cursor: pointer;
  padding: 4px 12px;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  transition: color 0.15s;
}

.dt-time-btn:active:not(:disabled) {
  color: var(--color-primary);
}

.dt-time-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.dt-time-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  min-width: 56px;
  text-align: center;
  padding: 8px 0;
  border-radius: 10px;
  background: var(--color-card);
}

.dt-time-sep {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text);
  margin-top: -40px;
}

/* ── 底部快捷按钮 ── */
.dt-footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid var(--color-separator-heavy);
}

.dt-today-btn {
  border: none;
  background: var(--color-card);
  color: var(--color-primary);
  font-size: var(--fs-body);
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.dt-today-btn:active {
  background: var(--color-disabled-bg);
}
</style>