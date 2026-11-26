<template>
  <div class="page settings-page">
    <!-- ── Main Settings View ── -->
    <template v-if="currentView === 'main'">
      <!-- 沉浸式标题 -->
      <header class="se-title">设置</header>

      <!-- ── 1. 安全 ── -->
      <section class="se-group glass">
        <span class="se-group-label">安全</span>
        <div class="se-rows">
          <button class="se-row" @click="currentView = 'security'">
            <span class="se-row-l"><i class="se-row-ic"><TwemojiIcon emoji="🔒" /></i>PIN 码锁</span>
            <span class="se-row-v">{{ hasPin ? '已开启' : '已关闭' }}
              <svg class="se-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
        </div>
      </section>

      <!-- ── 2. 外观 ── -->
      <section class="se-group glass">
        <span class="se-group-label">外观</span>
        <div class="se-rows">
          <button class="se-row" @click="showAppearance = !showAppearance">
            <span class="se-row-l"><i class="se-row-ic"><TwemojiIcon emoji="🎨" /></i>显示与主题</span>
            <svg class="se-caret" :class="{ rotated: showAppearance }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div v-if="showAppearance" class="se-expand">
            <div class="se-setting">
              <span class="se-setting-label">深色模式</span>
              <div class="se-toggle">
                <button class="se-toggle-btn" :class="{ on: uiStore.theme === 'system' }" @click="uiStore.setTheme('system')">自动</button>
                <button class="se-toggle-btn" :class="{ on: uiStore.theme === 'light' }" @click="uiStore.setTheme('light')">浅色</button>
                <button class="se-toggle-btn" :class="{ on: uiStore.theme === 'dark' }" @click="uiStore.setTheme('dark')">深色</button>
              </div>
            </div>
            <div class="se-setting">
              <span class="se-setting-label">文字大小</span>
              <div class="se-toggle">
                <button v-for="opt in fontSizeOptions" :key="opt.value" class="se-toggle-btn" :class="{ on: uiStore.fontSize === opt.value }" @click="uiStore.setFontSize(opt.value)">{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 3. 数据管理 ── -->
      <section class="se-group glass">
        <span class="se-group-label">数据管理</span>
        <div class="se-rows">
          <button class="se-row" @click="handleExport">
            <span class="se-row-l"><i class="se-row-ic"><TwemojiIcon emoji="📤" /></i>导出备份</span>
            <svg class="se-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <button class="se-row" @click="triggerImport">
            <span class="se-row-l"><i class="se-row-ic"><TwemojiIcon emoji="📥" /></i>导入数据</span>
            <svg class="se-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <input ref="fileInputRef" type="file" accept=".json" style="display:none" @change="onFileSelected" />
          <button class="se-row" @click="showDestroyConfirm1 = true">
            <span class="se-row-l danger"><i class="se-row-ic"><TwemojiIcon emoji="🗑️" /></i>彻底销毁数据</span>
            <svg class="se-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </section>

      <!-- ── 4. 账户管理 ── -->
      <section class="se-group glass">
        <span class="se-group-label">账户管理</span>
        <div class="se-rows">
          <AccountManager />
        </div>
      </section>

      <!-- ── 5. 分类与标签 ── -->
      <section class="se-group glass">
        <span class="se-group-label">分类与标签</span>
        <div class="se-rows">
          <CategoryManager />
          <TagManager />
        </div>
      </section>

      <!-- ── 6. 模板管理 ── -->
      <section class="se-group glass">
        <span class="se-group-label">模板管理</span>
        <div class="se-rows">
          <RuleManager />
          <QuickTemplateManager />
        </div>
      </section>

      <!-- ── 7. 关于 ── -->
      <section class="se-group glass">
        <span class="se-group-label">关于</span>
        <div class="se-rows">
          <div class="se-row no-hover">
            <span class="se-row-l"><i class="se-row-ic"><TwemojiIcon emoji="ℹ️" /></i>关于钱书</span>
            <span class="se-row-v">v1.0.0</span>
          </div>
        </div>
      </section>

      <!-- ── Data Management Dialogs ── -->
      <ConfirmDialog
        :visible="showImportConfirm"
        title="确认导入数据"
        message="此操作将覆盖所有现有数据，确定继续？"
        confirm-text="确认导入"
        confirm-type="danger"
        @confirm="confirmImport"
        @update:visible="showImportConfirm = $event"
      />

      <ConfirmDialog
        :visible="showDestroyConfirm1"
        title="确认销毁数据"
        message="此操作将清除所有数据，且无法恢复。确定继续？"
        confirm-text="确定"
        confirm-type="danger"
        @confirm="showDestroyConfirm2 = true; showDestroyConfirm1 = false"
        @update:visible="showDestroyConfirm1 = $event"
      />

      <ConfirmDialog
        :visible="showDestroyConfirm2"
        title="再次确认"
        message="请再次确认——此操作无法撤销。"
        confirm-text="确认销毁"
        confirm-type="danger"
        @confirm="handleDestroy"
        @update:visible="showDestroyConfirm2 = $event"
      />

      <!-- Toasts -->
      <div v-if="dataSuccessMsg" class="data-msg success" @click="dataSuccessMsg = ''">{{ dataSuccessMsg }}</div>
      <div v-if="dataErrorMsg" class="data-msg error" @click="dataErrorMsg = ''">{{ dataErrorMsg }}</div>
    </template>

    <SecurityLock v-else-if="currentView === 'security'" @back="onSecurityBack" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import { getStoredPINHash } from '@/utils/crypto'
import { exportData, importData, destroyAllData } from '@/utils/export'
import SecurityLock from './SecurityLock.vue'
import AccountManager from './AccountManager.vue'
import CategoryManager from './CategoryManager.vue'
import TagManager from './TagManager.vue'
import RuleManager from './RuleManager.vue'
import QuickTemplateManager from './QuickTemplateManager.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TwemojiIcon from '@/components/common/TwemojiIcon.vue'

const uiStore = useUiStore()
const showAppearance = ref(false)
const fontSizeOptions = [
  { label: '很小', value: 'xs' as const },
  { label: '小', value: 'sm' as const },
  { label: '中', value: 'md' as const },
  { label: '大', value: 'lg' as const },
  { label: '特大', value: 'xl' as const },
]
const currentView = ref<'main' | 'security'>('main')
const hasPin = ref(!!getStoredPINHash())

function onSecurityBack() {
  hasPin.value = !!getStoredPINHash()
  currentView.value = 'main'
}

// ── Data Management ──
const fileInputRef = ref<HTMLInputElement | null>(null)
const showImportConfirm = ref(false)
const showDestroyConfirm1 = ref(false)
const showDestroyConfirm2 = ref(false)
const pendingImportFile = ref<File | null>(null)
const dataSuccessMsg = ref('')
const dataErrorMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(success: string, error: string) {
  dataSuccessMsg.value = success
  dataErrorMsg.value = error
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    dataSuccessMsg.value = ''
    dataErrorMsg.value = ''
  }, 3000)
}

async function handleExport() {
  try {
    await exportData()
    showToast('数据已导出', '')
  } catch (e) {
    showToast('', '导出失败：' + (e instanceof Error ? e.message : '未知错误'))
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

async function confirmImport() {
  if (!pendingImportFile.value) return
  showImportConfirm.value = false
  try {
    await importData(pendingImportFile.value)
    showToast('数据已导入', '')
  } catch (e) {
    showToast('', '导入失败：' + (e instanceof Error ? e.message : '请检查文件格式是否正确'))
  }
  pendingImportFile.value = null
}

async function handleDestroy() {
  showDestroyConfirm2.value = false
  try {
    await destroyAllData()
    showToast('数据已销毁，建议刷新页面', '')
  } catch (e) {
    showToast('', '销毁失败：' + (e instanceof Error ? e.message : '未知错误'))
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100%;
  min-height: 100svh;
  padding: 0 16px 16px;
  background: transparent;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

/* ── 沉浸式标题 ── */
.se-title { font-size: var(--fs-page-title); font-weight: 800; letter-spacing: -0.03em; color: var(--ink); padding: 20px 2px 6px; margin-bottom: 10px; }

/* ── 抽屉式分组 ── */
.se-group { margin-bottom: 30px; padding: 8px 16px 12px; border-radius: var(--radius-big); }
.se-group-label { display: block; font-size: var(--fs-small); font-weight: 600; color: var(--ink3); letter-spacing: 0.3px; margin: 0 2px 4px; }

.se-rows { }

.se-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 0;
  border: none;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.se-row + .se-row { border-top: 1px solid var(--line-soft); }
.se-row:active { background: none; }
.se-row.no-hover { cursor: default; }
.se-row.no-hover:active { background: none; }

.se-row-l { display: inline-flex; align-items: center; gap: 11px; font-size: var(--fs-title); color: var(--ink); font-weight: 600; }
.se-row-l.danger { color: var(--exp); }
.se-row-ic { font-style: normal; font-size: var(--fs-heading); line-height: 1; display: inline-flex; }
.se-row-v { display: inline-flex; align-items: center; gap: 2px; font-size: var(--fs-body); color: var(--ink2); }
.se-caret { color: var(--ink3); flex-shrink: 0; transition: transform 0.2s; }
.se-caret.rotated { transform: rotate(180deg); }

/* 展开区 */
.se-expand { padding: 4px 0 8px; border-top: 1px solid var(--line-soft); }
.se-expand .se-setting + .se-setting { border-top: 1px solid var(--line-soft); }
.se-setting { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
.se-setting-label { font-size: var(--fs-body); color: var(--ink); font-weight: 500; }
.se-toggle { display: flex; background: var(--act-bg); border-radius: 8px; padding: 2px; gap: 2px; }
.se-toggle-btn { padding: 4px 11px; border: none; background: transparent; font-size: var(--fs-small); font-weight: 500; color: var(--ink3); border-radius: 7px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.se-toggle-btn.on { background: var(--ink); color: var(--accent-fg); font-weight: 600; }

/* Toast messages */
.data-msg {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: var(--fs-title);
  font-weight: 500;
  z-index: 1100;
  cursor: pointer;
  animation: dataMsgIn 0.25s ease;
  max-width: 80%;
  text-align: center;
}
.data-msg.success { background: var(--inc); color: var(--accent-fg); }
.data-msg.error { background: var(--exp); color: var(--accent-fg); }

@keyframes dataMsgIn {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>