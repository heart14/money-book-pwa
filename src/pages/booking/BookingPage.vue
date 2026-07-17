<template>
  <div class="booking-page">
    <div class="booking-content" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <!-- Mode Switch centered -->
      <div class="mode-switch-wrapper">
        <ModeSwitch v-model="bookingMode" @update:model-value="onModeChange" />
      </div>

      <!-- Amount Display -->
      <div class="amount-display" @click="keyboardVisible = true">{{ displayAmount }}</div>

      <!-- Animated content area -->
      <Transition name="mode-fade" mode="out-in">
        <div :key="bookingMode" class="mode-content">
          <!-- Non-transfer: account + category + inputs -->
          <template v-if="bookingMode !== 'transfer'">
            <!-- Account Selector (overlay dropdown) -->
            <div class="account-selector-wrap">
              <button class="account-btn" @click="showAccountPicker = !showAccountPicker">
                <span class="account-btn-label">从</span>
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

            <!-- Category Picker -->
            <CategoryPicker
              :type="bookingMode === 'expense' ? 'expense' : 'income'"
              :selected-category-id="selectedCategoryId"
              @select="onCategorySelect"
            />
          </template>

          <!-- Transfer: from → to -->
          <template v-else>
            <div class="transfer-section">
              <div class="transfer-row">
                <div class="transfer-col">
                  <span class="transfer-label">从</span>
                  <div class="account-selector-wrap inline">
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
                </div>
                <span class="transfer-arrow">&rarr;</span>
                <div class="transfer-col">
                  <span class="transfer-label">到</span>
                  <div class="account-selector-wrap inline">
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
            </div>
          </template>

          <!-- Title Input -->
          <div class="note-section">
            <input
              v-model="title"
              class="note-input"
              type="text"
              placeholder="添加标题"
              maxlength="100"
            />
          </div>

          <!-- Tags Input -->
          <div class="tags-section">
            <div class="tags-chips">
              <span
                v-for="(tag, idx) in tags"
                :key="idx"
                class="tag-chip"
              >
                {{ tag }}
                <button class="tag-remove" @click="removeTag(idx)">&times;</button>
              </span>
              <input
                v-model="tagInput"
                class="tag-input"
                type="text"
                placeholder="添加标签"
                maxlength="20"
                @keydown.enter.prevent="addTag"
                @keydown.,.prevent="addTag"
              />
            </div>
          </div>

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
      </Transition>
    </div>

    <!-- Number Keyboard -->
    <NumberKeyboard
      :value="inputValue"
      :visible="keyboardVisible"
      @update:value="inputValue = $event"
      @close="keyboardVisible = false"
    />

    <!-- Save Toast -->
    <Transition name="toast">
      <div v-if="toastVisible" class="save-toast">{{ toastMessage }}</div>
    </Transition>
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

// Swipe mode order
const modeOrder: BookingMode[] = ['income', 'expense', 'transfer']

// ── State ──
const bookingMode = ref<BookingMode>(uiStore.bookingMode)
const inputValue = ref('0')
const keyboardVisible = ref(false)
const selectedAccount = ref<Account | null>(null)
const selectedToAccount = ref<Account | null>(null)
const selectedCategoryId = ref<number | null>(null)
const note = ref('')
const title = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')
const showAccountPicker = ref(false)
const showToAccountPicker = ref(false)

// Touch swipe state
let touchStartX = 0

// ── Computed ──
const displayAmount = computed(() => {
  const v = inputValue.value
  if (v === '0') return '¥0.00'

  if (v.includes('.')) {
    const [intPart, decPart = ''] = v.split('.')
    const formattedInt = intPart ? parseInt(intPart).toLocaleString('zh-CN') : '0'
    if (decPart === '') {
      // 刚按小数点，显示 .00 占位
      return `¥${formattedInt}.00`
    }
    return `¥${formattedInt}.${decPart.padEnd(2, '0')}`
  }

  // 纯整数输入，显示千分位
  return `¥${parseInt(v).toLocaleString('zh-CN')}`
})

const accounts = computed(() => accountStore.accounts)
const liquidAccounts = computed(() => accountStore.getAccountsByGroup('liquid'))

const canSave = computed(() => {
  if (inputValue.value === '0') return false
  const amount = Math.round(parseFloat(inputValue.value) * 100)
  if (isNaN(amount) || amount <= 0) return false

  if (bookingMode.value === 'transfer') {
    return selectedAccount.value != null && selectedToAccount.value != null
  }
  return selectedAccount.value != null && selectedCategoryId.value != null
})

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

  if (accountStore.accounts.length > 0) {
    selectedAccount.value = accountStore.accounts[0]
  }
}

onMounted(initDefaultAccount)
watch(() => accountStore.accounts.length, initDefaultAccount)

// ── Swipe handlers ──
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  const deltaX = touch.clientX - touchStartX
  const absDelta = Math.abs(deltaX)
  // Require horizontal swipe > 50px and clearly more horizontal than vertical
  if (absDelta < 50) return

  const idx = modeOrder.indexOf(bookingMode.value)
  if (deltaX < 0 && idx < modeOrder.length - 1) {
    onModeChange(modeOrder[idx + 1])
  } else if (deltaX > 0 && idx > 0) {
    onModeChange(modeOrder[idx - 1])
  }
}

// ── Mode change ──
function onModeChange(mode: BookingMode) {
  bookingMode.value = mode
  uiStore.setMode(mode)
  selectedCategoryId.value = null
  showAccountPicker.value = false
  showToAccountPicker.value = false
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

// ── Tags ──
function addTag() {
  const t = tagInput.value.trim()
  if (t && !tags.value.includes(t)) {
    tags.value.push(t)
  }
  tagInput.value = ''
}

function removeTag(idx: number) {
  tags.value.splice(idx, 1)
}

// ── Toast ──
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer = 0

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastVisible.value = false }, 2000)
}

// ── Confirm (submit transaction) ──
async function handleConfirm() {
  if (inputValue.value === '0') return

  const amount = Math.round(parseFloat(inputValue.value) * 100)
  if (isNaN(amount) || amount <= 0) return

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  let tx: Omit<Transaction, 'id'>

  const plainTags = [...tags.value]

  if (bookingMode.value === 'transfer') {
    if (!selectedAccount.value || !selectedToAccount.value) return
    if (selectedAccount.value.id === selectedToAccount.value.id) return
    tx = {
      type: 'transfer',
      title: title.value,
      amount,
      fromAccountId: selectedAccount.value.id!,
      toAccountId: selectedToAccount.value.id!,
      categoryId: null,
      tags: plainTags,
      note: note.value,
      date: dateStr,
      time: timeStr,
    }
  } else if (bookingMode.value === 'expense') {
    if (!selectedAccount.value || !selectedCategoryId.value) return
    tx = {
      type: 'expense',
      title: title.value,
      amount,
      fromAccountId: selectedAccount.value.id!,
      toAccountId: null,
      categoryId: selectedCategoryId.value,
      tags: plainTags,
      note: note.value,
      date: dateStr,
      time: timeStr,
    }
  } else {
    // income
    if (!selectedAccount.value || !selectedCategoryId.value) return
    tx = {
      type: 'income',
      title: title.value,
      amount,
      fromAccountId: null,
      toAccountId: selectedAccount.value.id!,
      categoryId: selectedCategoryId.value,
      tags: plainTags,
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
    uiStore.hideBookingHint()
    const typeLabel = bookingMode.value === 'expense' ? '支出' : bookingMode.value === 'income' ? '收入' : '转账'
    showToast(`${typeLabel}已记录 · ${displayAmount.value}`)
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
  title.value = ''
  tags.value = []
  tagInput.value = ''
  selectedToAccount.value = null
  showAccountPicker.value = false
  showToAccountPicker.value = false
}

// ── Bridge to TabBar checkmark save ──
watch(canSave, (v) => {
  uiStore.bookingCanSave = v
  // Show hint when canSave becomes true and keyboard is already closed
  if (v && !keyboardVisible.value) {
    uiStore.showBookingHint()
  }
}, { immediate: true })

// Show save hint when keyboard closes (by any means: ↵, mask tap, category select)
watch(keyboardVisible, (visible) => {
  if (!visible && canSave.value) {
    uiStore.showBookingHint()
  }
})

watch(
  () => uiStore.bookingSaveTrigger,
  () => {
    if (uiStore.bookingSaveTrigger > 0) handleConfirm()
  },
)
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
  margin-bottom: 12px;
}

/* ── Amount Display ── */
.amount-display {
  text-align: center;
  font-size: 60px;
  font-weight: 700;
  color: #1c1c1e;
  letter-spacing: -1px;
  line-height: 1.2;
  margin-bottom: 12px;
  font-variant-numeric: tabular-nums;
  cursor: text;
}

/* ── Account Selector (row style matching preview) ── */
.account-selector-wrap {
  position: relative;
  margin-bottom: 12px;
  z-index: 10;
}

.account-selector-wrap.inline {
  margin-bottom: 0;
  min-width: 150px;
}

.account-selector-wrap.inline .account-dropdown {
  min-width: 180px;
  white-space: nowrap;
}

.account-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  font-size: 13px;
  color: #1c1c1e;
  transition: background 0.15s;
  width: 100%;
}

.account-btn:active {
  background: rgba(255, 255, 255, 0.5);
}

.account-btn.small {
  padding: 6px 10px;
  font-size: 12px;
}

.account-btn-text {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #007aff;
  font-weight: 600;
}

.account-btn-label {
  color: #1c1c1e;
  font-weight: 400;
}

.chevron {
  flex-shrink: 0;
  color: #8e8e93;
}

.account-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 50;
}

.account-option {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: #1c1c1e;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}

.account-option:active {
  background: rgba(0, 122, 255, 0.08);
}

.account-option.selected {
  color: #007aff;
  font-weight: 600;
}

/* ── Transfer Mode ── */
.transfer-section {
  margin-bottom: 20px;
}

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

/* ── Tags Input ── */
.tags-section {
  margin-bottom: 12px;
  margin-top: 16px;
}

.tags-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e9e9ed;
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

.tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: #c7c7cc;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.tag-remove:active {
  background: #8e8e93;
}

.tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text);
  outline: none;
}

.tag-input::placeholder {
  color: var(--color-secondary-text);
}

/* ── Note Input ── */
.note-section {
  margin-bottom: 20px;
}

.note-input {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-family: inherit;
  font-size: 14px;
  color: #1c1c1e;
  outline: none;
}

.note-input::placeholder {
  color: var(--color-secondary-text);
}

/* ── Mode fade transition ── */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}

/* ── Save Toast ── */
.save-toast {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 24px;
  border-radius: 20px;
  white-space: nowrap;
  z-index: 2000;
  pointer-events: none;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.toast-enter-active {
  transition: all 0.25s ease;
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
</style>