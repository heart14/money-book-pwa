<template>
  <Teleport to="body">
    <div class="sheet-overlay" @click.self="$emit('close')">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-body">
          <div class="sheet-header">
            <div class="sheet-icon-wrap">
              <span class="sheet-icon">{{ displayIcon }}</span>
            </div>
            <div class="sheet-title">{{ transaction.title || categoryName }}</div>
            <div class="sheet-type-badge" :class="`badge-${transaction.type}`">
              {{ typeLabel }}
            </div>
          </div>
          <div class="sheet-amount" :class="`amount-${transaction.type}`">
            <template v-if="transaction.type === 'transfer'">
              <span class="sheet-amount-value">{{ displayAmount }}</span>
            </template>
            <template v-else>
              <span class="sheet-amount-sign">{{ transaction.type === 'income' ? '+' : '-' }}</span>
              <span class="sheet-amount-value">{{ displayAmount }}</span>
            </template>
          </div>
          <div class="sheet-details">
            <div v-if="transaction.title" class="detail-row">
              <span class="detail-label">标题</span>
              <span class="detail-value">{{ transaction.title }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">分类</span>
              <span class="detail-value">{{ categoryName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">日期</span>
              <span class="detail-value">{{ transaction.date }} {{ transaction.time?.slice(0, 5) || '' }}</span>
            </div>
            <div v-if="transaction.note" class="detail-row">
              <span class="detail-label">备注</span>
              <span class="detail-value">{{ transaction.note }}</span>
            </div>
            <div v-if="transaction.tags && transaction.tags.length > 0" class="detail-row">
              <span class="detail-label">标签</span>
              <span class="detail-value">
                <span v-for="tag in transaction.tags" :key="tag" class="detail-tag">{{ tag }}</span>
              </span>
            </div>
          </div>
          <div class="sheet-actions">
            <button class="btn btn-secondary" @click="$emit('edit', transaction)">编辑</button>
            <button class="btn btn-danger" @click="$emit('delete', transaction)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { formatCurrency } from '@/utils/format'
import type { Transaction } from '@/types'

const props = defineProps<{
  transaction: Transaction
}>()

defineEmits<{
  (e: 'edit', tx: Transaction): void
  (e: 'delete', tx: Transaction): void
  (e: 'close'): void
}>()

const categoryStore = useCategoryStore()

const categoryName = computed(() => {
  if (props.transaction.categoryId == null) return ''
  const cat = categoryStore.categories.find((c) => c.id === props.transaction.categoryId)
  return cat?.name ?? ''
})

const categoryIcon = computed(() => {
  if (props.transaction.categoryId == null) return ''
  const cat = categoryStore.categories.find((c) => c.id === props.transaction.categoryId)
  return cat?.icon ?? ''
})

const displayIcon = computed(() => {
  if (props.transaction.type === 'transfer') return '🔄'
  return categoryIcon.value || '📋'
})

const typeLabel = computed(() => {
  switch (props.transaction.type) {
    case 'expense': return '支出'
    case 'income': return '收入'
    case 'transfer': return '转账'
  }
})

const displayAmount = computed(() => {
  const yuan = props.transaction.amount / 100
  return yuan.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})
</script>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.sheet {
  width: 100%;
  max-width: 480px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  max-height: 85vh;
  overflow-y: auto;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d1d1d6;
  margin: 8px auto 0;
}

.sheet-body {
  padding: 16px 24px 32px;
}

.sheet-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.sheet-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f2f2f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.sheet-icon { font-size: 28px; line-height: 1; }

.sheet-title { font-size: 17px; font-weight: 600; color: #1c1c1e; }

.sheet-type-badge { font-size: 12px; padding: 2px 10px; border-radius: 10px; margin-top: 6px; color: #fff; }
.badge-expense { background: #34c759; }
.badge-income { background: #ff3b30; }
.badge-transfer { background: #007aff; }

.sheet-amount {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 24px;
}
.sheet-amount.amount-expense { color: #34c759; }
.sheet-amount.amount-income { color: #ff3b30; }
.sheet-amount.amount-transfer { color: #007aff; }

.sheet-details {
  border-top: 1px solid rgba(60,60,67,0.08);
  padding-top: 16px;
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  font-size: 15px;
}

.detail-label { width: 56px; flex-shrink: 0; color: #8e8e93; }

.detail-value { flex: 1; color: #1c1c1e; word-break: break-all; }

.detail-tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f2f2f6;
  color: #8e8e93;
  margin-right: 4px;
  margin-bottom: 2px;
}

.sheet-actions { display: flex; gap: 12px; }

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}
.btn:active { opacity: 0.7; }
.btn-secondary { background: #f2f2f6; color: #1c1c1e; }
.btn-danger { background: #ff3b30; color: #fff; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>