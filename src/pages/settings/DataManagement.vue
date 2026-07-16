<template>
  <div class="data-management">
    <div class="page-header">
      <button class="back-btn" @click="$emit('back')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>设置</span>
      </button>
      <h3 class="page-title">数据管理</h3>
    </div>

    <div class="section-card">
      <button class="action-row" @click="handleExport">
        <span>导出备份</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c7c7cc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div class="separator"></div>
      <button class="action-row" @click="triggerImport">
        <span>导入数据</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c7c7cc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".json"
        style="display:none"
        @change="onFileSelected"
      />
      <div class="separator"></div>
      <button class="action-row action-row--danger" @click="showDestroyConfirm1 = true">
        <span>彻底销毁数据</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c7c7cc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>

    <div v-if="successMsg" class="section-card success-card">
      <p class="success-text">{{ successMsg }}</p>
    </div>

    <div v-if="errorMsg" class="section-card error-card">
      <p class="error-text">{{ errorMsg }}</p>
    </div>

    <!-- Import confirm modal -->
    <div v-if="showImportConfirm" class="modal-overlay" @click.self="showImportConfirm = false">
      <div class="modal-content">
        <p class="modal-title">确认导入数据</p>
        <p class="modal-desc">此操作将覆盖所有现有数据，确定继续？</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelImport">取消</button>
          <button class="btn-danger" @click="confirmImport">确认导入</button>
        </div>
      </div>
    </div>

    <!-- Destroy: first confirmation -->
    <div v-if="showDestroyConfirm1" class="modal-overlay" @click.self="showDestroyConfirm1 = false">
      <div class="modal-content">
        <p class="modal-title">确认销毁数据</p>
        <p class="modal-desc">此操作将清除所有数据，且无法恢复。确定继续？</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDestroyConfirm1 = false">取消</button>
          <button class="btn-danger" @click="showDestroyConfirm2 = true; showDestroyConfirm1 = false">确定</button>
        </div>
      </div>
    </div>

    <!-- Destroy: second confirmation -->
    <div v-if="showDestroyConfirm2" class="modal-overlay" @click.self="showDestroyConfirm2 = false">
      <div class="modal-content">
        <p class="modal-title">再次确认</p>
        <p class="modal-desc">请再次确认——此操作无法撤销。</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDestroyConfirm2 = false">取消</button>
          <button class="btn-danger" @click="handleDestroy">确认销毁</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { exportData, importData, destroyAllData } from '@/utils/export'

const props = withDefaults(defineProps<{
  initialAction?: 'export' | 'import' | 'destroy'
}>(), {
  initialAction: 'export',
})

const emit = defineEmits<{
  (e: 'back'): void
}>()

// ── State ──
const fileInputRef = ref<HTMLInputElement | null>(null)
const showImportConfirm = ref(false)
const showDestroyConfirm1 = ref(false)
const showDestroyConfirm2 = ref(false)
const pendingImportFile = ref<File | null>(null)
const successMsg = ref('')
const errorMsg = ref('')

// Auto-trigger action based on initialAction prop
onMounted(() => {
  if (props.initialAction === 'export') {
    // auto-trigger export after mount
    setTimeout(() => handleExport(), 300)
  } else if (props.initialAction === 'import') {
    setTimeout(() => triggerImport(), 300)
  } else if (props.initialAction === 'destroy') {
    setTimeout(() => { showDestroyConfirm1.value = true }, 300)
  }
})

// ── Export ──
async function handleExport() {
  try {
    await exportData()
    successMsg.value = '数据已导出'
    errorMsg.value = ''
  } catch (e) {
    errorMsg.value = '导出失败：' + (e instanceof Error ? e.message : '未知错误')
    successMsg.value = ''
  }
}

// ── Import ──
function triggerImport() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  pendingImportFile.value = file
  showImportConfirm.value = true
  target.value = '' // reset so same file can be re-selected
}

function cancelImport() {
  showImportConfirm.value = false
  pendingImportFile.value = null
}

async function confirmImport() {
  if (!pendingImportFile.value) return
  showImportConfirm.value = false
  try {
    await importData(pendingImportFile.value)
    successMsg.value = '数据已导入'
    errorMsg.value = ''
  } catch (e) {
    errorMsg.value = '导入失败：' + (e instanceof Error ? e.message : '请检查文件格式是否正确')
    successMsg.value = ''
  }
  pendingImportFile.value = null
}

// ── Destroy ──
async function handleDestroy() {
  showDestroyConfirm2.value = false
  try {
    await destroyAllData()
    successMsg.value = '数据已销毁，建议刷新页面'
    errorMsg.value = ''
  } catch (e) {
    errorMsg.value = '销毁失败：' + (e instanceof Error ? e.message : '未知错误')
    successMsg.value = ''
  }
}
</script>

<style scoped>
.data-management {
  padding: 16px;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: none;
  font-size: 16px;
  color: var(--color-primary);
  cursor: pointer;
  padding: 4px 0;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

/* ── Section Card ── */
.section-card {
  background: #fff;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

/* ── Action Row ── */
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: none;
  font-size: 16px;
  color: var(--color-text);
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.action-row:active {
  opacity: 0.5;
}

.action-row--danger {
  color: var(--color-destructive);
}

.separator {
  height: 1px;
  background: var(--color-separator);
  margin: 0 16px;
}

/* ── Success / Error ── */
.success-card {
  background: #e8f5e9;
  padding: 16px;
}

.error-card {
  background: #fbe9e7;
  padding: 16px;
}

.success-text {
  text-align: center;
  font-size: 15px;
  color: #2e7d32;
}

.error-text {
  text-align: center;
  font-size: 15px;
  color: #c62828;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  width: 290px;
  background: #fff;
  border-radius: var(--radius-xl);
  padding: 24px 20px 20px;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
  color: var(--color-text);
}

.modal-desc {
  font-size: 14px;
  color: var(--color-secondary-text);
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-danger {
  flex: 1;
  height: 44px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.btn-cancel {
  background: #f2f2f6;
  color: var(--color-text);
}

.btn-danger {
  background: var(--color-destructive);
  color: #fff;
}

.btn-cancel:active,
.btn-danger:active {
  opacity: 0.7;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>