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
  (e: 'update:modelValue', value: BookingMode): void
}>()
</script>

<style scoped>
.mode-switch {
  display: inline-flex;
  background: #e5e5ea;
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
}

.mode-btn {
  border: none;
  background: transparent;
  color: #666;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 20px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  font-family: inherit;
}

.mode-btn.active {
  background: #007aff;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>