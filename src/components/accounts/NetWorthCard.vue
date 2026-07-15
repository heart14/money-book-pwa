<template>
  <div class="net-worth-card">
    <div class="nw-label">净资产</div>
    <div class="nw-amount">{{ formatCurrency(netWorth) }}</div>
    <div class="nw-detail">
      <span class="nw-assets">总资产 {{ formatCurrency(totalAssets) }}</span>
      <span class="nw-sep">|</span>
      <span class="nw-liabilities">总负债 {{ formatCurrency(totalLiabilities) }}</span>
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
  background: #1c1c1e;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.nw-label {
  font-size: 14px;
  color: #8e8e93;
  margin-bottom: 4px;
}

.nw-amount {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8px;
}

.nw-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.nw-assets {
  color: #34c759;
}

.nw-sep {
  color: #8e8e93;
}

.nw-liabilities {
  color: #ff3b30;
}
</style>