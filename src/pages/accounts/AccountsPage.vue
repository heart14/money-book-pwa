<template>
  <div class="accounts-page">
    <!-- Page Header -->
    <div class="page-header">
      <span class="page-title">资产</span>
      <div class="header-actions">
        <button class="header-icon-btn" @click="showAddModal = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Total Balance Card -->
    <div class="balance-card">
      <div class="balance-label">总资产</div>
      <div class="balance-amount">{{ formatCurrency(accountStore.totalBalance) }}</div>
    </div>

    <!-- Accounts List -->
    <div class="accounts-list">
      <div class="list-header">资产明细</div>
      <div
        v-for="acc in accountStore.accounts"
        :key="acc.id"
        class="account-row"
        @click="openEdit(acc)"
      >
        <span class="account-icon">{{ acc.icon }}</span>
        <div class="account-info">
          <span class="account-name">{{ acc.name }}</span>
          <span class="account-balance">{{ formatCurrency(acc.balance) }}</span>
        </div>
        <button class="delete-btn" @click.stop="handleDelete(acc)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
      <div v-if="accountStore.accounts.length === 0" class="empty-row">
        暂无资产，点击右上角 + 添加
      </div>
    </div>

    <!-- Add Account Modal -->
    <CommonBottomSheet
      :visible="showAddModal"
      title="新增资产"
      @close="showAddModal = false"
    >
      <div class="form-group">
        <label class="form-label">名称</label>
        <input v-model="form.name" class="form-input" placeholder="例：银行卡" />
      </div>
      <div class="form-group">
        <label class="form-label">图标</label>
        <input v-model="form.icon" class="form-input" placeholder="💳" maxlength="4" />
      </div>
      <div class="form-group">
        <label class="form-label">余额 (¥)</label>
        <input v-model.number="form.initialBalance" class="form-input" type="number" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">排序</label>
        <input v-model.number="form.sort" class="form-input" type="number" placeholder="0" />
      </div>
      <template #actions>
        <button class="btn btn-cancel" @click="showAddModal = false">取消</button>
        <button class="btn btn-confirm" @click="handleAdd">确认</button>
      </template>
    </CommonBottomSheet>

    <!-- Edit Account Modal -->
    <CommonBottomSheet
      :visible="editTarget != null"
      title="编辑资产"
      @close="editTarget = null"
    >
      <div class="form-group">
        <label class="form-label">名称</label>
        <input v-model="editForm.name" class="form-input" placeholder="资产名称" />
      </div>
      <div class="form-group">
        <label class="form-label">图标</label>
        <input v-model="editForm.icon" class="form-input" placeholder="💳" maxlength="4" />
      </div>
      <div class="form-group">
        <label class="form-label">余额 (¥)</label>
        <input v-model.number="editForm.balanceYuan" class="form-input" type="number" step="0.01" placeholder="0.00" />
      </div>
      <template #actions>
        <button class="btn btn-cancel" @click="editTarget = null">取消</button>
        <button class="btn btn-confirm" @click="handleEdit">保存</button>
      </template>
    </CommonBottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { formatCurrency } from '@/utils/format'
import type { Account } from '@/types'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'

const accountStore = useAccountStore()

// ── Add modal ──
const showAddModal = ref(false)
const form = reactive({
  name: '',
  icon: '💳',
  initialBalance: 0,
  sort: 0,
})

async function handleAdd() {
  if (!form.name.trim()) return
  await accountStore.addAccount({
    name: form.name.trim(),
    icon: form.icon || '💳',
    balance: Math.round(parseFloat(String(form.initialBalance || '0')) * 100),
    sort: form.sort,
  })
  form.name = ''
  form.icon = '💳'
  form.initialBalance = 0
  form.sort = 0
  showAddModal.value = false
}

// ── Edit modal ──
const editTarget = ref<Pick<Account, 'id' | 'name' | 'icon' | 'balance'> | null>(null)
const editForm = reactive({
  name: '',
  icon: '',
  balanceYuan: 0,
})

function openEdit(acc: Account) {
  if (acc.id == null) return
  editTarget.value = { id: acc.id, name: acc.name, icon: acc.icon, balance: acc.balance }
  editForm.name = acc.name
  editForm.icon = acc.icon
  editForm.balanceYuan = Math.round(acc.balance) / 100
}

async function handleEdit() {
  if (!editTarget.value || !editForm.name.trim()) return
  const id = editTarget.value.id
  if (id == null) return
  await accountStore.updateAccount(id, {
    name: editForm.name.trim(),
    icon: editForm.icon || '💳',
    balance: Math.round(parseFloat(String(editForm.balanceYuan || '0')) * 100),
  })
  editTarget.value = null
}

// ── Delete ──
async function handleDelete(acc: Account) {
  if (acc.id == null) return
  if (!confirm(`确定删除「${acc.name}」？`)) return
  await accountStore.deleteAccount(acc.id)
}
</script>

<style scoped>
.accounts-page {
  padding: 16px;
  background: var(--color-bg);
  min-height: 100%;
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  color: #1c1c1e;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.header-icon-btn:active {
  background: rgba(0, 122, 255, 0.1);
}

/* ── Balance Card ── */
.balance-card {
  background: linear-gradient(135deg, #1c1c1e, #2c2c2e);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.balance-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.balance-amount {
  font-size: 34px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}

/* ── Accounts List ── */
.accounts-list {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  overflow: hidden;
}

.list-header {
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
  padding: 14px 16px 8px;
}

.account-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-top: 1px solid rgba(60, 60, 67, 0.05);
}

.account-row:active {
  opacity: 0.7;
}

.account-icon {
  font-size: 22px;
  width: 32px;
  flex-shrink: 0;
}

.account-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-name {
  font-size: 15px;
  font-weight: 500;
  color: #1c1c1e;
}

.account-balance {
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
  margin-right: 12px;
}

.delete-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
}

.delete-btn:active {
  background: rgba(255, 59, 48, 0.1);
}

.empty-row {
  padding: 24px 16px;
  text-align: center;
  font-size: 14px;
  color: #8e8e93;
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
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-primary);
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
</style>