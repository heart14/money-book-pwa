<template>
  <div class="accounts-page">
    <!-- 沉浸式头部 -->
    <header class="ac-head">
      <span class="ac-title">资产</span>
      <button class="ac-action" @click="showAddModal = true" aria-label="添加资产">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </header>

    <!-- 净资产开篇 -->
    <div class="ac-net">
      <span class="ac-net-label">净资产</span>
      <div class="ac-net-value num">{{ formatCurrency(accountStore.totalBalance) }}</div>
    </div>

    <!-- 账户列表：连续分隔线 -->
    <section class="ac-list">
      <div v-if="accountStore.accounts.length === 0" class="ac-empty">
        暂无资产，点击右上角 + 添加
      </div>
      <div
        v-for="acc in accountStore.accounts"
        :key="acc.id"
        class="ac-row"
        @click="openEdit(acc)"
      >
        <span class="ac-icon"><TwemojiIcon :emoji="acc.icon" /></span>
        <div class="ac-mid">
          <span class="ac-name">{{ acc.name }}</span>
          <span class="ac-sub">余额</span>
        </div>
        <span class="num ac-amt">{{ formatCurrency(acc.balance) }}</span>
        <button class="ac-del" @click.stop="handleDelete(acc)" aria-label="删除">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </section>

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

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      :visible="deleteTarget != null"
      title="确认删除"
      :message="deleteTarget ? `确定删除「${deleteTarget.name}」？` : ''"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="handleConfirmDelete"
      @update:visible="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { formatCurrency } from '@/utils/format'
import type { Account } from '@/types'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TwemojiIcon from '@/components/common/TwemojiIcon.vue'

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
const deleteTarget = ref<Account | null>(null)

function handleDelete(acc: Account) {
  if (acc.id == null) return
  deleteTarget.value = acc
}

async function handleConfirmDelete() {
  const acc = deleteTarget.value
  if (!acc || acc.id == null) return
  await accountStore.deleteAccount(acc.id)
  deleteTarget.value = null
}
</script>

<style scoped>
.accounts-page {
  min-height: 100%;
  min-height: 100svh;
  padding: 0 24px 24px;
  background: var(--surface);
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

/* ── 沉浸式头部 ── */
.ac-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 2px 8px; }
.ac-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); }
.ac-action { width: 38px; height: 38px; border: none; background: none; color: var(--ink); display: flex; align-items: center; justify-content: center; border-radius: 12px; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background 0.15s; }
.ac-action:active { background: var(--act-bg); }

/* ── 净资产开篇 ── */
.ac-net { padding: 18px 2px 34px; border-bottom: 1px solid var(--line-soft); margin-bottom: 10px; }
.ac-net-label { font-size: 13px; color: var(--ink2); font-weight: 600; letter-spacing: 0.3px; }
.ac-net-value { font-size: 52px; font-weight: 800; letter-spacing: -0.04em; margin-top: 10px; color: var(--ink); font-variant-numeric: tabular-nums; }

/* ── 连续账户列表 ── */
.ac-empty { padding: 40px 0; text-align: center; font-size: 14px; color: var(--ink3); }
.ac-row { display: flex; align-items: center; gap: 13px; padding: 16px 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ac-row + .ac-row { border-top: 1px solid var(--line-soft); }
.ac-row:active { background: var(--act-bg); }
.ac-icon { font-size: 20px; width: 32px; flex-shrink: 0; display: grid; place-items: center; }
.ac-mid { flex: 1; min-width: 0; }
.ac-name { display: block; font-size: 15px; font-weight: 600; color: var(--ink); }
.ac-sub { display: block; font-size: 11px; color: var(--ink3); margin-top: 2px; }
.ac-amt { font-size: 15px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.ac-del { width: 32px; height: 32px; border: none; background: none; color: var(--exp); display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
.ac-del:active { background: rgba(213, 80, 60, 0.1); }

/* ── Sheet 内表单 ── */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: var(--fs-body); font-weight: 500; color: var(--ink2); margin-bottom: 6px; }
.form-input { width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); padding: 0 12px; font-size: var(--fs-title); color: var(--ink); outline: none; box-sizing: border-box; }
.form-input:focus { border-color: var(--ink); }

.btn { flex: 1; height: 44px; border-radius: var(--radius-sm); border: none; font-size: var(--fs-amount); font-weight: 500; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: opacity 0.15s; }
.btn:active { opacity: 0.7; }
.btn-cancel { background: var(--act-bg); color: var(--ink); }
.btn-confirm { background: var(--ink); color: var(--accent-fg); }
</style>