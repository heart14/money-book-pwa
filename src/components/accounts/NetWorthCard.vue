<script setup lang="ts">
import { useAccountStore } from '@/stores/accountStore'
import { ref } from 'vue'

const acctStore = useAccountStore()
const showChart = ref(false)
</script>

<template>
  <div class="net-worth-card" @click="showChart = !showChart">
    <div class="nw-header">
      <span class="label">净资产</span>
      <span class="amount">¥{{ acctStore.netWorth.toFixed(2) }}</span>
    </div>
    <div class="nw-detail">
      <div class="item">
        <span class="il">总资产</span>
        <span class="iv positive">¥{{ acctStore.totalAssets.toFixed(2) }}</span>
      </div>
      <div class="item">
        <span class="il">总负债</span>
        <span class="iv negative">¥{{ acctStore.totalLiabilities.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.net-worth-card {
  background: linear-gradient(135deg, #1989fa, #07c160);
  color: #fff;
  padding: 24px 20px;
  margin: 16px;
  border-radius: 12px;
  cursor: pointer;
}
.nw-header {
  margin-bottom: 16px;
}
.label {
  font-size: 13px;
  opacity: 0.9;
}
.amount {
  display: block;
  font-size: 32px;
  font-weight: 700;
  margin-top: 4px;
}
.nw-detail {
  display: flex;
  gap: 24px;
}
.il {
  font-size: 12px;
  opacity: 0.8;
}
.iv {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin-top: 2px;
}
.positive {
  color: rgba(255, 255, 255, 0.95);
}
.negative {
  color: rgba(255, 200, 200, 0.95);
}
</style>