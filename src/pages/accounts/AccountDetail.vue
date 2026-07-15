<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { computed } from 'vue'
import type { Account } from '@/types'

const route = useRoute()
const router = useRouter()
const acctStore = useAccountStore()
const tStore = useTransactionStore()

const account = computed(() =>
  (acctStore.accounts ?? []).find((a: Account) => a.id === Number(route.params.id))
)

const accountTransactions = computed(() =>
  (tStore.transactions ?? []).filter(
    t => t.fromAccountId === account.value?.id || t.toAccountId === account.value?.id
  )
)

function txLabel(type: string) {
  if (type === 'expense') return '支出'
  if (type === 'income') return '收入'
  return '转账'
}

function txClass(type: string) {
  if (type === 'expense') return 'expense'
  if (type === 'income') return 'income'
  return 'transfer'
}
</script>

<template>
  <div class="account-detail" v-if="account">
    <van-nav-bar
      :title="account.name"
      left-arrow
      @click-left="router.back()"
    />
    <div :class="['detail-balance', account.type === 'debt' ? 'debt-bg' : '']">
      <span class="db-label">{{ account.type === 'debt' ? '当前负债' : '当前余额' }}</span>
      <span class="db-amount">
        ¥{{ account.type === 'debt' ? Math.abs(account.balance).toFixed(2) : account.balance.toFixed(2) }}
      </span>
    </div>
    <div class="detail-transactions">
      <div class="section-title">相关流水</div>
      <div
        v-for="tx in accountTransactions"
        :key="tx.id"
        class="tx-item"
      >
        <span :class="['tx-type', txClass(tx.type)]">{{ txLabel(tx.type) }}</span>
        <span class="tx-amount">{{ tx.type === 'expense' ? '-' : '+' }}¥{{ tx.amount.toFixed(2) }}</span>
        <span class="tx-date">{{ tx.date }}</span>
        <span class="tx-note" v-if="tx.note">{{ tx.note }}</span>
      </div>
      <van-empty v-if="accountTransactions.length === 0" description="暂无流水" />
    </div>
  </div>
</template>

<style scoped>
.detail-balance {
  text-align: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, #1989fa, #07c160);
  color: #fff;
}
.detail-balance.debt-bg {
  background: linear-gradient(135deg, #ee0a24, #ff976a);
}
.db-label {
  font-size: 13px;
  opacity: 0.8;
}
.db-amount {
  display: block;
  font-size: 28px;
  font-weight: 700;
  margin-top: 4px;
}
.detail-transactions {
  padding: 16px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.tx-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
}
.tx-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.tx-type.expense {
  background: #ffeeee;
  color: #ee0a24;
}
.tx-type.income {
  background: #e8f8e8;
  color: #07c160;
}
.tx-type.transfer {
  background: #e8f0ff;
  color: #1989fa;
}
.tx-amount {
  font-size: 15px;
  font-weight: 600;
  flex: 1;
}
.tx-date {
  font-size: 12px;
  color: #999;
}
.tx-note {
  font-size: 12px;
  color: #666;
}
</style>