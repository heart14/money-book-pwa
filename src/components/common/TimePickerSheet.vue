<template>
  <CommonBottomSheet :visible="visible" title="选择时间" @close="onCancel">
    <div class="time-picker-content">
      <div class="picker-columns">
        <div class="picker-column">
          <div class="picker-column-label">时</div>
          <PickerWheel
            :items="hourItems"
            :model-value="selectedHour"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onHourChange"
          />
        </div>
        <div class="picker-column">
          <div class="picker-column-label">分</div>
          <PickerWheel
            :items="minuteItems"
            :model-value="selectedMinute"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onMinuteChange"
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
  /** 当前选择的日期，用于判断是否限制未来时间 */
  selectedDate?: string
}>(), {
  modelValue: '',
  selectedDate: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:visible', value: boolean): void
}>()

function parseTime(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) {
    const now = new Date()
    return { hour: now.getHours(), minute: now.getMinutes() }
  }
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h || 0, minute: m || 0 }
}

const { hour: initHour, minute: initMinute } = parseTime(props.modelValue)
const selectedHour = ref(initHour)
const selectedMinute = ref(initMinute)

// Reset when sheet opens
watch(() => props.visible, (open) => {
  if (open) {
    const { hour, minute } = parseTime(props.modelValue)
    selectedHour.value = hour
    selectedMinute.value = minute
  }
})

// ── Future time restriction ──
const now = new Date()
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const isToday = computed(() => props.selectedDate === todayStr)

const maxHour = computed(() => isToday.value ? now.getHours() : 23)
const maxMinute = computed(() => (isToday.value && selectedHour.value === now.getHours()) ? now.getMinutes() : 59)

const hourItems = computed(() =>
  Array.from({ length: maxHour.value + 1 }, (_, i) => ({
    label: String(i).padStart(2, '0'),
    value: i,
  }))
)

const minuteItems = computed(() =>
  Array.from({ length: maxMinute.value + 1 }, (_, i) => ({
    label: String(i).padStart(2, '0'),
    value: i,
  }))
)

function onHourChange(hour: number) {
  selectedHour.value = hour
  // Clamp minute if needed
  if (isToday.value && hour === now.getHours() && selectedMinute.value > now.getMinutes()) {
    selectedMinute.value = now.getMinutes()
  }
}

function onMinuteChange(minute: number) {
  selectedMinute.value = minute
}

function toTimeStr(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function onConfirm() {
  // Safety clamp
  let h = selectedHour.value
  let m = selectedMinute.value
  if (isToday.value) {
    if (h > now.getHours()) {
      h = now.getHours()
      m = now.getMinutes()
    } else if (h === now.getHours() && m > now.getMinutes()) {
      m = now.getMinutes()
    }
  }
  emit('update:modelValue', toTimeStr(h, m))
  emit('update:visible', false)
}

function onCancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.time-picker-content {
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