<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon"><TwemojiIcon emoji="🔄" /></span><span class="row-label">管理周期规则</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <div v-if="expanded" class="expanded-content">
      <div v-if="rules.length === 0" class="empty-hint">暂无周期规则</div>
      <div v-for="rule in rules" :key="rule.id" class="rule-item">
        <div class="rule-info">
          <div class="rule-meta-row">
            <span class="rule-type" :class="'rule-type--' + rule.type">{{ typeLabel(rule.type) }}</span>
            <span class="rule-cat-icon" :class="{ muted: hasTitle(rule) }"><TwemojiIcon :emoji="getCategoryIcon(rule)" /></span>
            <span class="rule-meta">每月{{ rule.dayOfMonth }}日</span>
          </div>
          <div class="rule-main-row">
            <span class="rule-name">{{ displayName(rule) }}</span>
            <span class="rule-amount">{{ formatCurrency(rule.amount) }}</span>
          </div>
        </div>
        <div class="rule-actions">
          <label class="toggle">
            <input type="checkbox" :checked="rule.enabled" @change="toggleRule(rule)" />
            <span class="toggle-slider"></span>
          </label>
          <button class="icon-btn" @click="openEdit(rule)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn icon-btn--danger" @click="confirmDelete(rule)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>
      <button class="add-btn" @click="openAdd">+ 新增规则</button>
    </div>

    <!-- Rule Modal (Add / Edit) -->
    <CommonBottomSheet
      :visible="showModal"
      :title="editingRule ? '编辑规则' : '新增规则'"
      @close="showModal = false"
    >
      <div class="form-group">
        <label class="form-label">类型</label>
        <select v-model="form.type" class="form-input">
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">金额（元）</label>
        <input v-model.number="form.amountYuan" class="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">每月第几日</label>
        <input v-model.number="form.dayOfMonth" class="form-input" type="number" min="1" max="31" placeholder="1" />
      </div>
      <div class="form-group">
        <label class="form-label">标题（可选）</label>
        <input v-model="form.title" class="form-input" placeholder="标题" maxlength="100" />
      </div>
      <div class="form-group">
        <label class="form-label">分类</label>
        <select v-model.number="form.categoryId" class="form-input">
          <option :value="0">请选择</option>
          <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
            {{ cat.icon }} {{ cat.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input v-model="form.note" class="form-input" placeholder="备注（可选）" maxlength="200" />
      </div>
      <div class="form-group form-check-row">
        <label class="form-label form-check-label">自动入账</label>
        <label class="check-toggle">
          <input type="checkbox" v-model="form.autoApply" />
          <span class="check-slider"></span>
        </label>
      </div>
      <p class="form-hint">开启后，规则到期时自动记入账本，无需逐条确认；关闭则在记账页提醒后手动确认。</p>
      <template #actions>
        <button class="btn-cancel" @click="showModal = false">取消</button>
        <button class="btn-primary" :disabled="!canSave" @click="handleSave">保存</button>
      </template>
    </CommonBottomSheet>

    <!-- Delete confirm -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-content">
          <p class="modal-desc">确认删除此周期规则？</p>
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
import { ref, reactive, computed, watchEffect } from 'vue'
import { db } from '@/db'
import { formatCurrency } from '@/utils/format'
import { useCategoryStore } from '@/stores/categoryStore'
import type { RecurringRule } from '@/types'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'
import TwemojiIcon from '@/components/common/TwemojiIcon.vue'

const categoryStore = useCategoryStore()

const expanded = ref(false)

const rules = ref<RecurringRule[]>([])
let rulesLoaded = false
async function loadRules() {
  rules.value = await db.recurringRules.toArray()
}
watchEffect((onCleanup) => {
  if (!rulesLoaded) {
    loadRules()
    rulesLoaded = true
  }
  onCleanup(() => { rulesLoaded = false })
})

function typeLabel(type: string): string {
  return type === 'expense' ? '支出' : '收入'
}

function getCategoryIcon(rule: RecurringRule): string {
  if (!rule.categoryId) return '🗂️'
  const cat = categoryStore.categories.find((c) => c.id === rule.categoryId)
  return cat?.icon || '🗂️'
}

function getCategoryName(rule: RecurringRule): string {
  if (!rule.categoryId) return ''
  return categoryStore.categories.find((c) => c.id === rule.categoryId)?.name || ''
}

function hasTitle(rule: RecurringRule): boolean {
  return !!rule.title
}

function displayName(rule: RecurringRule): string {
  return rule.title || getCategoryName(rule)
}

// ── Toggle ──
async function toggleRule(rule: RecurringRule) {
  if (rule.id) {
    await db.recurringRules.update(rule.id, { enabled: !rule.enabled })
    await loadRules()
  }
}

// ── Add / Edit Modal ──
const showModal = ref(false)
const editingRule = ref<RecurringRule | null>(null)
const form = reactive({ type: 'expense' as 'expense' | 'income', amountYuan: 0, dayOfMonth: 1, title: '', categoryId: 0, note: '', autoApply: false })
const canSave = computed(() => form.amountYuan > 0 && form.dayOfMonth >= 1 && form.dayOfMonth <= 31)

const availableCategories = computed(() => {
  return categoryStore.categories.filter((c) => c.parentId !== null && c.type === form.type)
})

function openAdd() {
  editingRule.value = null
  form.type = 'expense'; form.amountYuan = 0; form.dayOfMonth = 1; form.title = ''; form.categoryId = 0; form.note = ''; form.autoApply = false
  showModal.value = true
}

function openEdit(rule: RecurringRule) {
  editingRule.value = rule
  form.type = rule.type
  form.amountYuan = rule.amount / 100
  form.dayOfMonth = rule.dayOfMonth
  form.title = rule.title
  form.categoryId = rule.categoryId || 0
  form.note = rule.note
  form.autoApply = !!rule.autoApply
  showModal.value = true
}

async function handleSave() {
  const amount = Math.round(form.amountYuan * 100)
  const data: Omit<RecurringRule, 'id'> = {
    type: form.type,
    title: form.title,
    amount,
    categoryId: form.categoryId > 0 ? form.categoryId : null,
    tags: [],
    note: form.note,
    dayOfMonth: form.dayOfMonth,
    enabled: true,
    lastExecuted: null,
    autoApply: form.autoApply,
  }
  if (editingRule.value?.id) {
    await db.recurringRules.update(editingRule.value.id, data)
  } else {
    await db.recurringRules.add(data)
  }
  showModal.value = false
  editingRule.value = null
  await loadRules()
}

// ── Delete ──
const deleteTarget = ref<RecurringRule | null>(null)

function confirmDelete(rule: RecurringRule) { deleteTarget.value = rule }

async function handleDelete() {
  if (deleteTarget.value?.id) {
    await db.recurringRules.delete(deleteTarget.value.id)
    deleteTarget.value = null
    await loadRules()
  }
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
  font-size: var(--fs-title);
  color: var(--color-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
  transition: background 0.1s;
}
.section-row:active { background: var(--color-press); }

.row-left { display: flex; align-items: center; gap: 10px; }
.row-icon { font-size: 18px; line-height: 1; }
.row-label { font-size: var(--fs-title); color: var(--color-text); }

.chevron { color: var(--color-placeholder); flex-shrink: 0; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

.expanded-content { padding: 4px 14px 12px; }
.empty-hint { text-align: center; padding: 12px; font-size: var(--fs-body); color: var(--color-secondary-text); }

.rule-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
.rule-info { display: flex; flex-direction: column; gap: 2px; }
.rule-type { font-size: var(--fs-small); padding: 1px 6px; border-radius: 4px; background: var(--color-bg); color: var(--color-secondary-text); flex-shrink: 0; }
.rule-meta-row { display: flex; align-items: center; gap: 6px; }
.rule-cat-icon { font-size: 14px; line-height: 1; flex-shrink: 0; }
.rule-cat-icon.muted { opacity: 0.6; }
.rule-meta { font-size: var(--fs-small); color: var(--color-secondary-text); }
.rule-main-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 2px; min-width: 0; }
.rule-name { font-size: var(--fs-body); color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rule-amount { font-size: var(--fs-amount); font-weight: 600; color: var(--color-text); flex-shrink: 0; }

.rule-actions { display: flex; align-items: center; gap: 6px; }

.toggle { position: relative; display: inline-block; width: 44px; height: 26px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--color-disabled-bg); border-radius: 13px; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; width: 22px; height: 22px; left: 2px; bottom: 2px; background: var(--color-surface); border-radius: 50%; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.toggle input:checked + .toggle-slider { background: var(--color-success); }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }

.icon-btn {
  width: 28px; height: 28px; border: none; background: var(--color-bg); border-radius: 6px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-secondary-text);
}
.icon-btn--danger { color: var(--color-destructive); }

.add-btn {
  width: 100%; padding: 10px; border: 1px dashed var(--color-placeholder); border-radius: 8px;
  background: none; font-size: var(--fs-body); color: var(--color-primary); cursor: pointer; margin-top: 8px;
}

/* Delete confirm overlay */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 280px; background: var(--glass-highlight), var(--color-sheet-bg); backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)); -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); border-radius: 16px; padding: 24px; margin: auto; }
.modal-desc { font-size: var(--fs-body); color: var(--color-text); text-align: center; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: var(--fs-body); font-weight: 500; color: var(--color-secondary-text); margin-bottom: 6px; }
.form-check-row { display: flex; align-items: center; justify-content: space-between; }
.form-check-label { margin-bottom: 0; }
.form-hint { font-size: var(--fs-small); color: var(--color-secondary-text); margin: -8px 0 16px; line-height: 1.5; }
.check-toggle { position: relative; display: inline-block; width: 44px; height: 26px; flex-shrink: 0; }
.check-toggle input { opacity: 0; width: 0; height: 0; }
.check-slider { position: absolute; cursor: pointer; inset: 0; background: var(--color-disabled-bg); border-radius: 13px; transition: 0.2s; }
.check-slider::before { content: ''; position: absolute; width: 22px; height: 22px; left: 2px; bottom: 2px; background: var(--color-surface); border-radius: 50%; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.check-toggle input:checked + .check-slider { background: var(--color-primary); }
.check-toggle input:checked + .check-slider::before { transform: translateX(18px); }
.form-input { width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--color-separator); background: var(--color-input-bg); padding: 0 12px; font-size: var(--fs-title); color: var(--color-text); outline: none; box-sizing: border-box; font-family: inherit; }
.form-input:focus { border-color: var(--color-primary); }
.btn-cancel { flex: 1; height: 44px; border-radius: 10px; border: none; background: var(--color-bg); color: var(--color-text); font-size: var(--fs-amount); font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-primary { flex: 1; height: 44px; border-radius: 10px; border: none; background: var(--color-primary); color: #fff; font-size: var(--fs-amount); font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary:active { opacity: 0.7; }
.btn-danger { height: 44px; padding: 0 24px; border-radius: 10px; border: none; background: var(--color-destructive); color: #fff; font-size: var(--fs-amount); font-weight: 500; cursor: pointer; font-family: inherit; }
</style>