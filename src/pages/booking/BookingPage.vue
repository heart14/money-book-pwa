<template>
  <div class="booking-page">
    <div class="booking-content">
      <!-- Mode Switch centered -->
      <div class="mode-switch-wrapper">
        <ModeSwitch v-model="bookingMode" @update:model-value="onModeChange" />
      </div>

      <!-- Amount Display - tap to show keyboard -->
      <div class="amount-display" @click="keyboardVisible = true">{{ displayAmount }}</div>

      <!-- Account Selector -->
      <div v-if="bookingMode !== 'transfer'" class="account-section">
        <button class="account-btn" @click="showAccountPicker = !showAccountPicker">
          <span class="account-btn-text">
            {{ selectedAccount ? `${selectedAccount.icon} ${selectedAccount.name}` : '选择账户' }}
          </span>
          <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-if="showAccountPicker" class="account-dropdown">
          <button
            v-for="acc in accounts"
            :key="acc.id"
            class="account-option"
            :class="{ selected: selectedAccount?.id === acc.id }"
            @click="selectAccount(acc)"
          >
            {{ acc.icon }} {{ acc.name }}
          </button>
        </div>
      </div>

      <!-- Transfer mode: from → to -->
      <div v-else class="transfer-section">
        <div class="transfer-row">
          <div class="transfer-col">
            <span class="transfer-label">从</span>
            <button class="account-btn small" @click="showAccountPicker = !showAccountPicker; showToAccountPicker = false">
              <span>{{ selectedAccount ? `${selectedAccount.icon} ${selectedAccount.name}` : '选择' }}</span>
              <svg class="chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div v-if="showAccountPicker" class="account-dropdown">
              <button
                v-for="acc in liquidAccounts"
                :key="acc.id"
                class="account-option"
                :class="{ selected: selectedAccount?.id === acc.id }"
                @click="selectAccount(acc)"
              >
                {{ acc.icon }} {{ acc.name }}
              </button>
            </div>
          </div>
          <span class="transfer-arrow">&rarr;</span>
          <div class="transfer-col">
            <span class="transfer-label">到</span>
            <button class="account-btn small" @click="showToAccountPicker = !showToAccountPicker; showAccountPicker = false">
              <span>{{ selectedToAccount ? `${selectedToAccount.icon} ${selectedToAccount.name}` : '选择' }}</span>
              <svg class="chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div v-if="showToAccountPicker" class="account-dropdown">
              <button
                v-for="acc in accounts"
                :key="acc.id"
                class="account-option"
                :class="{ selected: selectedToAccount?.id === acc.id }"
                @click="selectToAccount(acc)"
              >
                {{ acc.icon }} {{ acc.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Picker (hidden in transfer mode) -->
      <CategoryPicker
        v-if="bookingMode !== 'transfer'"
        :type="bookingMode === 'expense' ? 'expense' : 'income'"
        :selected-category-id="selectedCategoryId"
        @select="onCategorySelect"
      />

      <!-- Note Input -->
      <div class="note-section">
        <input
          v-model="note"
          class="note-input"
          type="text"
          placeholder="添加备注"
          maxlength="200"
        />
      </div>
    </div>

    <!-- Number Keyboard (shown when amount area is tapped) -->
    <NumberKeyboard
      :value="inputValue"
      :visible="keyboardVisible"
      @update:value="inputValue = $event"
      @confirm="handleConfirm"
      @close="keyboardVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useUiStore, type BookingMode } from '@/stores/uiStore'
import type { Account, Transaction } from '@/types'
import ModeSwitch from '@/components/booking/ModeSwitch.vue'
import NumberKeyboard from '@/components/booking/NumberKeyboard.vue'
import CategoryPicker from '@/components/booking/CategoryPicker.vue'

const accountStore = useAccountStore()
const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()
const uiStore = useUiStore()

// ── State ──
const bookingMode = ref<BookingMode>(uiStore.bookingMode)
const inputValue = ref('0')
const keyboardVisible = ref(false)
const selectedAccount = ref<Account | null>(null)
const selectedToAccount = ref<Account | null>(null)
const selectedCategoryId = ref<number | null>(null)
const note = ref('')
const showAccountPicker = ref(false)
const showToAccountPicker = ref(false)

// ── Computed ──
const displayAmount = computed(() => {
  const v = inputValue.value
  if (v === '0') return '¥0.00'
  return '¥' + v
})

const accounts = computed(() => accountStore.accounts)
const liquidAccounts = computed(() => accountStore.getAccountsByGroup('liquid'))

// ── Init default account ──
function initDefaultAccount() {
  if (selectedAccount.value) return
  if (accountStore.accounts.length === 0) return

  const lastId = uiStore.lastAccountId
  if (lastId) {
    const found = accountStore.accounts.find((a) => a.id === lastId)
    if (found) {
      selectedAccount.value = found
      return
    }
  }

  const liquid = accountStore.getAccountsByGroup('liquid')
  if (liquid.length > 0) {
    selectedAccount.value = liquid[0]
  }
}

onMounted(initDefaultAccount)
watch(() => accountStore.accounts.length, initDefaultAccount)

// ── Mode change ──
function onModeChange(mode: BookingMode) {
  bookingMode.value = mode
  uiStore.setMode(mode)
  selectedCategoryId.value = null
  if (mode === 'transfer') {
    selectedToAccount.value = null
  }
}

// ── Account selection ──
function selectAccount(acc: Account) {
  selectedAccount.value = acc
  showAccountPicker.value = false
}

function selectToAccount(acc: Account) {
  selectedToAccount.value = acc
  showToAccountPicker.value = false
}

// ── Category selection ──
function onCategorySelect(categoryId: number) {
  selectedCategoryId.value = categoryId
  keyboardVisible.value = false
}

// ── Confirm (submit transaction) ──
async function handleConfirm() {
  if (inputValue.value === '0') return

  const amount = parseFloat(inputValue.value)
  if (isNaN(amount) || amount <= 0) return

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  let tx: Omit<Transaction, 'id'>

  if (bookingMode.value === 'transfer') {
    if (!selectedAccount.value || !selectedToAccount.value) return
    if (selectedAccount.value.id === selectedToAccount.value.id) return
    tx = {
      type: 'transfer',
      amount,
      fromAccountId: selectedAccount.value.id!,
      toAccountId: selectedToAccount.value.id!,
      categoryId: null,
      tags: [],
      note: note.value,
      date: dateStr,
      time: timeStr,
    }
  } else if (bookingMode.value === 'expense') {
    if (!selectedAccount.value || !selectedCategoryId.value) return
    tx = {
      type: 'expense',
      amount,
      fromAccountId: selectedAccount.value.id!,
      toAccountId: null,
      categoryId: selectedCategoryId.value,
      tags: [],
      note: note.value,
      date: dateStr,
      time: timeStr,
    }
  } else {
    // income
    if (!selectedAccount.value || !selectedCategoryId.value) return
    tx = {
      type: 'income',
      amount,
      fromAccountId: null,
      toAccountId: selectedAccount.value.id!,
      categoryId: selectedCategoryId.value,
      tags: [],
      note: note.value,
      date: dateStr,
      time: timeStr,
    }
  }

  try {
    await transactionStore.addTransaction(tx)
    uiStore.setLastAccount(selectedAccount.value.id!)
    if (selectedCategoryId.value) {
      uiStore.setLastCategory(selectedCategoryId.value)
    }
    resetState()
  } catch (e) {
    console.error('记账失败', e)
  }
}

function resetState() {
  inputValue.value = '0'
  keyboardVisible.value = false
  selectedCategoryId.value = null
  note.value = ''
  selectedToAccount.value = null
  showAccountPicker.value = false
  showToAccountPicker.value = false
}
</script>

<style scoped>
.booking-page {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.booking-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 280px;
  -webkit-overflow-scrolling: touch;
}

/* ── Mode Switch ── */
.mode-switch-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

/* ── Amount Display ── */
.amount-display {
  text-align: center;
  font-size: 48px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
  margin-bottom: 20px;
  font-variant-numeric: tabular-nums;
}

/* ── Account Selector ── */
.account-section,
.transfer-section {
  margin-bottom: 20px;
}

.account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
  padding: 12px 16px;
  background: var(--color-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  font-size: 15px;
  color: var(--color-text);
  transition: background 0.15s;
}

.account-btn:active {
  background: rgba(255, 255, 255, 0.6);
}

.account-btn.small {
  max-width: 160px;
  padding: 8px 12px;
  font-size: 13px;
}

.account-btn-text {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
  color: var(--color-secondary-text);
}

.account-dropdown {
  max-width: 240px;
  margin: 4px auto 0;
  background: var(--color-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.account-option {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}

.account-option:active {
  background: rgba(0, 122, 255, 0.08);
}

.account-option.selected {
  color: var(--color-primary);
  font-weight: 600;
}

/* ── Transfer Mode ── */
.transfer-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
}

.transfer-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.transfer-label {
  font-size: 12px;
  color: var(--color-secondary-text);
  font-weight: 500;
}

.transfer-arrow {
  font-size: 20px;
  color: var(--color-secondary-text);
  padding-top: 22px;
}

/* ── Note Input ── */
.note-section {
  margin-top: 16px;
}

.note-input {
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text);
  outline: none;
}

.note-input::placeholder {
  color: var(--color-secondary-text);
}
</style>