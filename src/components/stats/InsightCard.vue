<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'

const tStore = useTransactionStore()
const catStore = useCategoryStore()

// 真实居住成本：房贷房租 + 水电煤网 + 公积金扣款
const housingCost = computed(() => {
  const cats = catStore.categories ?? []
  const housingCatIds = cats
    .filter(c => {
      const parent = cats.find(p => p.id === c.parentId)
      return parent?.name?.includes('居住') && ['房租房贷', '生活缴费'].includes(c.name)
    })
    .map(c => c.id)

  const transactions = tStore.transactions ?? []
  return transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(tStore.currentMonth) && housingCatIds.includes(t.categoryId!))
    .reduce((sum, t) => sum + t.amount, 0)
})

// 拿铁因子
const latteCost = computed(() => {
  const latteIds = catStore.latteFactorIds ?? []
  const transactions = tStore.transactions ?? []
  const total = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(tStore.currentMonth) && latteIds.includes(t.categoryId!))
    .reduce((sum, t) => sum + t.amount, 0)
  const annualLoss = total * 12 * 1.05 // 假设年化 5% 复利
  return { monthly: total, annualLoss }
})
</script>

<template>
  <div class="insight-card">
    <div v-if="housingCost > 0" class="insight-item">
      <van-icon name="home-o" size="20" color="#1989fa" />
      <div class="insight-body">
        <span class="insight-label">真实居住成本</span>
        <span class="insight-value">¥{{ housingCost.toFixed(2) }}</span>
      </div>
    </div>
    <div v-if="latteCost.monthly > 0" class="insight-item">
      <van-icon name="fire-o" size="20" color="#ee0a24" />
      <div class="insight-body">
        <span class="insight-label">拿铁因子吞噬</span>
        <span class="insight-value">本月 ¥{{ latteCost.monthly.toFixed(2) }}</span>
        <span class="insight-hint">年度复利损失 ≈ ¥{{ latteCost.annualLoss.toFixed(0) }}</span>
      </div>
    </div>
    <div v-if="housingCost === 0 && latteCost.monthly === 0" class="insight-empty">
      暂无足够数据生成洞察
    </div>
  </div>
</template>

<style scoped>
.insight-card {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.insight-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}
.insight-item:last-child {
  border-bottom: none;
}
.insight-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.insight-label {
  font-size: 13px;
  color: #666;
}
.insight-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}
.insight-hint {
  font-size: 11px;
  color: #ee0a24;
}
.insight-empty {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 13px;
}
</style>