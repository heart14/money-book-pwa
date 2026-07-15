<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Account } from '@/types'

defineProps<{
  groupName: string
  accounts: Account[]
}>()

const router = useRouter()

function go(id?: number) {
  if (id) router.push({ name: 'accountDetail', params: { id: String(id) } })
}

function balCls(a: Account) {
  return a.type === 'debt' ? 'debt' : a.balance >= 0 ? 'positive' : 'negative'
}
</script>

<template>
  <div class="acc-group">
    <div class="group-title">{{ groupName }}</div>
    <div
      v-for="acct in accounts"
      :key="acct.id"
      class="acc-item"
      @click="go(acct.id)"
    >
      <span class="ai-icon">{{ acct.icon }}</span>
      <span class="ai-name">{{ acct.name }}</span>
      <span :class="['ai-balance', balCls(acct)]">
        ¥{{ acct.type === 'debt' ? Math.abs(acct.balance).toFixed(2) : acct.balance.toFixed(2) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.acc-group {
  margin: 0 16px 16px;
}
.group-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  padding: 0 4px;
}
.acc-item {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 2px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.acc-item:active {
  background: #f7f8fa;
}
.ai-icon {
  font-size: 20px;
  margin-right: 12px;
}
.ai-name {
  flex: 1;
  font-size: 15px;
}
.ai-balance {
  font-size: 15px;
  font-weight: 600;
}
.ai-balance.debt {
  color: #ee0a24;
}
.ai-balance.positive {
  color: #333;
}
</style>