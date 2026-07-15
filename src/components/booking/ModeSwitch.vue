<script setup lang="ts">
import type { TransactionType } from '@/types'

defineProps<{
  modelValue: TransactionType
  locked: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TransactionType]
}>()

const modes: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' },
  { value: 'transfer', label: '转账' },
]

function onSelect(m: TransactionType) {
  if (m !== 'expense' && m !== 'income' && m !== 'transfer') return
  emit('update:modelValue', m)
}
</script>

<template>
  <div class="mode-switch">
    <div
      v-for="m in modes"
      :key="m.value"
      :class="['mode-tab', { active: modelValue === m.value, locked }]"
      @click="onSelect(m.value)"
    >
      {{ m.label }}
    </div>
  </div>
</template>

<style scoped>
.mode-switch {
  display: flex;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 2px;
  margin: 12px 16px;
}
.mode-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}
.mode-tab.active {
  background: #fff;
  color: #1989fa;
  font-weight: 600;
}
.mode-tab.locked {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>