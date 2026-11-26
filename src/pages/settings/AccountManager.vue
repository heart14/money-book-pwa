<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon"><TwemojiIcon emoji="🏦" /></span><span class="row-label">管理账户</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink3)" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
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
        <span class="drag-handle"><span class="drag-handle-icon">⠿</span></span>
        <span class="account-icon"><TwemojiIcon :emoji="acc.icon" /></span>
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
    <CommonBottomSheet
      :visible="showAddAccount"
      title="新增账户"
      @close="showAddAccount = false"
    >
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
      <template #actions>
        <button class="btn-cancel" @click="showAddAccount = false">取消</button>
        <button class="btn-primary" :disabled="!addForm.name.trim()" @click="handleAdd">确认</button>
      </template>
    </CommonBottomSheet>

    <!-- Edit Account Modal -->
    <CommonBottomSheet
      :visible="editTarget != null"
      title="编辑账户"
      @close="editTarget = null"
    >
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
      <template #actions>
        <button class="btn-cancel" @click="editTarget = null">取消</button>
        <button class="btn-primary" :disabled="!editForm.name.trim()" @click="handleEdit">保存</button>
      </template>
    </CommonBottomSheet>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-content">
          <p class="modal-desc">确认删除资产「{{ deleteTarget.name }}」？</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="deleteTarget = null">取消</button>
            <button class="btn-danger" @click="handleDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { formatCurrency } from '@/utils/format'
import type { Account } from '@/types'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'
import TwemojiIcon from '@/components/common/TwemojiIcon.vue'

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
/* ═ 沉浸式：标题行 + 连续展开内容 ═ */

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: var(--fs-title);
  color: var(--ink);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
}
.section-row:active { background: none; }

.row-left { display: flex; align-items: center; gap: 11px; }
.row-icon { font-size: 17px; line-height: 1; }
.row-label { font-size: 15px; font-weight: 600; color: var(--ink); }

.chevron { color: var(--ink3); flex-shrink: 0; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

.expanded-content { padding: 6px 0 10px; border-top: 1px solid var(--line-soft); }
.empty-hint { text-align: center; padding: 16px; font-size: var(--fs-body); color: var(--ink3); }

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
  padding: 10px 0;
}
.account-item + .account-item { border-top: 1px solid var(--line-soft); }
.account-item.drag-over { background: var(--act-bg); }
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  flex-shrink: 0;
  padding: 0 4px;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}
.drag-handle-icon {
  font-size: 16px;
  color: var(--ink3);
  user-select: none;
  line-height: 1;
  padding: 12px 8px;
  border-radius: 8px;
}
.drag-handle-icon:active { background: var(--act-bg); }
.account-icon { font-size: 17px; }
.account-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.account-name { font-size: var(--fs-body); font-weight: 500; color: var(--ink); }
.account-balance { font-size: var(--fs-small); color: var(--ink3); font-variant-numeric: tabular-nums; }

.icon-btn {
  width: 30px; height: 30px; border: none; background: var(--act-bg); border-radius: 9px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink2);
}
.icon-btn:active { background: var(--line); }
.icon-btn--danger { color: var(--exp); }

.add-btn {
  width: 100%; padding: 10px; border: 1px dashed var(--line); border-radius: 10px;
  background: none; font-size: var(--fs-body); font-weight: 600; color: var(--ink); cursor: pointer; margin-top: 10px;
}
.add-btn:active { background: var(--act-bg); }

/* Delete confirm overlay */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 280px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-big); padding: 24px; box-shadow: var(--shadow-lg); }
.modal-desc { font-size: var(--fs-body); color: var(--ink); text-align: center; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: var(--fs-body); font-weight: 500; color: var(--ink2); margin-bottom: 6px; }
.form-input { width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); padding: 0 12px; font-size: var(--fs-title); color: var(--ink); outline: none; box-sizing: border-box; }
.form-input:focus { border-color: var(--ink); }
.btn-cancel { flex: 1; height: 44px; border-radius: var(--radius-sm); border: none; background: var(--act-bg); color: var(--ink); font-size: var(--fs-amount); font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-primary { flex: 1; height: 44px; border-radius: var(--radius-sm); border: none; background: var(--ink); color: var(--accent-fg); font-size: var(--fs-amount); font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary:active { opacity: 0.7; }
.btn-danger { height: 44px; padding: 0 24px; border-radius: var(--radius-sm); border: none; background: var(--exp); color: var(--accent-fg); font-size: var(--fs-amount); font-weight: 500; cursor: pointer; font-family: inherit; }
</style>