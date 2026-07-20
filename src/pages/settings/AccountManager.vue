<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon">🏦</span><span class="row-label">管理账户</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <div v-if="expanded" class="expanded-content">
      <div v-if="accountStore.accounts.length === 0" class="empty-hint">暂无账户</div>
      <div
        v-for="(acc, idx) in accountStore.accounts"
        :key="acc.id"
        class="account-item"
        draggable="true"
        :class="{ 'drag-over': dragOverIdx === idx }"
        @dragstart="onDragStart($event, idx)"
        @dragover.prevent="onDragOver(idx)"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop($event, idx)"
        @dragend="onDragEnd"
      >
        <span class="drag-handle">⠿</span>
        <span class="account-icon">{{ acc.icon }}</span>
        <div class="account-info">
          <span class="account-name">{{ acc.name }}</span>
          <span class="account-balance">{{ formatCurrency(acc.balance) }}</span>
        </div>
        <button class="icon-btn" @click="openEditAccount(acc)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn icon-btn--danger" @click="confirmDeleteAccount(acc)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
      <button class="add-btn" @click="showAddAccount = true">+ 新增账户</button>
    </div>

    <!-- Add Account Modal -->
    <div v-if="showAddAccount" class="modal-overlay" @click.self="showAddAccount = false">
      <div class="modal-bottom">
        <div class="modal-handle"></div>
        <h3 class="modal-title">新增账户</h3>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">名称</label>
            <input v-model="addForm.name" class="form-input" placeholder="账户名称" />
          </div>
          <div class="form-group">
            <label class="form-label">图标</label>
            <input v-model="addForm.icon" class="form-input" placeholder="💳" maxlength="4" />
          </div>
          <div class="form-group">
            <label class="form-label">初始余额 (¥)</label>
            <input v-model.number="addForm.initialBalance" class="form-input" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">排序</label>
            <input v-model.number="addForm.sort" class="form-input" type="number" placeholder="0" />
          </div>
        </div>
        <div class="modal-bottom-actions">
          <button class="btn-primary" :disabled="!addForm.name.trim()" @click="handleAdd">确认</button>
          <button class="btn-cancel" @click="showAddAccount = false">取消</button>
        </div>
      </div>
    </div>

    <!-- Edit Account Modal -->
    <div v-if="editTarget" class="modal-overlay" @click.self="editTarget = null">
      <div class="modal-bottom">
        <div class="modal-handle"></div>
        <h3 class="modal-title">编辑账户</h3>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">名称</label>
            <input v-model="editForm.name" class="form-input" placeholder="账户名称" />
          </div>
          <div class="form-group">
            <label class="form-label">图标</label>
            <input v-model="editForm.icon" class="form-input" placeholder="💳" maxlength="4" />
          </div>
          <div class="form-group">
            <label class="form-label">余额 (¥)</label>
            <input v-model.number="editForm.balanceYuan" class="form-input" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">排序</label>
            <input v-model.number="editForm.sort" class="form-input" type="number" placeholder="0" />
          </div>
        </div>
        <div class="modal-bottom-actions">
          <button class="btn-primary" :disabled="!editForm.name.trim()" @click="handleEdit">保存</button>
          <button class="btn-cancel" @click="editTarget = null">取消</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal-content">
        <p class="modal-desc">确认删除资产「{{ deleteTarget.name }}」？</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deleteTarget = null">取消</button>
          <button class="btn-danger" @click="handleDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { formatCurrency } from '@/utils/format'
import type { Account } from '@/types'

const accountStore = useAccountStore()

const expanded = ref(false)

// ── Drag & Drop Sort ──
const dragIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

function onDragStart(e: DragEvent, idx: number) {
  dragIdx.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }
}

function onDragOver(idx: number) { dragOverIdx.value = idx }
function onDragLeave() { dragOverIdx.value = null }
function onDragEnd() { dragIdx.value = null; dragOverIdx.value = null }

async function onDrop(_e: DragEvent, dropIdx: number) {
  const fromIdx = dragIdx.value
  if (fromIdx == null || fromIdx === dropIdx) return
  const list = [...accountStore.accounts]
  const [moved] = list.splice(fromIdx, 1)
  list.splice(dropIdx, 0, moved)
  for (let i = 0; i < list.length; i++) {
    const acc = list[i]
    if (acc.id != null && acc.sort !== i + 1) {
      await accountStore.updateAccount(acc.id, { sort: i + 1 })
    }
  }
  dragIdx.value = null
  dragOverIdx.value = null
}

// ── Add Account ──
const showAddAccount = ref(false)
const addForm = reactive({ name: '', icon: '🏦', initialBalance: 0, sort: 0 })

async function handleAdd() {
  if (!addForm.name.trim()) return
  await accountStore.addAccount({
    name: addForm.name.trim(),
    icon: addForm.icon || '🏦',
    balance: Math.round(parseFloat(String(addForm.initialBalance || '0')) * 100),
    sort: addForm.sort,
  })
  addForm.name = ''; addForm.icon = '🏦'; addForm.initialBalance = 0; addForm.sort = 0
  showAddAccount.value = false
}

// ── Edit Account ──
const editTarget = ref<Account | null>(null)
const editForm = reactive({ name: '', icon: '🏦', balanceYuan: 0, sort: 0 })

function openEditAccount(acc: Account) {
  editTarget.value = acc
  editForm.name = acc.name
  editForm.icon = acc.icon
  editForm.balanceYuan = Math.round(acc.balance) / 100
  editForm.sort = acc.sort
}

async function handleEdit() {
  if (!editTarget.value?.id || !editForm.name.trim()) return
  await accountStore.updateAccount(editTarget.value.id, {
    name: editForm.name.trim(),
    icon: editForm.icon || '🏦',
    balance: Math.round(parseFloat(String(editForm.balanceYuan || '0')) * 100),
    sort: editForm.sort,
  })
  editTarget.value = null
}

// ── Delete Account ──
const deleteTarget = ref<Account | null>(null)

function confirmDeleteAccount(acc: Account) { deleteTarget.value = acc }
async function handleDelete() {
  if (deleteTarget.value?.id) {
    await accountStore.deleteAccount(deleteTarget.value.id)
  }
  deleteTarget.value = null
}
</script>

<style scoped>
.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 15px;
  color: #1c1c1e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
  transition: background 0.1s;
}
.section-row:active { background: rgba(0,0,0,0.03); }

.row-left { display: flex; align-items: center; gap: 10px; }
.row-icon { font-size: 18px; line-height: 1; }
.row-label { font-size: 15px; color: #1c1c1e; }

.chevron { color: #c7c7cc; flex-shrink: 0; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

.expanded-content { padding: 4px 14px 12px; }
.empty-hint { text-align: center; padding: 12px; font-size: 14px; color: #8e8e93; }

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
  margin: 0 -4px;
  padding: 8px 4px;
}
.account-item.drag-over { background: rgba(0, 122, 255, 0.08); }
.drag-handle { font-size: 16px; color: #c7c7cc; cursor: grab; user-select: none; line-height: 1; padding: 2px; flex-shrink: 0; }
.account-icon { font-size: 16px; }
.account-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.account-name { font-size: 14px; color: #1c1c1e; }
.account-balance { font-size: 12px; color: #8e8e93; }

.icon-btn {
  width: 28px; height: 28px; border: none; background: #f2f2f6; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8e8e93;
}
.icon-btn--danger { color: #ff3b30; }

.add-btn {
  width: 100%; padding: 10px; border: 1px dashed #c7c7cc; border-radius: 8px;
  background: none; font-size: 14px; color: #007aff; cursor: pointer; margin-top: 8px;
}

/* Modal overlays */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
.modal-bottom { width: 100%; max-width: 480px; background: #fff; border-radius: 16px 16px 0 0; padding: 8px 24px 32px; max-height: 85vh; overflow-y: auto; }
.modal-handle { width: 36px; height: 4px; border-radius: 2px; background: #d1d1d6; margin: 0 auto 12px; }
.modal-title { font-size: 18px; font-weight: 600; text-align: center; margin-bottom: 20px; color: #1c1c1e; }
.modal-content { width: 280px; background: #fff; border-radius: 16px; padding: 24px; }
.modal-desc { font-size: 14px; color: #1c1c1e; text-align: center; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }
.modal-body { margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 14px; font-weight: 500; color: #8e8e93; margin-bottom: 6px; }
.form-input { width: 100%; height: 40px; border-radius: 10px; border: 1px solid rgba(60,60,67,0.12); background: #f2f2f6; padding: 0 12px; font-size: 15px; color: #1c1c1e; outline: none; box-sizing: border-box; }
.form-input:focus { border-color: #007aff; }
.modal-bottom-actions { display: flex; gap: 12px; }
.btn-primary { flex: 1; height: 44px; border-radius: 10px; border: none; background: #007aff; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary:active { opacity: 0.7; }
.btn-cancel { flex: 1; height: 44px; border-radius: 10px; border: none; background: #f2f2f6; color: #1c1c1e; font-size: 16px; font-weight: 500; cursor: pointer; }
.btn-danger { height: 44px; padding: 0 24px; border-radius: 10px; border: none; background: #ff3b30; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; }
</style>