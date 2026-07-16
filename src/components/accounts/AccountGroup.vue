<template>
  <div class="account-group">
    <div class="group-header" @click="toggle">
      <div class="group-title-row">
        <span class="group-title">{{ title }}</span>
        <span class="group-arrow" :class="{ open: isOpen }">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </div>
      <span class="group-total" :class="groupId === 'debt' ? 'debt' : ''">
        {{ groupId === 'debt' ? '-' : '' }}{{ formatCurrency(Math.abs(groupTotal)) }}
      </span>
    </div>
    <div v-show="isOpen" class="group-items">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="account-row"
        @click="router.push('/accounts/' + account.id)"
      >
        <span class="account-icon">{{ account.icon }}</span>
        <span class="account-name">{{ account.name }}</span>
        <span class="account-balance" :class="account.balance < 0 ? 'debt' : ''">
          {{ account.balance < 0 ? '-' : '' }}{{ formatCurrency(Math.abs(account.balance)) }}
        </span>
      </div>
      <div v-if="accounts.length === 0" class="empty-row">暂无账户</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Account } from '@/types'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  title: string
  accounts: Account[]
  groupId: string
  defaultOpen?: boolean
}>()

const router = useRouter()
const isOpen = ref(props.defaultOpen ?? true)

function toggle() {
  isOpen.value = !isOpen.value
}

const groupTotal = computed(() => {
  return props.accounts.reduce((sum, a) => sum + a.balance, 0)
})
</script>

<style scoped>
.account-group {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
}

.group-arrow {
  color: #8e8e93;
  display: flex;
  transition: transform 0.2s;
}

.group-arrow.open {
  transform: rotate(180deg);
}

.group-total {
  font-size: 13px;
  font-weight: 600;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}

.group-total.debt {
  color: #ff453a;
}

.group-items {
  padding: 0 0 4px;
}

.account-row {
  display: flex;
  align-items: center;
  padding: 10px 16px 10px 24px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.account-row:active {
  opacity: 0.7;
}

.account-icon {
  font-size: 18px;
  width: 28px;
  flex-shrink: 0;
}

.account-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #1c1c1e;
}

.account-balance {
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
}

.account-balance.debt {
  color: #ff453a;
}

.empty-row {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  color: #8e8e93;
}
</style>