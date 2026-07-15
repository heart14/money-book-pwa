<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account } from '@/types'

defineProps<{
  fromAccountId: number | null
  toAccountId: number | null
}>()

const emit = defineEmits<{
  'update:from': [value: number | null]
  'update:to': [value: number | null]
}>()

const accountStore = useAccountStore()
const showPicker = ref(false)
const picking = ref<'from' | 'to'>('from')

const allAccounts = computed(() => accountStore.accounts ?? [])

function open(target: 'from' | 'to') {
  picking.value = target
  showPicker.value = true
}

function select(acct: Account) {
  if (picking.value === 'from') {
    emit('update:from', acct.id ?? null)
  } else {
    emit('update:to', acct.id ?? null)
  }
  showPicker.value = false
}
</script>

<template>
  <div class="transfer-panel">
    <div class="account-row" @click="open('from')">
      <span class="label">转出</span>
      <span class="value">
        {{ allAccounts.find(a => a.id === fromAccountId)?.name || '选择账户' }}
      </span>
    </div>
    <div class="arrow">↓</div>
    <div class="account-row" @click="open('to')">
      <span class="label">转入</span>
      <span class="value">
        {{ allAccounts.find(a => a.id === toAccountId)?.name || '选择账户' }}
      </span>
    </div>
    <van-action-sheet v-model:show="showPicker" title="选择账户">
      <div class="account-list">
        <div
          v-for="acct in allAccounts"
          :key="acct.id"
          class="account-option"
          @click="select(acct)"
        >
          {{ acct.icon }} {{ acct.name }}
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<style scoped>
.transfer-panel {
  padding: 16px;
}
.account-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
}
.arrow {
  text-align: center;
  padding: 4px;
  color: #999;
  font-size: 18px;
}
.label {
  color: #666;
}
.value {
  color: #333;
  font-weight: 600;
}
.account-list {
  padding: 16px;
}
.account-option {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
</style>