<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon">🔄</span><span class="row-label">管理周期规则</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <div v-if="expanded" class="expanded-content">
      <div v-if="rules.length === 0" class="empty-hint">暂无周期规则</div>
      <div v-for="rule in rules" :key="rule.id" class="rule-item">
        <div class="rule-info">
          <span class="rule-type" :class="'rule-type--' + rule.type">{{ typeLabel(rule.type) }}</span>
          <span class="rule-amount">{{ formatCurrency(rule.amount) }}</span>
          <span class="rule-meta">每月{{ rule.dayOfMonth }}日</span>
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
        <label class="form-label">备注</label>
        <input v-model="form.note" class="form-input" placeholder="备注（可选）" maxlength="200" />
      </div>
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
import type { RecurringRule } from '@/types'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'

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
const form = reactive({ type: 'expense' as 'expense' | 'income', amountYuan: 0, dayOfMonth: 1, note: '' })
const canSave = computed(() => form.amountYuan > 0 && form.dayOfMonth >= 1 && form.dayOfMonth <= 31)

function openAdd() {
  editingRule.value = null
  form.type = 'expense'; form.amountYuan = 0; form.dayOfMonth = 1; form.note = ''
  showModal.value = true
}

function openEdit(rule: RecurringRule) {
  editingRule.value = rule
  form.type = rule.type
  form.amountYuan = rule.amount / 100
  form.dayOfMonth = rule.dayOfMonth
  form.note = rule.note
  showModal.value = true
}

async function handleSave() {
  const amount = Math.round(form.amountYuan * 100)
  const data: Omit<RecurringRule, 'id'> = {
    type: form.type,
    title: form.note,
    amount,
    categoryId: null,
    tags: [],
    note: form.note,
    dayOfMonth: form.dayOfMonth,
    enabled: true,
    lastExecuted: null,
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

.icon-btn {
  width: 28px; height: 28px; border: none; background: #f2f2f6; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8e8e93;
}
.icon-btn--danger { color: #ff3b30; }

.add-btn {
  width: 100%; padding: 10px; border: 1px dashed #c7c7cc; border-radius: 8px;
  background: none; font-size: 14px; color: #007aff; cursor: pointer; margin-top: 8px;
}

/* Delete confirm overlay */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 280px; background: #fff; border-radius: 16px; padding: 24px; margin: auto; }
.modal-desc { font-size: 14px; color: #1c1c1e; text-align: center; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 14px; font-weight: 500; color: #8e8e93; margin-bottom: 6px; }
.form-input { width: 100%; height: 40px; border-radius: 10px; border: 1px solid rgba(60,60,67,0.12); background: #f2f2f6; padding: 0 12px; font-size: 15px; color: #1c1c1e; outline: none; box-sizing: border-box; font-family: inherit; }
.form-input:focus { border-color: #007aff; }
.btn-cancel { flex: 1; height: 44px; border-radius: 10px; border: none; background: #f2f2f6; color: #1c1c1e; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-primary { flex: 1; height: 44px; border-radius: 10px; border: none; background: #007aff; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary:active { opacity: 0.7; }
.btn-danger { height: 44px; padding: 0 24px; border-radius: 10px; border: none; background: #ff3b30; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
</style>