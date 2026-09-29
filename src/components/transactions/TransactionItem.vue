<template>
  <div class="transaction-item" @click="$emit('click')">
    <div class="item-col">
      <!-- <div class="item-icon">
        {{ categoryIcon || '📋' }}
      </div> -->
      <div class="item-info">
        <div class="item-title">{{ title || categoryName }}</div>
        <div class="item-sub">{{ categoryName }} · {{ displayTime }}</div>
      </div>
    </div>
    <div class="item-amount" :class="amountClass">
      {{ amountSign }}{{ displayAmount }}
      <div v-if="transaction.tags?.length" class="item-tags">
        <span v-for="tag in transaction.tags" :key="tag">#{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  transaction: Transaction
  title: string
  categoryName: string
  categoryIcon: string
}>()

defineEmits<{
  click: []
}>()

const displayTime = computed(() => props.transaction.time.slice(0, 5))

const amountClass = computed(() => {
  switch (props.transaction.type) {
    case 'expense': return 'amount-expense'
    case 'income': return 'amount-income'
    case 'transfer': return 'amount-transfer'
  }
})

const amountSign = computed(() => {
  switch (props.transaction.type) {
    case 'expense': return '-¥'
    case 'income': return '+¥'
    case 'transfer': return ''
  }
})

const displayAmount = computed(() => {
  // For consistency, always truncate ¥ from formatCurrency result
  const full = formatCurrency(props.transaction.amount)
  return full.replace('¥', '')
})
</script>

<style scoped>
.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: transparent;
  border-bottom: 1px solid var(--color-separator);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.transaction-item:active {
  background: var(--color-press);
}

.item-col {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.item-icon {
  width: 36px;
  height: 36px;
  background: var(--color-input-bg);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.item-info {
  min-width: 0;
}

.item-title {
  font-size: var(--fs-title);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-sub {
  font-size: var(--fs-small);
  color: var(--color-secondary-text);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-amount {
  text-align: right;
  flex-shrink: 0;
  margin-left: 12px;
  font-size: var(--fs-amount);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}

.amount-expense { color: var(--color-success); }
.amount-income { color: var(--color-destructive); }
.amount-transfer { color: var(--color-primary); }

.item-tags {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 1px;
}

.item-tags span {
  font-size: var(--fs-micro);
  color: var(--color-secondary-text);
  white-space: nowrap;
}
</style>