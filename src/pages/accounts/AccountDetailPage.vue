<template>
  <div class="page account-detail-page">
    <!-- Header -->
    <div class="detail-header">
      <button class="back-btn" @click="router.back()">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div class="header-info">
        <div class="header-name">{{ account?.name }}</div>
        <div class="header-balance" :class="account?.groupId === 'debt' ? 'text-danger' : 'text-default'">
          {{ formatCurrency(account?.balance ?? 0) }}
        </div>
      </div>
      <button class="edit-btn" @click="showEditModal = true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>
    </div>

    <!-- Transactions -->
    <div class="content-area">
      <div v-if="groupedTransactions.length === 0" class="empty-state">暂无流水记录</div>

      <div v-else class="transaction-list">
        <div v-for="group in groupedTransactions" :key="group.dateStr" class="day-group">
          <div class="day-header">{{ group.dateLabel }}</div>
          <div class="day-items">
            <TransactionItem
              v-for="tx in group.transactions"
              :key="tx.id"
              :transaction="tx"
              :account-name="getAccountLabel(tx)"
              :category-name="getCategoryName(tx.categoryId)"
              :category-icon="getCategoryIcon(tx.categoryId)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete button -->
    <div class="delete-area">
      <button class="delete-btn" @click="handleDelete">删除此账户</button>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-header">编辑账户</div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input v-model="editForm.name" class="form-input" placeholder="账户名称" />
            </div>
            <div class="form-group">
              <label class="form-label">图标</label>
              <input v-model="editForm.icon" class="form-input" placeholder="🏦" maxlength="4" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-cancel" @click="showEditModal = false">取消</button>
            <button class="btn btn-confirm" @click="handleEdit">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { liveQuery } from 'dexie'
import { db } from '@/db'
import { useAccountStore } from '@/stores/accountStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { formatCurrency, formatDate, toDateString } from '@/utils/format'
import type { Transaction, Category, Account } from '@/types'
import TransactionItem from '@/components/transactions/TransactionItem.vue'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const categoryStore = useCategoryStore()

const accountId = computed(() => Number(route.params.id))

const account = computed(() => {
  return accountStore.accounts.find((a) => a.id === accountId.value) ?? null
})

// ---- Live transactions for this account ----
const transactions = ref<Transaction[]>([])

watchEffect((onCleanup) => {
  const id = accountId.value
  const observable = liveQuery(() =>
    db.transactions
      .where('fromAccountId')
      .equals(id)
      .or('toAccountId')
      .equals(id)
      .reverse()
      .toArray(),
  )
  const sub = observable.subscribe({
    next: (result) => {
      transactions.value = result
    },
  })
  onCleanup(() => sub.unsubscribe())
})

// ---- Lookup maps ----
const accountMap = computed(() => {
  const map = new Map<number, Account>()
  for (const a of accountStore.accounts) {
    if (a.id != null) map.set(a.id, a)
  }
  return map
})

const categoryMap = computed(() => {
  const map = new Map<number, Category>()
  for (const c of categoryStore.categories) {
    if (c.id != null) map.set(c.id, c)
  }
  return map
})

// ---- Group by date ----
interface DayGroup {
  dateStr: string
  dateLabel: string
  transactions: Transaction[]
}

const groupedTransactions = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions.value) {
    const key = tx.date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const sortedDates = [...groups.keys()].sort().reverse()
  const now = new Date()
  const todayStr = toDateString(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateString(yesterday)

  const result: DayGroup[] = []
  for (const dateStr of sortedDates) {
    let dateLabel: string
    if (dateStr === todayStr) {
      dateLabel = '今天'
    } else if (dateStr === yesterdayStr) {
      dateLabel = '昨天'
    } else {
      dateLabel = formatDate(dateStr)
    }

    result.push({
      dateStr,
      dateLabel,
      transactions: groups.get(dateStr)!,
    })
  }

  return result
})

// ---- Helper functions ----
function getAccountLabel(tx: Transaction): string {
  if (tx.type === 'transfer') {
    const fromName = tx.fromAccountId != null
      ? (accountMap.value.get(tx.fromAccountId)?.name ?? '未知账户')
      : '未知账户'
    const toName = tx.toAccountId != null
      ? (accountMap.value.get(tx.toAccountId)?.name ?? '未知账户')
      : '未知账户'
    return `${fromName} → ${toName}`
  }
  const accountId_ = tx.type === 'income' ? tx.toAccountId : tx.fromAccountId
  if (accountId_ == null) return '未知账户'
  return accountMap.value.get(accountId_)?.name ?? '未知账户'
}

function getCategoryName(categoryId: number | null | undefined): string {
  if (categoryId == null) return ''
  return categoryMap.value.get(categoryId)?.name ?? ''
}

function getCategoryIcon(categoryId: number | null | undefined): string {
  if (categoryId == null) return ''
  return categoryMap.value.get(categoryId)?.icon ?? ''
}

// ---- Edit modal ----
const showEditModal = ref(false)
const editForm = reactive({
  name: '',
  icon: '',
})

watchEffect(() => {
  if (account.value) {
    editForm.name = account.value.name
    editForm.icon = account.value.icon
  }
})

async function handleEdit() {
  if (!editForm.name.trim() || account.value?.id == null) return
  await accountStore.updateAccount(account.value.id, {
    name: editForm.name.trim(),
    icon: editForm.icon || '🏦',
  })
  showEditModal.value = false
}

// ---- Delete ----
async function handleDelete() {
  if (account.value?.id == null) return
  try {
    await accountStore.deleteAccount(account.value.id)
    router.push('/accounts')
  } catch (e: any) {
    alert(e.message)
  }
}
</script>

<style scoped>
.account-detail-page {
  padding: 0;
  background: var(--color-bg);
  min-height: 100%;
  padding-bottom: 40px;
}

.detail-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-separator);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: #007aff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  text-align: center;
}

.header-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.header-balance {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-top: 4px;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: #007aff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.content-area {
  padding: 8px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 16px;
  font-size: 15px;
  color: var(--color-secondary-text);
}

.day-group {
  margin: 6px 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
}

.day-header {
  padding: 12px 16px 6px;
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
}

.delete-area {
  padding: 24px 16px;
}

.delete-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: none;
  background: #ff3b30;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.delete-btn:active {
  opacity: 0.7;
}

.text-danger {
  color: #ff3b30;
}

.text-default {
  color: var(--color-text);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  padding: 8px 24px 32px;
}

.modal-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d1d1d6;
  margin: 0 auto 12px;
}

.modal-header {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: var(--color-text);
}

.modal-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-secondary-text);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--color-separator);
  background: #f2f2f6;
  padding: 0 12px;
  font-size: 15px;
  color: var(--color-text);
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.btn:active {
  opacity: 0.7;
}

.btn-cancel {
  background: #f2f2f6;
  color: var(--color-text);
}

.btn-confirm {
  background: #007aff;
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>