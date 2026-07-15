<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTransactionStore } from '@/stores/transactionStore'
import { useAccountStore } from '@/stores/accountStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useValidationEngine } from '@/composables/useValidationEngine'
import type { TransactionType, Account } from '@/types'
import ModeSwitch from '@/components/booking/ModeSwitch.vue'
import CategoryPicker from '@/components/booking/CategoryPicker.vue'
import NumberKeyboard from '@/components/booking/NumberKeyboard.vue'
import TransferPanel from '@/components/booking/TransferPanel.vue'

const tStore = useTransactionStore()
const aStore = useAccountStore()
const catStore = useCategoryStore()
const { validateTransferEligibility } = useValidationEngine()

const mode = ref<TransactionType>('expense')
const modeLocked = ref(false)
const amount = ref('')
const fromAccountId = ref<number | null>(null)
const toAccountId = ref<number | null>(null)
const categoryId = ref<number | null>(null)
const note = ref('')
const showCategoryPicker = ref(false)
const showAccountPicker = ref(false)

const displayAmount = computed(() =>
  amount.value ? (+amount.value).toFixed(2) : '0.00'
)

// Watch account changes for validation engine
watch([fromAccountId, toAccountId], ([fId, tId]) => {
  const list = aStore.accounts ?? []
  const from = list.find((a: Account) => a.id === fId)
  const to = list.find((a: Account) => a.id === tId)
  if (from && to) {
    const r = validateTransferEligibility(from.type, to.type, mode.value)
    if (r.forceMode) {
      mode.value = r.forceMode
      modeLocked.value = r.lockMode
      categoryId.value = null
    }
  }
})

// Reset locked state when mode changes from locked
watch(mode, () => {
  // User explicitly changed mode, unlock (validation will re-lock if needed)
})

async function onConfirm() {
  if (!amount.value || +amount.value <= 0) return
  const date = new Date().toISOString().slice(0, 10)

  if (mode.value === 'transfer') {
    if (!fromAccountId.value || !toAccountId.value) return
    await tStore.addTransaction({
      type: 'transfer',
      amount: +amount.value,
      fromAccountId: fromAccountId.value,
      toAccountId: toAccountId.value,
      categoryId: null,
      tags: [],
      note: note.value,
      date,
    })
  } else if (mode.value === 'expense') {
    if (!fromAccountId.value || !categoryId.value) return
    await tStore.addTransaction({
      type: 'expense',
      amount: +amount.value,
      fromAccountId: fromAccountId.value,
      toAccountId: null,
      categoryId: categoryId.value,
      tags: [],
      note: note.value,
      date,
    })
  } else {
    if (!toAccountId.value || !categoryId.value) return
    await tStore.addTransaction({
      type: 'income',
      amount: +amount.value,
      fromAccountId: null,
      toAccountId: toAccountId.value,
      categoryId: categoryId.value,
      tags: [],
      note: note.value,
      date,
    })
  }

  // Reset form
  amount.value = ''
  categoryId.value = null
  note.value = ''
  modeLocked.value = false
}

function selectAccount(acct: Account) {
  if (mode.value === 'expense') {
    fromAccountId.value = acct.id ?? null
  } else if (mode.value === 'income') {
    toAccountId.value = acct.id ?? null
  }
  showAccountPicker.value = false
}
</script>

<template>
  <div class="booking-page">
    <ModeSwitch v-model="mode" :locked="modeLocked" />

    <!-- 非转账模式：账户选择 + 分类选择 -->
    <div v-if="mode !== 'transfer'" class="input-area">
      <!-- 账户选择 -->
      <div class="field-row" @click="showAccountPicker = true">
        <span class="field-label">{{ mode === 'expense' ? '从' : '到' }}</span>
        <span class="field-value">
          {{
            mode === 'expense'
              ? (aStore.accounts ?? []).find((a: Account) => a.id === fromAccountId)?.name || '选择账户'
              : (aStore.accounts ?? []).find((a: Account) => a.id === toAccountId)?.name || '选择账户'
          }}
        </span>
      </div>
      <!-- 分类选择 -->
      <div class="field-row" @click="showCategoryPicker = !showCategoryPicker">
        <span class="field-label">分类</span>
        <span class="field-value">
          {{
            categoryId
              ? (catStore.categories ?? []).find(c => c.id === categoryId)?.name || '已选择'
              : '选择分类'
          }}
        </span>
      </div>
      <CategoryPicker
        v-if="showCategoryPicker"
        v-model="categoryId"
      />
    </div>

    <!-- 转账模式：转账面板 -->
    <TransferPanel
      v-if="mode === 'transfer'"
      :from-account-id="fromAccountId"
      :to-account-id="toAccountId"
      @update:from="fromAccountId = $event"
      @update:to="toAccountId = $event"
    />

    <!-- 备注 -->
    <div class="note-row">
      <van-field
        v-model="note"
        placeholder="添加备注"
        :border="false"
        clearable
      />
    </div>

    <!-- 金额显示 -->
    <div class="amount-display">
      <span class="amount-symbol">{{ mode === 'expense' ? '-' : mode === 'income' ? '+' : '' }}</span>
      <span class="amount-value">¥ {{ displayAmount }}</span>
    </div>

    <!-- 数字键盘 -->
    <NumberKeyboard
      @input="amount += $event"
      @delete="amount = amount.slice(0, -1)"
      @confirm="onConfirm"
    />

    <!-- 账户选择器 -->
    <van-action-sheet
      v-model:show="showAccountPicker"
      :title="mode === 'expense' ? '选择支付账户' : '选择收款账户'"
    >
      <div class="account-picker-list">
        <div
          v-for="acct in aStore.accounts ?? []"
          :key="acct.id"
          class="account-picker-item"
          @click="selectAccount(acct)"
        >
          <span class="api-icon">{{ acct.icon }}</span>
          <span class="api-name">{{ acct.name }}</span>
          <span :class="['api-balance', acct.type === 'debt' ? 'debt' : '']">
            ¥{{ acct.balance.toFixed(2) }}
          </span>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<style scoped>
.booking-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.input-area {
  padding: 0 16px;
}
.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.field-label {
  color: #666;
  font-size: 14px;
}
.field-value {
  color: #333;
  font-size: 14px;
}
.amount-display {
  text-align: center;
  padding: 20px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.amount-symbol {
  font-size: 20px;
  color: #333;
  margin-right: 4px;
}
.amount-value {
  font-size: 36px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.note-row {
  padding: 0 16px;
}
.account-picker-list {
  padding: 16px;
}
.account-picker-item {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.account-picker-item:active {
  background: #f7f8fa;
}
.api-icon {
  font-size: 20px;
  margin-right: 12px;
}
.api-name {
  flex: 1;
  font-size: 15px;
}
.api-balance {
  font-size: 14px;
  color: #333;
}
.api-balance.debt {
  color: #ee0a24;
}
</style>