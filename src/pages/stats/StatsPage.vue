<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import ExpenseChart from '@/components/stats/ExpenseChart.vue'
import InsightCard from '@/components/stats/InsightCard.vue'

const tStore = useTransactionStore()
const catStore = useCategoryStore()

// Top expense sub-categories
const topExpenses = computed(() => {
  const cats = catStore.categories ?? []
  const transactions = (tStore.transactions ?? []).filter(
    t => t.type === 'expense' && t.date.startsWith(tStore.currentMonth)
  )
  const grouped: Record<number, number> = {}
  transactions.forEach(t => {
    if (t.categoryId) grouped[t.categoryId] = (grouped[t.categoryId] || 0) + t.amount
  })
  return Object.entries(grouped)
    .map(([id, amount]) => ({
      category: cats.find(c => c.id === Number(id)),
      amount,
    }))
    .filter(item => item.category)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
})

// Tag aggregation
const tagTotals = computed(() => {
  const transactions = (tStore.transactions ?? []).filter(
    t => t.date.startsWith(tStore.currentMonth)
  )
  const tags: Record<string, number> = {}
  transactions.forEach(t => {
    t.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + t.amount
    })
  })
  return Object.entries(tags).sort((a, b) => b[1] - a[1])
})
</script>

<template>
  <div class="stats-page">
    <van-nav-bar title="统计" />
    <InsightCard />
    <ExpenseChart />
    <div class="section">
      <div class="section-title">支出排行</div>
      <div class="rank-list">
        <div v-for="(item, i) in topExpenses" :key="i" class="rank-item">
          <span class="rank-num">{{ i + 1 }}</span>
          <span class="rank-icon">{{ item.category?.icon || '📦' }}</span>
          <span class="rank-name">{{ item.category?.name || '未知' }}</span>
          <span class="rank-amount">¥{{ item.amount.toFixed(2) }}</span>
        </div>
        <van-empty v-if="topExpenses.length === 0" description="暂无数据" />
      </div>
    </div>
    <div class="section" v-if="tagTotals.length > 0">
      <div class="section-title">标签聚合</div>
      <div class="tag-list">
        <div v-for="[tag, total] in tagTotals" :key="tag" class="tag-item">
          <span class="tag-name">#{{ tag }}</span>
          <span class="tag-total">¥{{ total.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  background: #f7f8fa;
  min-height: 100%;
}
.section {
  margin: 0 16px 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.rank-list {
  display: flex;
  flex-direction: column;
}
.rank-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.rank-item:last-child {
  border-bottom: none;
}
.rank-num {
  width: 20px;
  font-size: 12px;
  color: #999;
  font-weight: 600;
}
.rank-icon {
  font-size: 18px;
  margin-right: 10px;
}
.rank-name {
  flex: 1;
  font-size: 14px;
}
.rank-amount {
  font-size: 14px;
  font-weight: 600;
  color: #ee0a24;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-item {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  background: #f7f8fa;
  border-radius: 16px;
  font-size: 13px;
}
.tag-name {
  color: #1989fa;
}
.tag-total {
  color: #666;
  font-weight: 600;
}
</style>