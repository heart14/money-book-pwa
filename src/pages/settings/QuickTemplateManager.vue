<template>
  <div class="qt-manager">
    <template v-if="store.templates.length === 0">
      <div class="qt-empty">
        <p class="qt-empty-text">暂无快记模板</p>
        <p class="qt-empty-hint">在交易详情中提取或在此添加</p>
      </div>
    </template>

    <div v-else class="qt-list">
      <div
        v-for="tpl in store.templates"
        :key="tpl.id"
        class="qt-row"
      >
        <button class="qt-move-btn" @click="moveUp(tpl)" :disabled="isFirst(tpl)">
          <span class="qt-move-arrow">↑</span>
        </button>
        <button class="qt-move-btn" @click="moveDown(tpl)" :disabled="isLast(tpl)">
          <span class="qt-move-arrow">↓</span>
        </button>
        <div class="qt-row-content" @click="startEdit(tpl)">
          <span class="qt-row-icon">{{ getCategoryIcon(tpl) }}</span>
          <span class="qt-row-name">{{ tpl.name }}</span>
          <span class="qt-row-amount">{{ formatShortCurrency(tpl.amount) }}</span>
        </div>
        <button class="qt-edit-btn" @click="startEdit(tpl)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8e8e93" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </div>

    <button class="qt-add-btn" @click="startAdd">
      <span class="qt-add-icon">+</span>
      <span>添加新模板</span>
    </button>

    <!-- Edit / Add Dialog (CommonBottomSheet style) -->
    <Teleport to="body">
      <div v-if="dialogVisible" class="qt-dialog-overlay" @click.self="cancelDialog">
        <div class="qt-dialog">
          <h3 class="qt-dialog-title">{{ isEditing ? '编辑模板' : '新建模板' }}</h3>

          <label class="qt-field-label">名称</label>
          <input v-model="editForm.name" class="qt-input" placeholder="必填" maxlength="30" />

          <label class="qt-field-label">类型</label>
          <div class="qt-mode-group">
            <button v-for="opt in modeOptions" :key="opt.value"
              class="qt-mode-btn" :class="{ active: editForm.type === opt.value }"
              @click="editForm.type = opt.value"
            >{{ opt.label }}</button>
          </div>

          <label class="qt-field-label">金额（元）</label>
          <input v-model.number="editForm.amountYuan" type="number" min="0" step="0.01" class="qt-input" placeholder="0.00" />

          <label class="qt-field-label">分类</label>
          <select v-model="editForm.categoryId" class="qt-select">
            <option :value="0" disabled>请选择</option>
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>

          <label class="qt-field-label">标题（可选）</label>
          <input v-model="editForm.title" class="qt-input" placeholder="" maxlength="100" />

          <label class="qt-field-label">标签（逗号分隔，可选）</label>
          <input v-model="editForm.tagsText" class="qt-input" placeholder="如: 日常,消费" />

          <label class="qt-field-label">备注（可选）</label>
          <input v-model="editForm.note" class="qt-input" placeholder="" maxlength="200" />

          <div class="qt-dialog-actions">
            <button v-if="isEditing" class="qt-btn qt-btn--danger" @click="confirmDelete">删除</button>
            <button class="qt-btn qt-btn--cancel" @click="cancelDialog">取消</button>
            <button class="qt-btn qt-btn--confirm" :disabled="!dialogValid" @click="confirmDialog">保存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm -->
    <ConfirmDialog
      :visible="deleteConfirmVisible"
      title="确认删除"
      message="删除后无法恢复，确定继续？"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="doDelete"
      @update:visible="deleteConfirmVisible = $event"
    />

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toastMsg" class="qt-toast">{{ toastMsg }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { formatShortCurrency } from '@/utils/format'
import type { QuickTemplate } from '@/types'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const store = useQuickTemplateStore()
const categoryStore = useCategoryStore()

const modeOptions = [
  { label: '收入', value: 'income' as const },
  { label: '支出', value: 'expense' as const },
  { label: '转账', value: 'transfer' as const },
]

// ── Dialog state ──
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const dialogValid = computed(() => {
  return editForm.name.trim().length > 0
    && editForm.amountYuan > 0
    && editForm.categoryId > 0
})

const editForm = reactive({
  name: '',
  type: 'expense' as 'expense' | 'income' | 'transfer',
  amountYuan: 0,
  categoryId: 0,
  title: '',
  tagsText: '',
  note: '',
})

const availableCategories = computed(() => {
  return categoryStore.categories.filter(c => c.parentId !== null && c.type === editForm.type)
})

// ── Sort ──
function isFirst(tpl: QuickTemplate) {
  const list = store.templates
  return list.length > 0 && list[0].id === tpl.id
}

function isLast(tpl: QuickTemplate) {
  const list = store.templates
  return list.length > 0 && list[list.length - 1].id === tpl.id
}

async function moveUp(tpl: QuickTemplate) {
  const list = store.templates
  const idx = list.findIndex(t => t.id === tpl.id)
  if (idx <= 0) return
  // Swap sort values
  const prev = list[idx - 1]
  await store.update(tpl.id!, { sort: prev.sort })
  await store.update(prev.id!, { sort: tpl.sort })
}

async function moveDown(tpl: QuickTemplate) {
  const list = store.templates
  const idx = list.findIndex(t => t.id === tpl.id)
  if (idx < 0 || idx >= list.length - 1) return
  const next = list[idx + 1]
  await store.update(tpl.id!, { sort: next.sort })
  await store.update(next.id!, { sort: tpl.sort })
}

// ── Icon helper ──
function getCategoryIcon(tpl: QuickTemplate): string {
  const cat = categoryStore.categories.find(c => c.id === tpl.categoryId)
  return cat?.icon || '📋'
}

// ── Dialog ──
function startAdd() {
  isEditing.value = false
  editingId.value = null
  editForm.name = ''
  editForm.type = 'expense'
  editForm.amountYuan = 0
  editForm.categoryId = 0
  editForm.title = ''
  editForm.tagsText = ''
  editForm.note = ''
  dialogVisible.value = true
}

function startEdit(tpl: QuickTemplate) {
  isEditing.value = true
  editingId.value = tpl.id!
  editForm.name = tpl.name
  editForm.type = tpl.type
  editForm.amountYuan = tpl.amount / 100
  editForm.categoryId = tpl.categoryId
  editForm.title = tpl.title
  editForm.tagsText = tpl.tags.join(', ')
  editForm.note = tpl.note
  dialogVisible.value = true
}

function cancelDialog() {
  dialogVisible.value = false
}

async function confirmDialog() {
  if (!dialogValid.value) return

  const name = editForm.name.trim()
  const type = editForm.type
  const amount = Math.round(editForm.amountYuan * 100)
  const categoryId = editForm.categoryId
  const title = editForm.title
  const tags = editForm.tagsText.split(',').map(s => s.trim()).filter(Boolean)
  const note = editForm.note

  if (isEditing.value && editingId.value) {
    await store.update(editingId.value, { name, type, amount, categoryId, title, tags, note })
    showToast('已更新')
  } else {
    const result = await store.add({ name, type, amount, categoryId, title, tags, note, sort: 0 })
    if (result.success) {
      showToast('已添加')
    } else if (result.duplicateMsg) {
      showToast(result.duplicateMsg)
    }
  }
  dialogVisible.value = false
}

// ── Delete ──
const deleteConfirmVisible = ref(false)
const deleteTargetId = ref<number | null>(null)

function confirmDelete() {
  deleteTargetId.value = editingId.value
  deleteConfirmVisible.value = true
  dialogVisible.value = false
}

async function doDelete() {
  if (deleteTargetId.value) {
    await store.remove(deleteTargetId.value)
    showToast('已删除')
  }
  deleteConfirmVisible.value = false
  deleteTargetId.value = null
}

// ── Toast ──
const toastMsg = ref('')
let toastTimer = 0

function showToast(msg: string) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMsg.value = '' }, 2000)
}
</script>

<style scoped>
.qt-empty {
  padding: 12px 0;
  text-align: center;
}

.qt-empty-text {
  font-size: 14px;
  color: var(--color-text, #1c1c1e);
  margin-bottom: 4px;
}

.qt-empty-hint {
  font-size: 12px;
  color: var(--color-secondary-text, #8e8e93);
}

.qt-list {
  /* container */
}

.qt-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-separator, rgba(60,60,67,0.08));
}

.qt-row:last-child {
  border-bottom: none;
}

.qt-move-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c7c7cc;
  -webkit-tap-highlight-color: transparent;
  padding: 0;
}

.qt-move-btn:disabled {
  opacity: 0.3;
}

.qt-move-arrow {
  font-size: 14px;
  line-height: 1;
}

.qt-row-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  min-width: 0;
}

.qt-row-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.qt-row-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #1c1c1e);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qt-row-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-secondary-text, #8e8e93);
  margin-left: auto;
  margin-right: 4px;
  flex-shrink: 0;
}

.qt-edit-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}

.qt-edit-btn:active {
  background: #f2f2f6;
}

.qt-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px 0;
  border: 1px dashed var(--color-separator, rgba(60,60,67,0.16));
  border-radius: var(--radius-sm, 8px);
  background: transparent;
  font-size: 14px;
  color: var(--color-secondary-text, #8e8e93);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  margin-top: 8px;
}

.qt-add-btn:active {
  background: #f2f2f6;
}

.qt-add-icon {
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
}

/* ── Dialog ── */
.qt-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.qt-dialog {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-card, rgba(255,255,255,0.95));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  padding: 24px 20px 32px;
}

.qt-dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text, #1c1c1e);
  text-align: center;
  margin-bottom: 20px;
}

.qt-field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-secondary-text, #8e8e93);
  margin-bottom: 6px;
  margin-top: 14px;
}

.qt-field-label:first-child {
  margin-top: 0;
}

.qt-input, .qt-select {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-sm, 8px);
  background: #f2f2f6;
  font-size: 15px;
  color: var(--color-text, #1c1c1e);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

.qt-input:focus, .qt-select:focus {
  background: #fff;
  box-shadow: 0 0 0 1px var(--color-primary, #007aff);
}

.qt-mode-group {
  display: flex;
  gap: 8px;
}

.qt-mode-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: var(--radius-sm, 8px);
  background: #f2f2f6;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-secondary-text, #8e8e93);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.qt-mode-btn.active {
  background: var(--color-primary, #007aff);
  color: #fff;
}

.qt-dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.qt-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: var(--radius-sm, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.qt-btn:active { opacity: 0.7; }
.qt-btn:disabled { opacity: 0.4; }

.qt-btn--cancel {
  background: #f2f2f6;
  color: var(--color-text, #1c1c1e);
  flex: 0.5;
}

.qt-btn--confirm {
  background: var(--color-primary, #007aff);
  color: #fff;
  flex: 0.5;
}

.qt-btn--danger {
  background: #ff3b30;
  color: #fff;
  flex: 0.5;
}

/* ── Toast ── */
.qt-toast {
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