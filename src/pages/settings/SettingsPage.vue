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
          <button class="section-row" @click="expanded.account = !expanded.account">
            <div class="row-left"><span class="row-icon">🏦</span><span class="row-label">管理账户</span></div>
            <svg class="chevron" :class="{ rotated: expanded.account }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div v-if="expanded.account" class="expanded-content">
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
              <button class="edit-btn" @click="openEditAccount(acc)">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="delete-btn" @click="deleteAccount(acc)">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
            <button class="add-btn" @click="showAddAccount = true">+ 新增账户</button>
          </div>
        </div>
      </div>

      <!-- ── 4. Categories & Tags ── -->
      <div class="section">
        <div class="section-header">分类与标签</div>
        <div class="section-card">
          <button class="section-row" @click="expanded.categories = !expanded.categories">
            <div class="row-left"><span class="row-icon">📂</span><span class="row-label">管理分类</span></div>
            <svg class="chevron" :class="{ rotated: expanded.categories }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div v-if="expanded.categories" class="expanded-content">
            <div v-if="categoryStore.categories.length === 0" class="empty-hint">暂无分类</div>
            <div v-for="cat in parentCategories" :key="cat.id" class="category-item">
              <div class="category-parent" @click="toggleCategoryChildren(cat.id!)">
                <span class="category-icon">{{ cat.icon }}</span>
                <span class="category-name">{{ cat.name }}</span>
                <svg class="chevron small" :class="{ rotated: expandedCategoryIds.has(cat.id!) }" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#c7c7cc" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
              <div v-if="expandedCategoryIds.has(cat.id!)" class="category-children">
                <div v-for="child in getCategoryChildren(cat.id!)" :key="child.id" class="category-child">
                  <span class="category-icon small">{{ child.icon }}</span>
                  <span class="category-name">{{ child.name }}</span>
                </div>
                <div v-if="getCategoryChildren(cat.id!).length === 0" class="empty-hint small">无子分类</div>
              </div>
            </div>
          </div>
          <div class="separator"></div>
          <button class="section-row" @click="expanded.tags = !expanded.tags">
            <div class="row-left"><span class="row-icon">🏷️</span><span class="row-label">管理标签</span></div>
            <svg class="chevron" :class="{ rotated: expanded.tags }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div v-if="expanded.tags" class="expanded-content">
            <div v-if="tags.length === 0" class="empty-hint">暂无标签</div>
            <div v-for="tag in tags" :key="tag" class="tag-item">
              <span class="tag-name">{{ tag }}</span>
              <button class="tag-delete" @click="showTagDeleteConfirm(tag)">删除</button>
            </div>
            <div class="tag-add-row">
              <input v-model="newTag" class="tag-input" placeholder="输入新标签" maxlength="20" @keyup.enter="addTag" />
              <button class="tag-add-btn" :disabled="!newTag.trim()" @click="addTag">添加</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 5. Recurring Rules ── -->
      <div class="section">
        <div class="section-header">周期记账</div>
        <div class="section-card">
          <button class="section-row" @click="expanded.rules = !expanded.rules">
            <div class="row-left"><span class="row-icon">🔄</span><span class="row-label">管理周期规则</span></div>
            <svg class="chevron" :class="{ rotated: expanded.rules }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div v-if="expanded.rules" class="expanded-content">
            <div v-if="recurringRules.length === 0" class="empty-hint">暂无周期规则</div>
            <div v-for="rule in recurringRules" :key="rule.id" class="rule-item">
              <div class="rule-info">
                <span class="rule-type" :class="'rule-type--' + rule.type">{{ ruleTypeLabel(rule.type) }}</span>
                <span class="rule-amount">{{ formatCurrency(rule.amount) }}</span>
                <span class="rule-meta">每月{{ rule.dayOfMonth }}日</span>
              </div>
              <div class="rule-actions">
                <label class="toggle">
                  <input type="checkbox" :checked="rule.enabled" @change="toggleRule(rule)" />
                  <span class="toggle-slider"></span>
                </label>
                <button class="rule-edit-btn" @click="openEditRule(rule)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="rule-delete-btn" @click="showRuleDeleteConfirm(rule)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            </div>
            <button class="add-btn" @click="openAddRule">+ 新增规则</button>
          </div>
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

      <!-- ── Modals (same as before) ── -->
      <!-- Add Account Modal -->
      <div v-if="showAddAccount" class="modal-overlay" @click.self="showAddAccount = false">
        <div class="modal-bottom">
          <div class="modal-handle"></div>
          <h3 class="modal-title">新增账户</h3>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input v-model="accountForm.name" class="form-input" placeholder="账户名称" />
            </div>
            <div class="form-group">
              <label class="form-label">图标</label>
              <input v-model="accountForm.icon" class="form-input" placeholder="💳" maxlength="4" />
            </div>
            <div class="form-group">
              <label class="form-label">初始余额 (¥)</label>
              <input v-model.number="accountForm.initialBalance" class="form-input" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">排序</label>
              <input v-model.number="accountForm.sort" class="form-input" type="number" placeholder="0" />
            </div>
          </div>
          <div class="modal-bottom-actions">
            <button class="btn-primary" :disabled="!accountForm.name.trim()" @click="handleAddAccount">确认</button>
            <button class="btn-cancel" @click="showAddAccount = false">取消</button>
          </div>
        </div>
      </div>

      <!-- Edit Account Modal -->
      <div v-if="editAccountTarget" class="modal-overlay" @click.self="editAccountTarget = null">
        <div class="modal-bottom">
          <div class="modal-handle"></div>
          <h3 class="modal-title">编辑账户</h3>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input v-model="editAccountForm.name" class="form-input" placeholder="账户名称" />
            </div>
            <div class="form-group">
              <label class="form-label">图标</label>
              <input v-model="editAccountForm.icon" class="form-input" placeholder="💳" maxlength="4" />
            </div>
            <div class="form-group">
              <label class="form-label">余额 (¥)</label>
              <input v-model.number="editAccountForm.balanceYuan" class="form-input" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">排序</label>
              <input v-model.number="editAccountForm.sort" class="form-input" type="number" placeholder="0" />
            </div>
          </div>
          <div class="modal-bottom-actions">
            <button class="btn-primary" :disabled="!editAccountForm.name.trim()" @click="handleEditAccount">保存</button>
            <button class="btn-cancel" @click="editAccountTarget = null">取消</button>
          </div>
        </div>
      </div>

      <!-- Rule Modal -->
      <div v-if="showRuleModal" class="modal-overlay" @click.self="showRuleModal = false">
        <div class="modal-bottom tall">
          <div class="modal-handle"></div>
          <h3 class="modal-title">{{ editingRule ? '编辑规则' : '新增规则' }}</h3>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">类型</label>
              <select v-model="ruleForm.type" class="form-input">
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">金额（元）</label>
              <input v-model.number="ruleForm.amountYuan" class="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">每月第几日</label>
              <input v-model.number="ruleForm.dayOfMonth" class="form-input" type="number" min="1" max="31" placeholder="1" />
            </div>
            <div class="form-group">
              <label class="form-label">备注</label>
              <input v-model="ruleForm.note" class="form-input" placeholder="备注（可选）" maxlength="200" />
            </div>
          </div>
          <div class="modal-bottom-actions">
            <button class="btn-primary" :disabled="!canSaveRule" @click="handleSaveRule">保存</button>
            <button class="btn-cancel" @click="showRuleModal = false">取消</button>
          </div>
        </div>
      </div>

      <!-- Tag delete confirm -->
      <div v-if="tagToDelete" class="modal-overlay" @click.self="tagToDelete = ''">
        <div class="modal-content"><p class="modal-desc">确认删除标签「{{ tagToDelete }}」？</p>
          <div class="modal-actions"><button class="btn-cancel" @click="tagToDelete = ''">取消</button><button class="btn-danger" @click="confirmTagDelete">删除</button></div></div>
      </div>
      <!-- Rule delete confirm -->
      <div v-if="ruleToDelete" class="modal-overlay" @click.self="ruleToDelete = null">
        <div class="modal-content"><p class="modal-desc">确认删除此周期规则？</p>
          <div class="modal-actions"><button class="btn-cancel" @click="ruleToDelete = null">取消</button><button class="btn-danger" @click="confirmRuleDelete">删除</button></div></div>
      </div>
      <!-- Account delete confirm -->
      <div v-if="accountToDelete" class="modal-overlay" @click.self="accountToDelete = null">
        <div class="modal-content"><p class="modal-desc">{{ accountDeleteMsg }}</p>
          <div class="modal-actions"><button class="btn-cancel" @click="accountToDelete = null">取消</button><button v-if="accountDeleteCanDelete" class="btn-danger" @click="confirmAccountDelete">删除</button></div></div>
      </div>

      <!-- Data: success/error message -->
      <div v-if="dataSuccessMsg" class="data-msg success" @click="dataSuccessMsg = ''">{{ dataSuccessMsg }}</div>
      <div v-if="dataErrorMsg" class="data-msg error" @click="dataErrorMsg = ''">{{ dataErrorMsg }}</div>

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
    </template>

    <SecurityLock v-else-if="currentView === 'security'" @back="currentView = 'main'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watchEffect } from 'vue'
import { db } from '@/db'
import { useAccountStore } from '@/stores/accountStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { getStoredPINHash } from '@/utils/crypto'
import { formatCurrency } from '@/utils/format'
import { exportData, importData, destroyAllData } from '@/utils/export'
import SecurityLock from './SecurityLock.vue'
import type { Account, Category, RecurringRule } from '@/types'

const accountStore = useAccountStore()
const categoryStore = useCategoryStore()

const currentView = ref<'main' | 'security'>('main')
const hasPin = computed(() => !!getStoredPINHash())

// ── Data Management State ──
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

const expanded = reactive({ account: false, categories: false, tags: false, rules: false })
const expandedCategoryIds = reactive(new Set<number>())

const parentCategories = computed(() => categoryStore.categories.filter((c: Category) => c.parentId === null))

function getCategoryChildren(parentId: number): Category[] {
  return categoryStore.categories.filter((c: Category) => c.parentId === parentId)
}

function toggleCategoryChildren(id: number) {
  if (expandedCategoryIds.has(id)) expandedCategoryIds.delete(id)
  else expandedCategoryIds.add(id)
}

// Tags
const tags = ref<string[]>([])
const newTag = ref('')
const tagToDelete = ref('')

async function loadTags() {
  const allTxs = await db.transactions.toArray()
  const tagSet = new Set<string>()
  for (const tx of allTxs) { for (const tag of tx.tags) tagSet.add(tag) }
  tags.value = Array.from(tagSet).sort()
}
watchEffect(() => { loadTags() })

function addTag() {
  const t = newTag.value.trim()
  if (!t || tags.value.includes(t)) return
  tags.value.push(t)
  tags.value.sort()
  newTag.value = ''
}
function showTagDeleteConfirm(tag: string) { tagToDelete.value = tag }
function confirmTagDelete() { tags.value = tags.value.filter((t: string) => t !== tagToDelete.value); tagToDelete.value = '' }

// Rules
const recurringRules = ref<RecurringRule[]>([])
async function loadRules() { recurringRules.value = await db.recurringRules.toArray() }
watchEffect(() => { loadRules() })

const showRuleModal = ref(false)
const editingRule = ref<RecurringRule | null>(null)
const ruleToDelete = ref<RecurringRule | null>(null)
const ruleForm = reactive({ type: 'expense' as 'expense' | 'income', amountYuan: 0, dayOfMonth: 1, note: '' })
const canSaveRule = computed(() => ruleForm.amountYuan > 0 && ruleForm.dayOfMonth >= 1 && ruleForm.dayOfMonth <= 31)
function ruleTypeLabel(type: string): string { return type === 'expense' ? '支出' : '收入' }
function openAddRule() {
  editingRule.value = null; ruleForm.type = 'expense'; ruleForm.amountYuan = 0; ruleForm.dayOfMonth = 1; ruleForm.note = ''; showRuleModal.value = true
}
function openEditRule(rule: RecurringRule) {
  editingRule.value = rule; ruleForm.type = rule.type; ruleForm.amountYuan = rule.amount / 100; ruleForm.dayOfMonth = rule.dayOfMonth; ruleForm.note = rule.note; showRuleModal.value = true
}
async function handleSaveRule() {
  const amount = Math.round(ruleForm.amountYuan * 100)
  const ruleData: Omit<RecurringRule, 'id'> = { type: ruleForm.type, title: ruleForm.note, amount, categoryId: null, tags: [], note: ruleForm.note, dayOfMonth: ruleForm.dayOfMonth, enabled: true, lastExecuted: null }
  if (editingRule.value?.id) await db.recurringRules.update(editingRule.value.id, ruleData)
  else await db.recurringRules.add(ruleData)
  showRuleModal.value = false; editingRule.value = null; await loadRules()
}
async function toggleRule(rule: RecurringRule) {
  if (rule.id) { await db.recurringRules.update(rule.id, { enabled: !rule.enabled }); await loadRules() }
}
function showRuleDeleteConfirm(rule: RecurringRule) { ruleToDelete.value = rule }
async function confirmRuleDelete() { if (ruleToDelete.value?.id) { await db.recurringRules.delete(ruleToDelete.value.id); ruleToDelete.value = null; await loadRules() } }

// Accounts management
// ── Account Drag & Drop Sort ──
const dragIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

function onDragStart(e: DragEvent, idx: number) {
  dragIdx.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }
}

function onDragOver(idx: number) {
  dragOverIdx.value = idx
}

function onDragLeave() {
  dragOverIdx.value = null
}

async function onDrop(e: DragEvent, dropIdx: number) {
  const fromIdx = dragIdx.value
  if (fromIdx == null || fromIdx === dropIdx) return

  const list = [...accountStore.accounts]
  const [moved] = list.splice(fromIdx, 1)
  list.splice(dropIdx, 0, moved)

  // Update sort values in DB for all affected accounts
  for (let i = 0; i < list.length; i++) {
    const acc = list[i]
    if (acc.id != null && acc.sort !== i + 1) {
      await accountStore.updateAccount(acc.id, { sort: i + 1 })
    }
  }

  dragIdx.value = null
  dragOverIdx.value = null
}

function onDragEnd() {
  dragIdx.value = null
  dragOverIdx.value = null
}

const showAddAccount = ref(false)
const editAccountTarget = ref<Account | null>(null)
const accountToDelete = ref<Account | null>(null)
const accountDeleteMsg = ref('')
const accountDeleteCanDelete = ref(false)
const accountForm = reactive({ name: '', icon: '🏦', initialBalance: 0, sort: 0 })
const editAccountForm = reactive({ name: '', icon: '🏦', balanceYuan: 0, sort: 0 })

function openEditAccount(acc: Account) {
  editAccountTarget.value = acc
  editAccountForm.name = acc.name
  editAccountForm.icon = acc.icon
  editAccountForm.balanceYuan = Math.round(acc.balance) / 100
  editAccountForm.sort = acc.sort
}
async function handleAddAccount() {
  if (!accountForm.name.trim()) return
  await accountStore.addAccount({
    name: accountForm.name.trim(),
    icon: accountForm.icon || '🏦',
    balance: Math.round(parseFloat(String(accountForm.initialBalance || '0')) * 100),
    sort: accountForm.sort,
  })
  accountForm.name = ''; accountForm.icon = '🏦'; accountForm.initialBalance = 0; accountForm.sort = 0
  showAddAccount.value = false
}
async function handleEditAccount() {
  if (!editAccountTarget.value?.id || !editAccountForm.name.trim()) return
  await accountStore.updateAccount(editAccountTarget.value.id, {
    name: editAccountForm.name.trim(),
    icon: editAccountForm.icon || '🏦',
    balance: Math.round(parseFloat(String(editAccountForm.balanceYuan || '0')) * 100),
    sort: editAccountForm.sort,
  })
  editAccountTarget.value = null
}
async function deleteAccount(acc: Account) {
  accountDeleteMsg.value = '确认删除资产「' + acc.name + '」？'
  accountDeleteCanDelete.value = true
  accountToDelete.value = acc
}
async function confirmAccountDelete() { if (accountToDelete.value?.id && accountDeleteCanDelete.value) { await accountStore.deleteAccount(accountToDelete.value.id) }; accountToDelete.value = null }
</script>

<style scoped>
.settings-page {
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
}

/* Section */
.section {
  margin-bottom: 20px;
}

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

.row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.row-icon { font-size: 18px; line-height: 1; }

.row-label { font-size: 15px; color: #1c1c1e; }

.row-label--danger { color: #ff3b30; }

.row-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.row-status { font-size: 13px; color: #8e8e93; }
.row-value { font-size: 13px; color: #8e8e93; }

.chevron { color: #c7c7cc; flex-shrink: 0; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }
.chevron.small { width: 14px; height: 14px; }

.separator { height: 1px; background: var(--color-separator); margin: 0 14px; }

.expanded-content { padding: 4px 14px 12px; }

.empty-hint { text-align: center; padding: 12px; font-size: 14px; color: #8e8e93; }
.empty-hint.small { padding: 8px; font-size: 12px; }

/* Account items in expanded */
.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
  transition: background 0.15s;
  border-radius: 6px;
  margin: 0 -4px;
  padding: 8px 4px;
}
.account-item.drag-over {
  background: rgba(0, 122, 255, 0.08);
}
.account-item:active {
  opacity: 0.8;
}
.drag-handle {
  font-size: 16px;
  color: #c7c7cc;
  cursor: grab;
  user-select: none;
  line-height: 1;
  padding: 2px;
  flex-shrink: 0;
}
.drag-handle:active {
  cursor: grabbing;
}
.account-icon { font-size: 16px; }
.account-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.account-name { font-size: 14px; color: #1c1c1e; }
.account-balance { font-size: 12px; color: #8e8e93; }
.edit-btn, .delete-btn {
  width: 28px; height: 28px; border: none; background: #f2f2f6; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8e8e93;
}
.delete-btn { color: #ff3b30; }
.add-btn { width: 100%; padding: 10px; border: 1px dashed #c7c7cc; border-radius: 8px; background: none; font-size: 14px; color: #007aff; cursor: pointer; margin-top: 8px; }

/* Category items */
.category-item { margin-bottom: 4px; }
.category-parent {
  display: flex; align-items: center; gap: 8px; padding: 8px 4px; cursor: pointer;
}
.category-icon { font-size: 16px; width: 24px; text-align: center; }
.category-icon.small { font-size: 13px; }
.category-name { flex: 1; font-size: 14px; color: #1c1c1e; }
.category-children { padding-left: 12px; }
.category-child { display: flex; align-items: center; gap: 6px; padding: 4px 0; }

/* Tag items */
.tag-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.tag-name { font-size: 14px; color: #1c1c1e; }
.tag-delete { border: none; background: none; color: #ff3b30; font-size: 12px; cursor: pointer; }
.tag-add-row { display: flex; gap: 8px; margin-top: 8px; }
.tag-input { flex: 1; height: 36px; border-radius: 8px; border: 1px solid #e5e5ea; padding: 0 10px; font-size: 14px; outline: none; }
.tag-add-btn { height: 36px; padding: 0 16px; border: none; border-radius: 8px; background: #007aff; color: #fff; font-size: 13px; cursor: pointer; }
.tag-add-btn:disabled { opacity: 0.4; }

/* Rule items */
.rule-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
.rule-info { display: flex; flex-direction: column; gap: 2px; }
.rule-type { font-size: 12px; padding: 1px 6px; border-radius: 4px; background: #f2f2f6; color: #8e8e93; }
.rule-amount { font-size: 16px; font-weight: 600; color: #1c1c1e; }
.rule-meta { font-size: 12px; color: #8e8e93; }
.rule-actions { display: flex; align-items: center; gap: 6px; }

.toggle { position: relative; display: inline-block; width: 44px; height: 26px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #e5e5ea; border-radius: 13px; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; width: 22px; height: 22px; left: 2px; bottom: 2px; background: #fff; border-radius: 50%; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.toggle input:checked + .toggle-slider { background: #34c759; }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }

.rule-edit-btn, .rule-delete-btn { width: 28px; height: 28px; border: none; background: #f2f2f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8e8e93; }
.rule-delete-btn { color: #ff3b30; }

/* Modal overlays */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
.modal-bottom { width: 100%; max-width: 480px; background: #fff; border-radius: 16px 16px 0 0; padding: 8px 24px 32px; max-height: 85vh; overflow-y: auto; }
.modal-bottom.tall { max-height: 90vh; }
.modal-handle { width: 36px; height: 4px; border-radius: 2px; background: #d1d1d6; margin: 0 auto 12px; }
.modal-title { font-size: 18px; font-weight: 600; text-align: center; margin-bottom: 20px; color: #1c1c1e; }
.modal-content { width: 280px; background: #fff; border-radius: 16px; padding: 24px; margin-bottom: auto; margin-top: auto; }
.modal-desc { font-size: 14px; color: #1c1c1e; text-align: center; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }

.modal-body { margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 14px; font-weight: 500; color: #8e8e93; margin-bottom: 6px; }
.form-input { width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--color-separator); background: #f2f2f6; padding: 0 12px; font-size: 15px; color: #1c1c1e; outline: none; }
.form-input:focus { border-color: #007aff; }

.modal-bottom-actions { display: flex; gap: 12px; }
.btn-primary { flex: 1; height: 44px; border-radius: 10px; border: none; background: #007aff; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary:active { opacity: 0.7; }
.btn-cancel { flex: 1; height: 44px; border-radius: 10px; border: none; background: #f2f2f6; color: #1c1c1e; font-size: 16px; font-weight: 500; cursor: pointer; }
.btn-danger { height: 44px; padding: 0 24px; border-radius: 10px; border: none; background: #ff3b30; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; }

/* ── Data management message toasts ── */
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