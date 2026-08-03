<template>
  <CommonBottomSheet :visible="visible" title="选择日期" @close="onCancel">
    <div class="date-picker-content">
      <div class="picker-columns">
        <div class="picker-column">
          <div class="picker-column-label">年</div>
          <PickerWheel
            :items="yearItems"
            :model-value="selectedYear"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onYearChange"
          />
        </div>
        <div class="picker-column">
          <div class="picker-column-label">月</div>
          <PickerWheel
            :items="monthItems"
            :model-value="selectedMonth"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onMonthChange"
          />
        </div>
        <div class="picker-column">
          <div class="picker-column-label">日</div>
          <PickerWheel
            :items="dayItems"
            :model-value="selectedDay"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onDayChange"
          />
        </div>
      </div>
    </div>
    <template #actions>
      <button class="btn btn-secondary" @click="onCancel">取消</button>
      <button class="btn btn-primary" @click="onConfirm">完成</button>
    </template>
  </CommonBottomSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CommonBottomSheet from './CommonBottomSheet.vue'
import PickerWheel from './PickerWheel.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  modelValue?: string
}>(), {
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:visible', value: boolean): void
}>()

// Parse initial date
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  }
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

const { year: initYear, month: initMonth, day: initDay } = parseDate(props.modelValue)
const selectedYear = ref(initYear)
const selectedMonth = ref(initMonth)
const selectedDay = ref(initDay)

// Reset internal state when sheet opens
watch(() => props.visible, (open) => {
  if (open) {
    const { year, month, day } = parseDate(props.modelValue)
    selectedYear.value = year
    selectedMonth.value = month
    selectedDay.value = day
  }
})

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const currentDay = now.getDate()

// Compute max selectable date (today)
function dateToNum(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day
}
const todayNum = dateToNum(currentYear, currentMonth, currentDay)

// Column data
const yearItems = computed(() => {
  const years: { label: string; value: number }[] = []
  for (let y = 1970; y <= currentYear; y++) {
    years.push({ label: `${y}`, value: y })
  }
  return years
})

const monthItems = computed(() => {
  const maxMonth = selectedYear.value === currentYear ? currentMonth : 12
  return Array.from({ length: maxMonth }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }))
})

const daysInMonth = computed(() => {
  // month 为 1-indexed，Date monthIndex 为 0-indexed
  // Month 作为 monthIndex 时 day=0 回绕到上个月最后一天
  return new Date(selectedYear.value, selectedMonth.value, 0).getDate()
})

const dayItems = computed(() => {
  const maxDay = (selectedYear.value === currentYear && selectedMonth.value === currentMonth)
    ? currentDay
    : daysInMonth.value
  return Array.from({ length: maxDay }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }))
})

// Handlers with cross-column correction
function onYearChange(year: number) {
  selectedYear.value = year
  // Clamp month if at current year
  if (year === currentYear && selectedMonth.value > currentMonth) {
    selectedMonth.value = currentMonth
  }
  // Fix day if needed (e.g., Feb 29 in non-leap year)
  const maxDay = new Date(year, selectedMonth.value, 0).getDate()
  if (selectedDay.value > maxDay) {
    selectedDay.value = maxDay
  }
  // Clamp day if at today
  if (year === currentYear && selectedMonth.value === currentMonth && selectedDay.value > currentDay) {
    selectedDay.value = currentDay
  }
}

function onMonthChange(month: number) {
  selectedMonth.value = month
  // Fix day if needed (e.g., Jan 31 -> Feb)
  const maxDay = new Date(selectedYear.value, month, 0).getDate()
  if (selectedDay.value > maxDay) {
    selectedDay.value = maxDay
  }
  // Clamp day if at current month of current year
  if (selectedYear.value === currentYear && month === currentMonth && selectedDay.value > currentDay) {
    selectedDay.value = currentDay
  }
}

function onDayChange(day: number) {
  selectedDay.value = day
}

function toDateStr(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function onConfirm() {
  // Safety clamp: ensure not future
  let y = selectedYear.value
  let m = selectedMonth.value
  let d = selectedDay.value
  if (dateToNum(y, m, d) > todayNum) {
    y = currentYear
    m = currentMonth
    d = currentDay
  }
  emit('update:modelValue', toDateStr(y, m, d))
  emit('update:visible', false)
}

function onCancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.date-picker-content {
  padding: 0 8px;
}

.picker-columns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.picker-column {
  flex: 1;
  max-width: 100px;
  text-align: center;
}

.picker-column-label {
  font-size: var(--fs-small, 12px);
  color: var(--color-secondary-text);
  margin-bottom: 4px;
  font-weight: 500;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: var(--fs-amount, 16px);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}
.btn:active { opacity: 0.7; }
.btn-secondary { background: var(--color-bg); color: var(--color-text); }
.btn-primary { background: var(--color-primary); color: #fff; }
</style>