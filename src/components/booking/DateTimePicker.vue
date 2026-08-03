<template>
  <CommonBottomSheet :visible="visible" title="" @close="onCancel">
    <!-- 顶部操作栏 -->
    <div class="dt-header">
      <button class="dt-header-btn" @click="onCancel">
        <span class="dt-header-btn-icon">✕</span>
      </button>
      <span class="dt-header-title">选择日期和时间</span>
      <button class="dt-header-btn dt-header-confirm" @click="onConfirm">
        <span class="dt-header-btn-icon">✓</span>
      </button>
    </div>

    <!-- 日历区 -->
    <div class="dt-calendar">
      <!-- 月份导航 -->
      <div class="dt-month-nav">
        <button class="dt-nav-btn" @click="prevMonth" aria-label="上个月">
          <span class="dt-nav-arrow">◀</span>
        </button>
        <span class="dt-month-label">{{ navYear }}年 {{ navMonth }}月</span>
        <button class="dt-nav-btn" @click="nextMonth" aria-label="下个月">
          <span class="dt-nav-arrow">▶</span>
        </button>
      </div>

      <!-- 星期行 -->
      <div class="dt-weekdays">
        <span v-for="w in weekdays" :key="w" class="dt-weekday">{{ w }}</span>
      </div>

      <!-- 日期网格 -->
      <div class="dt-grid">
        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          class="dt-cell"
          :class="cell.classes"
          @click="cell.onClick"
        >
          <span v-if="cell.label" class="dt-cell-day">{{ cell.label }}</span>
        </div>
      </div>
    </div>

    <!-- 分隔装饰 -->
    <div class="dt-separator">
      <span class="dt-separator-dot" />
    </div>

    <!-- 时间选择区 -->
    <div class="dt-time-section">
      <div class="dt-time-col">
        <span class="dt-time-label">时</span>
        <button
          class="dt-time-btn"
          :class="{ 'dt-time-btn--disabled': localHour >= 23 }"
          :disabled="localHour >= 23"
          @click="adjustHour(1)"
        >
          <span class="dt-time-btn-icon">▲</span>
        </button>
        <div class="dt-time-value">{{ String(localHour).padStart(2, '0') }}</div>
        <button
          class="dt-time-btn"
          :class="{ 'dt-time-btn--disabled': localHour <= 0 }"
          :disabled="localHour <= 0"
          @click="adjustHour(-1)"
        >
          <span class="dt-time-btn-icon">▼</span>
        </button>
      </div>

      <span class="dt-time-colon">:</span>

      <div class="dt-time-col">
        <span class="dt-time-label">分</span>
        <button
          class="dt-time-btn"
          :class="{ 'dt-time-btn--disabled': localMinute >= 59 }"
          :disabled="localMinute >= 59"
          @click="adjustMinute(1)"
        >
          <span class="dt-time-btn-icon">▲</span>
        </button>
        <div class="dt-time-value">{{ String(localMinute).padStart(2, '0') }}</div>
        <button
          class="dt-time-btn"
          :class="{ 'dt-time-btn--disabled': localMinute <= 0 }"
          :disabled="localMinute <= 0"
          @click="adjustMinute(-1)"
        >
          <span class="dt-time-btn-icon">▼</span>
        </button>
      </div>
    </div>

    <!-- 底部操作区 -->
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

// 本地状态
const localDate = ref(props.date)
const localHour = ref(0)
const localMinute = ref(0)
const navYear = ref(0)
const navMonth = ref(0)

const WEEKDAY_NAMES_SHORT = ['日', '一', '二', '三', '四', '五', '六']
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

function initLocal() {
  localDate.value = props.date
  const [h, m] = props.time.split(':').map(Number)
  localHour.value = h
  localMinute.value = m
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

const calendarCells = computed(() => {
  const year = navYear.value
  const month = navMonth.value
  const daysCount = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  // 周一为一周起始：周一=0，周日=6
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  const todayStr = toDateString(new Date())
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const cells: { label: number | ''; classes: string; onClick: () => void }[] = []

  // 填充空白格
  for (let i = 0; i < startOffset; i++) {
    cells.push({ label: '', classes: 'dt-cell--empty', onClick: () => {} })
  }

  // 日期格
  for (let d = 1; d <= daysCount; d++) {
    const dateStr = toLocalDateString(year, month, d)
    const dateObj = new Date(year, month - 1, d)
    const isToday = dateStr === todayStr
    const isFuture = dateObj > todayStart
    const isSelected = dateStr === localDate.value

    const classes = [
      'dt-cell--day',
      isToday && 'dt-cell--today',
      isSelected && 'dt-cell--selected',
      isFuture && 'dt-cell--future',
    ].filter(Boolean).join(' ')

    cells.push({
      label: d,
      classes,
      onClick: () => {
        if (!isFuture) localDate.value = dateStr
      },
    })
  }

  return cells
})

function prevMonth() {
  if (navMonth.value === 1) {
    navYear.value--
    navMonth.value = 12
  } else {
    navMonth.value--
  }
  adjustSelectedDate()
}

function nextMonth() {
  if (navMonth.value === 12) {
    navYear.value++
    navMonth.value = 1
  } else {
    navMonth.value++
  }
  adjustSelectedDate()
}

function adjustSelectedDate() {
  const lastDay = new Date(navYear.value, navMonth.value, 0).getDate()
  const currentDay = parseLocalDate(localDate.value).getDate()
  if (currentDay > lastDay) {
    localDate.value = toLocalDateString(navYear.value, navMonth.value, lastDay)
  }
}

function adjustHour(delta: number) {
  const v = localHour.value + delta
  if (v >= 0 && v <= 23) localHour.value = v
}

function adjustMinute(delta: number) {
  const v = localMinute.value + delta
  if (v >= 0 && v <= 59) localMinute.value = v
}

function setToNow() {
  const now = new Date()
  localDate.value = toDateString(now)
  localHour.value = now.getHours()
  localMinute.value = now.getMinutes()
  navYear.value = now.getFullYear()
  navMonth.value = now.getMonth() + 1
}

function onConfirm() {
  emit('update:date', localDate.value)
  emit('update:time', `${String(localHour.value).padStart(2, '0')}:${String(localMinute.value).padStart(2, '0')}`)
  emit('close')
}

function onCancel() {
  emit('close')
}

watch(() => props.visible, (v) => {
  if (v) initLocal()
}, { immediate: true })

watch(() => props.date, (v) => {
  if (!props.visible) localDate.value = v
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
/* ========================================
   头部操作栏
   ======================================== */
.dt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px;
}

.dt-header-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
  font-family: inherit;
}

.dt-header-btn:active {
  background: var(--color-separator);
}

.dt-header-btn-icon {
  font-size: 18px;
  color: var(--color-secondary-text);
  line-height: 1;
}

.dt-header-confirm .dt-header-btn-icon {
  color: var(--color-primary);
  font-weight: 700;
}

.dt-header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

/* ========================================
   日历区
   ======================================== */
.dt-calendar {
  padding: 0 0 4px;
}

/* 月份导航 */
.dt-month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 18px;
}

.dt-nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--color-card);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
  font-family: inherit;
}

.dt-nav-btn:active {
  background: var(--color-separator-heavy);
}

.dt-nav-arrow {
  font-size: 11px;
  color: var(--color-secondary-text);
  line-height: 1;
}

.dt-month-label {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 110px;
  text-align: center;
  letter-spacing: 0.5px;
}

/* 星期行 */
.dt-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
  padding: 0 4px;
}

.dt-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-secondary-text);
  padding: 4px 0;
  line-height: 1.2;
}

/* 日期网格 */
.dt-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 0 4px;
}

.dt-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s, color 0.12s, transform 0.12s;
  user-select: none;
}

.dt-cell:active:not(.dt-cell--empty):not(.dt-cell--future) {
  transform: scale(0.88);
}

.dt-cell--empty {
  cursor: default;
}

.dt-cell-day {
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1;
}

/* 今天：蓝色细圈 */
.dt-cell--today .dt-cell-day {
  color: var(--color-primary);
  font-weight: 600;
}

/* 选中：蓝色实心圆 */
.dt-cell--selected {
  background: var(--color-primary);
}

.dt-cell--selected .dt-cell-day {
  color: #fff;
  font-weight: 600;
}

.dt-cell--selected:active {
  background: var(--color-primary);
}

/* 未来日期：不可用 */
.dt-cell--future {
  cursor: not-allowed;
}

.dt-cell--future .dt-cell-day {
  color: var(--color-separator-heavy);
}

/* ========================================
   分隔装饰
   ======================================== */
.dt-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0 8px;
}

.dt-separator-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-separator-heavy);
  opacity: 0.5;
}

/* ========================================
   时间选择区
   ======================================== */
.dt-time-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 0 12px;
}

.dt-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.dt-time-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-secondary-text);
  letter-spacing: 2px;
  margin-bottom: 2px;
}

.dt-time-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--color-card);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s, opacity 0.12s;
  font-family: inherit;
}

.dt-time-btn:active:not(.dt-time-btn--disabled) {
  background: var(--color-separator-heavy);
}

.dt-time-btn--disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.dt-time-btn-icon {
  font-size: 14px;
  color: var(--color-secondary-text);
  line-height: 1;
}

.dt-time-value {
  font-size: 30px;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  min-width: 64px;
  text-align: center;
  line-height: 1;
  padding: 4px 0;
}

.dt-time-colon {
  font-size: 30px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1;
  margin-top: -4px;
  /* 减去 label 区域让冒号视觉居中于数字行 */
  align-self: center;
  margin-bottom: 50px;
}

/* ========================================
   底部操作区
   ======================================== */
.dt-footer {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}

.dt-today-btn {
  border: 1px solid var(--color-separator-heavy);
  background: transparent;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  padding: 9px 28px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  letter-spacing: 0.3px;
}

.dt-today-btn:active {
  background: var(--color-separator);
  border-color: var(--color-primary);
}
</style>