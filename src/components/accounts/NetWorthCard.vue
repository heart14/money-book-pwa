<template>
  <div class="net-worth-card">
    <div class="nw-label">净资产</div>
    <div class="nw-amount">{{ formatCurrency(netWorth) }}</div>
    <div class="nw-detail">
      <div class="nw-detail-item">
        <div class="nw-detail-label">总资产</div>
        <div class="nw-detail-value assets">{{ formatCurrency(totalAssets) }}</div>
      </div>
      <div class="nw-detail-item">
        <div class="nw-detail-label">总负债</div>
        <div class="nw-detail-value liabilities">{{ formatCurrency(totalLiabilities) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '@/utils/format'

defineProps<{
  netWorth: number
  totalAssets: number
  totalLiabilities: number
}>()
</script>

<style scoped>
.net-worth-card {
  background: linear-gradient(135deg, var(--color-text), #2c2c2e);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.nw-label {
  font-size: var(--fs-ui);
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.nw-amount {
  font-size: var(--fs-amount-lg);
  font-weight: 700;
  color: #fff;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8px;
}

.nw-detail {
  display: flex;
  gap: 16px;
  margin-top: 4px;
}

.nw-detail-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nw-detail-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.nw-detail-value {
  font-size: var(--fs-title);
  font-weight: 600;
}

.nw-detail-value.assets {
  color: var(--color-success);
}

.nw-detail-value.liabilities {
  color: var(--color-destructive);
}
</style>