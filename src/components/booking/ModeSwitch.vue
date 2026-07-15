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
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' },
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
  border-radius: 8px;
  padding: 2px;
  height: 32px;
  gap: 2px;
}

.mode-btn {
  border: none;
  background: transparent;
  color: #1c1c1e;
  font-size: 13px;
  font-weight: 500;
  padding: 0 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  font-family: inherit;
}

.mode-btn.active {
  background: #007aff;
  color: #fff;
}
</style>