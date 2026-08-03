<template>
  <CommonBottomSheet :visible="visible" title="选择时间" @close="onCancel">
    <div class="time-picker-content">
      <div class="picker-columns">
        <div class="picker-column">
          <div class="picker-column-label">小时</div>
          <PickerWheel
            :items="hourItems"
            :model-value="selectedHour"
            :item-height="40"
            :visible-count="5"
            @update:model-value="selectedHour = $event"
          />
        </div>
        <div class="picker-column">
          <div class="picker-column-label">分钟</div>
          <PickerWheel
            :items="minuteItems"
            :model-value="selectedMinute"
            :item-height="40"
            :visible-count="5"
            @update:model-value="selectedMinute = $event"
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
import { ref, watch } from 'vue'
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
  (e: 'close'): void
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

const hourItems = Array.from({ length: 24 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: i,
}))

const minuteItems = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: i,
}))

function toTimeStr(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function onConfirm() {
  emit('update:modelValue', toTimeStr(selectedHour.value, selectedMinute.value))
  emit('update:visible', false)
}

function onCancel() {
  emit('update:visible', false)
  emit('close')
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