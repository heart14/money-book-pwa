<template>
  <div class="mode-switch">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="mode-btn"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { BookingMode } from '@/stores/uiStore'

const options: { label: string; value: BookingMode }[] = [
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
  { label: '转账', value: 'transfer' },
]

defineProps<{
  modelValue: BookingMode
}>()

defineEmits<{
  'update:modelValue': [value: BookingMode]
}>()
</script>

<style scoped>
.mode-switch {
  display: inline-flex;
  background: #e9e9ed;
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

.mode-btn {
  border: none;
  background: transparent;
  color: #8e8e93;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 20px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.25s ease;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  font-family: inherit;
  letter-spacing: 0.3px;
}

.mode-btn.active {
  background: #fff;
  color: #007aff;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
</style>