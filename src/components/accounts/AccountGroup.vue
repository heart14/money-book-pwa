<template>
  <div class="account-group" :class="{ 'is-debt': groupId === 'debt' }">
    <div class="group-header" @click="toggle">
      <div class="group-title">
        <span>{{ title }}</span>
        <span class="group-total" :class="groupId === 'debt' ? 'text-danger' : 'text-default'">
          {{ formatCurrency(groupTotal) }}
        </span>
      </div>
      <div class="group-arrow" :class="{ open: isOpen }">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
    <div v-show="isOpen" class="group-items">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="account-row"
        @click="$router.push('/accounts/' + account.id)"
      >
        <span class="account-icon">{{ account.icon }}</span>
        <span class="account-name">{{ account.name }}</span>
        <span class="account-balance" :class="groupId === 'debt' ? 'text-danger' : 'text-default'">
          {{ formatCurrency(account.balance) }}
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

const isOpen = ref(props.defaultOpen ?? false)

function toggle() {
  isOpen.value = !isOpen.value
}

const groupTotal = computed(() => {
  return props.accounts.reduce((sum, a) => sum + a.balance, 0)
})
</script>

<style scoped>
.account-group {
  background: var(--color-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.group-header:active {
  opacity: 0.7;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.group-total {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.group-arrow {
  display: flex;
  align-items: center;
  color: var(--color-secondary-text);
  transition: transform 0.2s ease;
}

.group-arrow.open {
  transform: rotate(180deg);
}

.group-items {
  border-top: 1px solid var(--color-separator);
}

.account-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid var(--color-separator);
}

.account-row:last-child {
  border-bottom: none;
}

.account-row:active {
  opacity: 0.7;
}

.account-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f2f2f6;
  margin-right: 10px;
}

.account-name {
  flex: 1;
  font-size: 15px;
  color: var(--color-text);
}

.account-balance {
  font-size: 15px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.empty-row {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  color: var(--color-secondary-text);
}

.text-danger {
  color: #ff3b30;
}

.text-default {
  color: var(--color-text);
}
</style>