<template>
  <div class="page settings-page">
    <!-- ── Main Settings View ── -->
    <template v-if="currentView === 'main'">
      <!-- Header -->
      <div class="page-header">
        <span class="page-title">设置</span>
      </div>

      <!-- ── 1. Security ── -->
      <div class="section">
        <div class="section-header">安全</div>
        <div class="section-card">
          <button class="section-row" @click="currentView = 'security'">
            <div class="row-left">
              <span class="row-icon">🔒</span>
              <span class="row-label">PIN 码锁</span>
            </div>
            <div class="row-right">
              <span class="row-status">{{ hasPin ? '已开启' : '已关闭' }}</span>
              <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </button>
        </div>
      </div>

      <!-- ── 2. Data Management ── -->
      <div class="section">
        <div class="section-header">数据管理</div>
        <div class="section-card">
          <button class="section-row" @click="handleExport">
            <div class="row-left"><span class="row-icon">📤</span><span class="row-label">导出备份</span></div>
            <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <div class="separator"></div>
          <button class="section-row" @click="triggerImport">
            <div class="row-left"><span class="row-icon">📥</span><span class="row-label">导入数据</span></div>
            <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <input ref="fileInputRef" type="file" accept=".json" style="display:none" @change="onFileSelected" />
          <div class="separator"></div>
          <button class="section-row" @click="showDestroyConfirm1 = true">
            <div class="row-left"><span class="row-icon">🗑️</span><span class="row-label row-label--danger">彻底销毁数据</span></div>
            <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      <!-- ── 3. Account Management ── -->
      <div class="section">
        <div class="section-header">账户管理</div>
        <div class="section-card">
          <AccountManager />
        </div>
      </div>

      <!-- ── 4. Categories & Tags ── -->
      <div class="section">
        <div class="section-header">分类与标签</div>
        <div class="section-card">
          <CategoryManager />
          <div class="separator"></div>
          <TagManager />
        </div>
      </div>

      <!-- ── 5. Recurring Rules ── -->
      <div class="section">
        <div class="section-header">周期记账</div>
        <div class="section-card">
          <RuleManager />
        </div>
      </div>

      <!-- ── 6. About ── -->
      <div class="section">
        <div class="section-header">关于</div>
        <div class="section-card">
          <div class="section-row no-hover">
            <div class="row-left"><span class="row-icon">ℹ️</span><span class="row-label">关于钱书</span></div>
            <span class="row-value">v1.0.0</span>
          </div>
        </div>
      </div>

      <!-- ── Data Management Modals ── -->
      <!-- Import confirm -->
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

      <!-- Toasts -->
      <div v-if="dataSuccessMsg" class="data-msg success" @click="dataSuccessMsg = ''">{{ dataSuccessMsg }}</div>
      <div v-if="dataErrorMsg" class="data-msg error" @click="dataErrorMsg = ''">{{ dataErrorMsg }}</div>
    </template>

    <SecurityLock v-else-if="currentView === 'security'" @back="currentView = 'main'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getStoredPINHash } from '@/utils/crypto'
import { exportData, importData, destroyAllData } from '@/utils/export'
import SecurityLock from './SecurityLock.vue'
import AccountManager from './AccountManager.vue'
import CategoryManager from './CategoryManager.vue'
import TagManager from './TagManager.vue'
import RuleManager from './RuleManager.vue'

const currentView = ref<'main' | 'security'>('main')
const hasPin = computed(() => !!getStoredPINHash())

// ── Data Management ──
const fileInputRef = ref<HTMLInputElement | null>(null)
const showImportConfirm = ref(false)
const showDestroyConfirm1 = ref(false)
const showDestroyConfirm2 = ref(false)
const pendingImportFile = ref<File | null>(null)
const dataSuccessMsg = ref('')
const dataErrorMsg = ref('')

async function handleExport() {
  try {
    await exportData()
    dataSuccessMsg.value = '数据已导出'
    dataErrorMsg.value = ''
  } catch (e) {
    dataErrorMsg.value = '导出失败：' + (e instanceof Error ? e.message : '未知错误')
    dataSuccessMsg.value = ''
  }
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  pendingImportFile.value = file
  showImportConfirm.value = true
  target.value = ''
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
    dataSuccessMsg.value = '数据已导入'
    dataErrorMsg.value = ''
  } catch (e) {
    dataErrorMsg.value = '导入失败：' + (e instanceof Error ? e.message : '请检查文件格式是否正确')
    dataSuccessMsg.value = ''
  }
  pendingImportFile.value = null
}

async function handleDestroy() {
  showDestroyConfirm2.value = false
  try {
    await destroyAllData()
    dataSuccessMsg.value = '数据已销毁，建议刷新页面'
    dataErrorMsg.value = ''
  } catch (e) {
    dataErrorMsg.value = '销毁失败：' + (e instanceof Error ? e.message : '未知错误')
    dataSuccessMsg.value = ''
  }
}
</script>

<style scoped>
.settings-page {
  padding: 16px;
  background: var(--color-bg);
  min-height: 100%;
  padding-bottom: 80px;
}

.page-header { display: flex; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 17px; font-weight: 700; color: #1c1c1e; }

.section { margin-bottom: 20px; }

.section-header {
  font-size: 12px;
  font-weight: 600;
  color: #8e8e93;
  padding: 0 4px;
  margin-bottom: 6px;
}

.section-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  overflow: hidden;
}

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
.section-row.no-hover { cursor: default; }
.section-row.no-hover:active { background: none; }

.row-left { display: flex; align-items: center; gap: 10px; }
.row-icon { font-size: 18px; line-height: 1; }
.row-label { font-size: 15px; color: #1c1c1e; }
.row-label--danger { color: #ff3b30; }
.row-right { display: flex; align-items: center; gap: 6px; }
.row-status { font-size: 13px; color: #8e8e93; }
.row-value { font-size: 13px; color: #8e8e93; }

.chevron { color: #c7c7cc; flex-shrink: 0; transition: transform 0.2s; }

.separator { height: 1px; background: rgba(60,60,67,0.08); margin: 0 14px; }

/* Modal overlays */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 280px; background: #fff; border-radius: 16px; padding: 24px; }
.modal-title { font-size: 18px; font-weight: 600; text-align: center; margin-bottom: 20px; color: #1c1c1e; }
.modal-desc { font-size: 14px; color: #1c1c1e; text-align: center; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }
.btn-cancel { flex: 1; height: 44px; border-radius: 10px; border: none; background: #f2f2f6; color: #1c1c1e; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-danger { height: 44px; padding: 0 24px; border-radius: 10px; border: none; background: #ff3b30; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }

/* Toast messages */
.data-msg {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  z-index: 1100;
  cursor: pointer;
  animation: dataMsgIn 0.25s ease;
  max-width: 80%;
  text-align: center;
}
.data-msg.success { background: #34c759; color: #fff; }
.data-msg.error { background: #ff3b30; color: #fff; }

@keyframes dataMsgIn {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>