<template>
  <div class="transaction-item" @click="$emit('click')">
    <div class="item-left">
      <span class="item-icon">{{ categoryIcon || '🔄' }}</span>
      <span class="item-category">{{ categoryName || '转账' }}</span>
    </div>
    <div class="item-center">
      <div class="item-account">{{ accountName }}</div>
      <div class="item-meta">
        <span class="item-time">{{ displayTime }}</span>
        <span v-for="tag in transaction.tags" :key="tag" class="item-tag">{{ tag }}</span>
      </div>
    </div>
    <div class="item-right" :class="amountClass">
      <span class="amount-sign">{{ amountSign }}</span>
      <span class="amount-value">{{ displayAmount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  transaction: Transaction
  accountName: string
  categoryName: string
  categoryIcon: string
}>()

defineEmits<{
  click: []
}>()

const displayTime = computed(() => props.transaction.time.slice(0, 5))

const amountClass = computed(() => {
  switch (props.transaction.type) {
    case 'expense':
      return 'amount-expense'
    case 'income':
      return 'amount-income'
    case 'transfer':
      return 'amount-transfer'
  }
})

const amountSign = computed(() => {
  switch (props.transaction.type) {
    case 'expense':
      return '-'
    case 'income':
      return '+'
    case 'transfer':
      return '-'
  }
})

const displayAmount = computed(() => {
  const full = formatCurrency(props.transaction.amount)
  return full.replace('¥', '')
})
</script>

<style scoped>
.transaction-item {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
  background: #fff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid var(--color-separator);
}

.transaction-item:active {
  opacity: 0.7;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 60px;
}

.item-icon {
  font-size: 24px;
  line-height: 1;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f2f2f6;
}

.item-category {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

.item-center {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
}

.item-account {
  font-size: 12px;
  color: var(--color-secondary-text);
  line-height: 1.2;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.item-time {
  font-size: 12px;
  color: var(--color-secondary-text);
  white-space: nowrap;
}

.item-tag {
  font-size: 10px;
  color: var(--color-secondary-text);
  background: #f2f2f6;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.item-right {
  display: flex;
  align-items: baseline;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.amount-expense {
  color: #ff3b30;
}

.amount-income {
  color: #34c759;
}

.amount-transfer {
  color: #007aff;
}
</style>