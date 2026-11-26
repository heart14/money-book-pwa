<template>
  <div class="bk">
    <div class="bk-screen" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <!-- 顶部语境：日期 + 模式徽标 + 撤销 -->
      <header class="bk-top">
        <button class="bk-undo" @click="resetState" aria-label="撤销">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <span class="bk-date">{{ longDate }} {{ displayTime }}</span>
        <span class="bk-mode-tag" :class="`tag-${mode}`">{{ modeLabel[mode] }}</span>
      </header>

      <!-- 周期待入账（如有则置于顶部语境下） -->
      <section v-if="dueRules.length > 0" class="bk-due">
        <div v-for="rule in dueRules" :key="rule.id" class="bk-due-item">
          <span class="bk-due-type" :class="`bk-due-type--${rule.type}`">{{ rule.type === 'expense' ? '支出' : '收入' }}</span>
          <TwemojiIcon :emoji="ruleCategoryIcon(rule)" />
          <span class="bk-due-name">{{ ruleDisplayName(rule) }}</span>
          <span class="bk-due-amt num">{{ formatShortCurrency(rule.amount) }}</span>
          <button class="bk-due-skip" @click="skipDue(rule)">跳过</button>
          <button class="bk-due-go" @click="prefillRule(rule)">记一笔</button>
        </div>
      </section>

      <!-- 全屏大金额：点击唤起键盘 -->
      <div class="bk-amount-zone" @click="keyboardVisible = true">
        <p class="bk-modal-hint">记一笔{{ modeLabel[mode] }}</p>
        <p class="num bk-amount" :class="modeColor">{{ displayAmount }}</p>
        <p class="bk-tap-hint">点数字录入 · 左右滑切换类别</p>
      </div>

      <!-- 日期 / 时间 -->
      <div class="bk-dt">
        <button class="bk-dt-picker" @click="datePickerOpen = true"><span class="bk-dt-tag">日期</span>{{ selectedDate }}</button>
        <button class="bk-dt-picker" @click="timePickerOpen = true"><span class="bk-dt-tag">时间</span>{{ selectedTime }}</button>
      </div>

      <!-- 分类触发区：沉浸式网格，点开底部半屏九宫格 -->
      <section class="bk-cat-zone">
        <div class="bk-label-row">
          <span class="bk-label">选择分类</span>
          <button class="bk-open-btn" @click="sheetOpen = true">{{ selName || '展开九宫格' }}<i>›</i></button>
        </div>
        <div class="bk-prev-grid">
          <button
            v-for="p in parents"
            :key="p.id!"
            class="bk-tile"
            :class="{ sel: selParent === p.id && selChild == null }"
            @click="quickPick(p)"
          >
            <span class="bk-tile-icon"><TwemojiIcon :emoji="p.icon" /></span>
            <span class="bk-tile-name">{{ p.name }}</span>
          </button>
        </div>
      </section>

      <!-- 标题 / 备注 / 标签 / 快记：沉浸折叠区 -->
      <section class="bk-fields">
        <div class="bk-field">
          <span class="bk-field-tag">标题</span>
          <input v-model="title" class="bk-input" placeholder="给这笔记账加个标题" maxlength="100" />
        </div>
        <div class="bk-field">
          <span class="bk-field-tag">备注</span>
          <input v-model="note" class="bk-input" placeholder="备注（可选）" maxlength="200" />
        </div>
        <div class="bk-field">
          <span class="bk-field-tag">标签</span>
          <div class="bk-tags">
            <span v-for="(t, idx) in tags" :key="idx" class="bk-tag">{{ t }}<button class="bk-tag-x" @click="removeTag(idx)">&times;</button></span>
            <input v-model="tagInput" class="bk-tag-input" placeholder="添加标签（可选）" maxlength="20" @keydown.enter.prevent="addTag" @keydown.,.prevent="addTag" />
          </div>
        </div>
      </section>

      <section v-if="displayBubbles.length" class="bk-block">
        <div class="bk-label">快记</div>
        <div class="bk-tpls">
          <button v-for="t in displayBubbles" :key="t.id" class="bk-tpl" @click="applyTemplate(t)">
            <span class="bk-tpl-icon"><TwemojiIcon :emoji="t.categoryIcon" /></span>
            <span class="bk-tpl-name">{{ t.name }}</span>
            <span class="num bk-tpl-amt">{{ formatShortCurrency(t.amount) }}</span>
          </button>
          <button class="bk-tpl bk-tpl-add" @click="saveAsTemplate"><span class="bk-tpl-add-icon">+</span></button>
        </div>
      </section>
      <section v-else class="bk-block">
        <div class="bk-label">快记</div>
        <p class="bk-empty-hint">暂无快记模板 · 保存一条当前记录为模板</p>
        <button class="bk-tpl bk-tpl-add" @click="saveAsTemplate"><span class="bk-tpl-add-icon">+</span></button>
      </section>
    </div>

    <!-- 结算栏：沉浸把手，确认入账 -->
    <footer class="bk-commit glass" :class="{ off: !canSave }" @click="handleConfirm">
      <span class="bk-commit-label">记入账</span>
      <span class="num bk-commit-amt" :class="modeColor">{{ displayAmount }}</span>
    </footer>

    <!-- 底部半屏分类九宫格 -->
    <Teleport to="body">
    <Transition name="rs-sheet-up">
      <div v-if="sheetOpen" class="bk-sheet-backdrop" @click="sheetOpen = false">
        <div class="bk-sheet glass" @click.stop>
          <div class="rs-handle" />
          <div class="bk-sheet-title">选择{{ modeLabel[mode] }}分类</div>
          <div class="bk-sheet-grid">
            <button
              v-for="p in parents"
              :key="p.id!"
              class="bk-big-tile"
              :class="{ sel: selParent === p.id }"
              @click="pickParent(p)"
            >
              <span class="bk-big-icon"><TwemojiIcon :emoji="p.icon" /></span>
              <span class="bk-big-name">{{ p.name }}</span>
            </button>
          </div>
          <div v-if="childrenRows.length" class="bk-sheet-chips">
            <button
              v-for="c in childrenRows"
              :key="c.id!"
              class="bk-chip"
              :class="{ on: selChild === c.id }"
              @click="pickChild(c)"
            >{{ c.name }}</button>
          </div>
          <button class="bk-done" @click="sheetOpen = false">完成</button>
        </div>
      </div>
    </Transition>
    </Teleport>

    <!-- 数字键盘浮层 -->
    <Teleport to="body">
    <Transition name="rs-sheet-up">
      <div v-if="keyboardVisible" class="bk-kb" @click.self="keyboardVisible = false">
        <div class="bk-kb-inner glass" @click.stop>
          <div class="rs-handle" />
          <div class="num bk-kb-preview" :class="modeColor">{{ displayAmount }}</div>
          <div class="bk-kb-grid">
            <button v-for="k in keys" :key="k" class="num bk-key" :class="k" @click="press(k)">
              <span v-if="k !== 'del'">{{ k }}</span>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="17" y1="9" x2="13" y2="15"/><line x1="13" y1="9" x2="17" y2="15"/></svg>
            </button>
          </div>
          <button class="bk-kb-done" @click="keyboardVisible = false">完成</button>
        </div>
      </div>
    </Transition>
    </Teleport>

    <Transition name="bk-toast">
      <div v-if="toastVisible" class="bk-toast">{{ toastMessage }}</div>
    </Transition>

    <PromptDialog
      :visible="promptVisible"
      :title="promptTitle"
      :initial-value="promptInitialValue"
      placeholder="请输入模板名称"
      confirm-text="保存"
      @confirm="onPromptConfirm"
      @cancel="promptVisible = false"
      @update:visible="promptVisible = $event"
    />
    <DatePickerSheet v-model:visible="datePickerOpen" v-model="selectedDate" />
    <TimePickerSheet v-model:visible="timePickerOpen" v-model="selectedTime" :selected-date="selectedDate" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useUiStore, type BookingMode } from '@/stores/uiStore'
import type { Transaction, QuickTemplate, RecurringRule, Category } from '@/types'
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import PromptDialog from '@/components/common/PromptDialog.vue'
import { formatShortCurrency, toDateString } from '@/utils/format'
import { dueRules, loadDueRules, skipRule } from '@/services/recurringService'
import TwemojiIcon from '@/components/common/TwemojiIcon.vue'
import DatePickerSheet from '@/components/common/DatePickerSheet.vue'
import TimePickerSheet from '@/components/common/TimePickerSheet.vue'

const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()
const uiStore = useUiStore()
const quickTemplateStore = useQuickTemplateStore()

const modeOrder: BookingMode[] = ['income', 'expense', 'transfer']
const modeLabel: Record<BookingMode, string> = { income: '收入', expense: '支出', transfer: '转账' }

const mode = ref<BookingMode>(uiStore.bookingMode)
const inputValue = ref('0')
const keyboardVisible = ref(false)
const sheetOpen = ref(false)
const selectedCategoryId = ref<number | null>(null)
const note = ref('')
const title = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')

const selectedDate = ref(toDateString(new Date()))
const selectedTime = ref(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`)
const datePickerOpen = ref(false)
const timePickerOpen = ref(false)

const currentSeconds = ref(String(new Date().getSeconds()).padStart(2, '0'))
let secondsTimer: ReturnType<typeof setInterval> | null = null

const displayTime = computed(() => {
  const n = new Date()
  const today = toDateString(n)
  const now = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  const modified = selectedDate.value !== today || selectedTime.value !== now
  return `${selectedTime.value}:${modified ? '00' : currentSeconds.value}`
})
const longDate = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00')
  const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 ${wd}`
})

function startSecondsTimer() {
  if (secondsTimer) return
  secondsTimer = setInterval(() => {
    currentSeconds.value = String(new Date().getSeconds()).padStart(2, '0')
  }, 1000)
}
function stopSecondsTimer() {
  if (secondsTimer) { clearInterval(secondsTimer); secondsTimer = null }
}
function onVisibilityChange() {
  if (document.hidden) stopSecondsTimer()
  else { currentSeconds.value = String(new Date().getSeconds()).padStart(2, '0'); startSecondsTimer() }
}
onMounted(() => { startSecondsTimer(); document.addEventListener('visibilitychange', onVisibilityChange); loadDueRules() })
onUnmounted(() => { stopSecondsTimer(); document.removeEventListener('visibilitychange', onVisibilityChange) })

let startX = 0
function onTouchStart(e: TouchEvent) { startX = e.touches[0].clientX }
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - startX
  const abs = Math.abs(dx)
  if (abs < 60) return
  const idx = modeOrder.indexOf(mode.value)
  if (dx < 0 && idx < modeOrder.length - 1) onModeChange(modeOrder[idx + 1])
  else if (dx > 0 && idx > 0) onModeChange(modeOrder[idx - 1])
}

const displayAmount = computed(() => {
  const v = inputValue.value
  if (v === '0') return '¥0.00'
  if (v.includes('.')) {
    const [intPart, decPart = ''] = v.split('.')
    const fi = intPart ? parseInt(intPart).toLocaleString('zh-CN') : '0'
    return decPart === '' ? `¥${fi}.00` : `¥${fi}.${decPart.padEnd(2, '0')}`
  }
  return `¥${parseInt(v).toLocaleString('zh-CN')}`
})

const canSave = computed(() => {
  if (inputValue.value === '0') return false
  const amount = Math.round(parseFloat(inputValue.value) * 100)
  if (isNaN(amount) || amount <= 0) return false
  return selectedCategoryId.value != null
})

const displayBubbles = computed(() => {
  return quickTemplateStore.templates
    .filter(t => t.type === mode.value)
    .map(t => {
      const cat = categoryStore.categories.find(c => c.id === t.categoryId)
      return { ...t, categoryIcon: cat?.icon || '📋' }
    })
    .slice(0, 6)
})

function onModeChange(m: BookingMode) {
  mode.value = m
  uiStore.setMode(m)
  selectedCategoryId.value = null
  inputValue.value = '0'
  title.value = ''
  tags.value = []
  tagInput.value = ''
  note.value = ''
  sheetOpen.value = false
}

// ── 分类：父 + 子 ──
const parents = computed<Category[]>(() => categoryStore.getParents(mode.value))
const selParent = computed<number | null>(() => {
  const id = selectedCategoryId.value
  if (id == null) return null
  const c = categoryStore.categories.find(x => x.id === id)
  if (!c) return null
  return c.parentId ?? c.id!
})
const selChild = computed<number | null>(() => {
  const id = selectedCategoryId.value
  if (id == null) return null
  const c = categoryStore.categories.find(x => x.id === id)
  return c != null && c.parentId != null ? c.id! : null
})
const childrenRows = computed<Category[]>(() => {
  const p = selParent.value
  return p == null ? [] : categoryStore.getChildren(p)
})
const selName = computed(() => {
  const id = selectedCategoryId.value
  if (id == null) return ''
  const c = categoryStore.categories.find(x => x.id === id)
  if (!c) return ''
  return c.parentId != null ? `${categoryStore.categories.find(x => x.id === c.parentId)?.name ?? ''} · ${c.name}` : c.name
})

function quickPick(p: Category) {
  const pid = p.id!
  const kids = categoryStore.getChildren(pid)
  if (kids.length === 1) selectedCategoryId.value = kids[0].id!
  else selectedCategoryId.value = pid
}
function pickParent(p: Category) {
  quickPick(p)
  if (categoryStore.getChildren(p.id!).length <= 1) sheetOpen.value = false
}
function pickChild(c: Category) {
  selectedCategoryId.value = c.id!
  sheetOpen.value = false
}

// ── 标签 ──
function addTag() {
  const t = tagInput.value.trim()
  if (t && !tags.value.includes(t)) tags.value.push(t)
  tagInput.value = ''
}
function removeTag(idx: number) { tags.value.splice(idx, 1) }

// ── 键盘 ──
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']
function press(k: string) {
  if (k === 'del') inputValue.value = inputValue.value.length <= 1 ? '0' : inputValue.value.slice(0, -1)
  else if (k === '.') { if (!inputValue.value.includes('.')) inputValue.value += '.' }
  else inputValue.value = inputValue.value === '0' ? k : (inputValue.value.length < 9 ? inputValue.value + k : inputValue.value)
}

const modeColor = computed(() => mode.value === 'expense' ? 'c-exp' : mode.value === 'income' ? 'c-inc' : '')

// ── Toast ──
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer = 0
function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastVisible.value = false }, 2000)
}

// ── 保存 ──
const pendingRuleId = ref<number | null>(null)

async function handleConfirm() {
  if (inputValue.value === '0') return
  const amount = Math.round(parseFloat(inputValue.value) * 100)
  if (isNaN(amount) || amount <= 0) return
  if (!selectedCategoryId.value) return

  const tx: Omit<Transaction, 'id'> = {
    type: mode.value,
    title: title.value,
    amount,
    categoryId: selectedCategoryId.value,
    tags: [...tags.value],
    note: note.value,
    date: selectedDate.value,
    time: selectedTime.value,
  }

  try {
    await transactionStore.addTransaction(tx)
    if (pendingRuleId.value != null) {
      const dueRule = dueRules.value.find(r => r.id === pendingRuleId.value)
      if (dueRule) await skipRule(dueRule)
      pendingRuleId.value = null
    }
    uiStore.hideBookingHint()
    showToast(`${modeLabel[mode.value]}已记录 · ${displayAmount.value}`)
    resetState()
  } catch (e) {
    console.error('记账失败', e)
  }
}

function applyTemplate(tpl: QuickTemplate) {
  const cat = categoryStore.categories.find(c => c.id === tpl.categoryId)
  if (!cat) { showToast('该分类已不存在'); return }
  mode.value = tpl.type
  uiStore.setMode(tpl.type)
  const yuan = tpl.amount / 100
  inputValue.value = yuan.toFixed(2).replace(/\.?0+$/, '') || '0'
  selectedCategoryId.value = tpl.categoryId
  title.value = tpl.title
  tags.value = [...tpl.tags]
  note.value = tpl.note
  keyboardVisible.value = false
}

// ── 周期规则 ──
function ruleCategoryIcon(rule: RecurringRule): string {
  if (!rule.categoryId) return '🗂️'
  return categoryStore.categories.find(c => c.id === rule.categoryId)?.icon || '🗂️'
}
function ruleCategoryName(rule: RecurringRule): string {
  if (!rule.categoryId) return ''
  return categoryStore.categories.find(c => c.id === rule.categoryId)?.name || ''
}
function ruleDisplayName(rule: RecurringRule): string {
  return rule.title || ruleCategoryName(rule) || '未命名规则'
}
function prefillRule(rule: RecurringRule) {
  const cat = rule.categoryId ? categoryStore.categories.find(c => c.id === rule.categoryId) : null
  if (rule.categoryId && !cat) { showToast('该分类已不存在'); return }
  mode.value = rule.type
  uiStore.setMode(rule.type)
  const yuan = rule.amount / 100
  inputValue.value = yuan.toFixed(2).replace(/\.?0+$/, '') || '0'
  selectedCategoryId.value = rule.categoryId
  title.value = rule.title
  tags.value = rule.tags ? [...rule.tags] : []
  note.value = rule.note
  keyboardVisible.value = false
  pendingRuleId.value = rule.id ?? null
  document.querySelector('.bk-screen')?.scrollTo({ top: 0, behavior: 'smooth' })
}
async function skipDue(rule: RecurringRule) {
  try { await skipRule(rule); showToast('已跳过本月') }
  catch (e) { console.error('skip recurring rule failed', e); showToast('操作失败') }
}

// ── 存为模板 ──
const promptVisible = ref(false)
const promptTitle = ref('')
const promptInitialValue = ref('')

async function saveAsTemplate() {
  try {
    const amount = Math.round(parseFloat(inputValue.value) * 100)
    if (isNaN(amount) || amount <= 0 || !selectedCategoryId.value) {
      showToast('请先输入有效金额并选择分类')
      return
    }
    const dup = await quickTemplateStore.isDuplicate({ type: mode.value, amount, categoryId: selectedCategoryId.value })
    if (dup) { showToast('该模板已存在'); return }
    promptTitle.value = '命名快记模板'
    promptInitialValue.value = title.value || ''
    promptVisible.value = true
  } catch (e) { console.error('save template failed', e); showToast('保存模板失败') }
}
async function onPromptConfirm(name: string) {
  try {
    const amount = Math.round(parseFloat(inputValue.value) * 100)
    const result = await quickTemplateStore.add({
      name,
      type: mode.value,
      amount,
      categoryId: selectedCategoryId.value!,
      title: title.value,
      tags: [...tags.value],
      note: note.value,
      sort: 0,
    })
    if (result.success) showToast('已添加快记模板')
    else if (result.duplicateMsg) showToast(result.duplicateMsg)
  } catch (e) { console.error('onPromptConfirm failed', e); showToast('保存模板失败') }
}

function resetState() {
  inputValue.value = '0'
  keyboardVisible.value = false
  sheetOpen.value = false
  selectedCategoryId.value = null
  note.value = ''
  title.value = ''
  tags.value = []
  tagInput.value = ''
  const n = new Date()
  selectedDate.value = toDateString(n)
  selectedTime.value = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

// ── TabBar 保存桥 ──
watch(canSave, (v) => {
  uiStore.bookingCanSave = v
  if (v && !keyboardVisible.value) uiStore.showBookingHint()
}, { immediate: true })
watch(keyboardVisible, (visible) => {
  if (!visible && canSave.value) uiStore.showBookingHint()
})
watch(() => uiStore.bookingSaveTrigger, () => {
  if (uiStore.bookingSaveTrigger > 0) handleConfirm()
})
</script>

<style scoped>
.bk { position: relative; height: 100%; display: flex; flex-direction: column; background: transparent; }
.bk-screen { flex: 1; overflow-y: auto; padding: 12px 24px 32px; -webkit-overflow-scrolling: touch; }

.bk-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 8px; }
.bk-undo { width: 30px; height: 30px; border: none; background: var(--act-bg); color: var(--ink2); border-radius: 999px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
.bk-date { font-size: var(--fs-small); color: var(--ink3); font-weight: 500; }
.bk-mode-tag { font-size: var(--fs-small); font-weight: 700; letter-spacing: 0.4px; padding: 4px 12px; border-radius: 999px; background: var(--act-bg); color: var(--ink2); }
.bk-mode-tag.tag-expense { color: var(--exp); background: color-mix(in srgb, var(--exp) 12%, transparent); }
.bk-mode-tag.tag-income { color: var(--inc); background: color-mix(in srgb, var(--inc) 12%, transparent); }

/* 周期待入账 */
.bk-due { margin-bottom: 10px; }
.bk-due-item { display: flex; align-items: center; gap: 8px; padding: 11px 0; }
.bk-due-item + .bk-due-item { border-top: 1px solid var(--line-soft); }
.bk-due-type { font-size: var(--fs-micro); font-weight: 700; padding: 2px 7px; border-radius: 5px; background: var(--act-bg); color: var(--ink2); flex-shrink: 0; }
.bk-due-type--expense { color: var(--exp); }
.bk-due-type--income { color: var(--inc); }
.bk-due-emoji { font-size: var(--fs-title); line-height: 1; display: inline-flex; }
.bk-due-name { flex: 1; min-width: 0; font-size: var(--fs-ui); font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bk-due-amt { font-size: var(--fs-small); color: var(--ink2); flex-shrink: 0; }
.bk-due-skip, .bk-due-go { border: 1px solid var(--line); background: none; color: var(--ink2); font-size: var(--fs-small); font-weight: 600; padding: 3px 10px; border-radius: 999px; cursor: pointer; flex-shrink: 0; }
.bk-due-go { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }

/* 全屏大金额 */
.bk-amount-zone { text-align: center; padding: 36px 0 24px; cursor: text; }
.bk-modal-hint { font-size: var(--fs-ui); font-weight: 600; color: var(--ink3); letter-spacing: 0.6px; }
.bk-amount { font-size: var(--fs-amount-xl); font-weight: 800; line-height: 1.02; margin: 12px 0 10px; letter-spacing: -0.04em; color: var(--ink); overflow: hidden; white-space: nowrap; }
.bk-amount.c-inc { color: var(--inc); }
.bk-amount.c-exp { color: var(--exp); }
.bk-tap-hint { font-size: var(--fs-small); color: var(--ink3); }

/* 日期时间 */
.bk-dt { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; }
.bk-dt-picker { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: none; color: var(--ink2); font-size: var(--fs-small); font-weight: 500; padding: 5px 13px; border-radius: 999px; cursor: pointer; }
.bk-dt-tag { color: var(--ink3); font-size: var(--fs-small); }

/* 分类触发区 */
.bk-cat-zone { margin-bottom: 24px; }
.bk-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.bk-label { font-size: var(--fs-ui); font-weight: 600; color: var(--ink2); }
.bk-open-btn { border: none; background: var(--act-bg); font-size: var(--fs-small); font-weight: 600; color: var(--ink); cursor: pointer; display: inline-flex; align-items: center; gap: 2px; padding: 6px 12px; border-radius: 999px; }
.bk-open-btn i { font-style: normal; font-size: var(--fs-body); }

.bk-prev-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.bk-tile { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 0; background: none; border: 1px solid var(--line); border-radius: 14px; cursor: pointer; transition: transform 0.12s, background 0.15s; }
.bk-tile:active { transform: scale(0.95); }
.bk-tile-icon { font-size: var(--fs-hero); line-height: 1; }
.bk-tile-name { font-size: var(--fs-small); color: var(--ink2); font-weight: 500; line-height: 1.1; }
.bk-tile.sel { background: var(--accent); border-color: var(--accent); }
.bk-tile.sel .bk-tile-name { color: var(--accent-fg); }

/* 输入折叠区 */
.bk-fields { margin-bottom: 24px; }
.bk-field { display: flex; align-items: center; gap: 12px; padding: 15px 0; }
.bk-field + .bk-field { border-top: 1px solid var(--line-soft); }
.bk-field-tag { font-size: var(--fs-ui); font-weight: 600; color: var(--ink3); flex-shrink: 0; width: 30px; }
.bk-input { flex: 1; min-width: 0; border: none; background: none; font-size: var(--fs-title); color: var(--ink); outline: none; }
.bk-input::placeholder { color: var(--ink3); }
.bk-tags { flex: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.bk-tag { display: inline-flex; align-items: center; gap: 4px; background: var(--act-bg); border-radius: 999px; padding: 4px 10px; font-size: var(--fs-small); color: var(--ink); }
.bk-tag-x { border: none; background: none; color: var(--ink3); cursor: pointer; font-size: var(--fs-ui); line-height: 1; padding: 0; }
.bk-tag-input { flex: 1; min-width: 90px; border: none; background: none; font-size: var(--fs-body); color: var(--ink); outline: none; }
.bk-tag-input::placeholder { color: var(--ink3); }

/* 快记 */
.bk-block { margin-bottom: 8px; }
.bk-tpls { display: flex; flex-wrap: wrap; gap: 8px; }
.bk-tpl { display: inline-flex; align-items: center; gap: 6px; padding: 9px 13px; border: 1px solid var(--line); border-radius: 12px; background: none; cursor: pointer; }
.bk-tpl:active { background: var(--act-bg); }
.bk-tpl-icon { font-size: var(--fs-amount); line-height: 1; }
.bk-tpl-name { font-size: var(--fs-ui); font-weight: 500; color: var(--ink); }
.bk-tpl-amt { font-size: var(--fs-small); color: var(--ink2); }
.bk-tpl-add { justify-content: center; width: 38px; height: 38px; padding: 0; }
.bk-tpl-add-icon { font-size: var(--fs-hero); color: var(--ink2); font-weight: 400; }
.bk-empty-hint { font-size: var(--fs-small); color: var(--ink3); margin-bottom: 10px; }

/* 结算栏 */
.bk-commit {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  margin: 0 24px calc(12px + env(safe-area-inset-bottom, 0px));
  padding: 16px 20px; border-radius: 16px; /* 玻璃底由全局 .glass 提供 */
  color: var(--ink); cursor: pointer;
  transition: opacity 0.15s;
}
.bk-commit.off { opacity: 0.45; }
.bk-commit-label { font-size: var(--fs-title); font-weight: 700; }
.bk-commit-amt { font-size: var(--fs-hero); font-weight: 800; }
.bk-commit-amt.c-inc { color: var(--inc); }
.bk-commit-amt.c-exp { color: var(--exp); }

/* 半屏九宫格 */
.bk-sheet-backdrop { position: fixed; inset: 0; background: var(--color-overlay, rgba(0,0,0,0.35)); z-index: 1100; display: flex; align-items: flex-end; }
.bk-sheet { width: 100%; /* 背景/描边/阴影由全局 .glass 提供 */ border-radius: 22px 22px 0 0; padding: 10px 24px 28px; }
.rs-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--ink3); opacity: 0.4; margin: 0 auto 12px; }
.bk-sheet-title { font-size: var(--fs-amount); font-weight: 700; text-align: center; margin-bottom: 18px; color: var(--ink); }
.bk-sheet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.bk-big-tile { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 0; border: 1px solid var(--line); border-radius: 16px; background: var(--bg, #f5f5f5); cursor: pointer; }
.bk-big-icon { font-size: var(--fs-amount-lg); line-height: 1; }
.bk-big-name { font-size: var(--fs-ui); font-weight: 600; color: var(--ink); }
.bk-big-tile.sel { background: var(--accent); border-color: var(--accent); }
.bk-big-tile.sel .bk-big-name { color: var(--accent-fg); }
.bk-sheet-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.bk-chip { padding: 7px 15px; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: var(--fs-ui); color: var(--ink2); cursor: pointer; }
.bk-chip.on { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); }
.bk-done { margin-top: 18px; width: 100%; height: 50px; border: none; border-radius: 14px; background: var(--accent); color: var(--accent-fg); font-size: var(--fs-title); font-weight: 700; cursor: pointer; }

/* 键盘 */
.bk-kb { position: fixed; inset: 0; background: var(--color-overlay, rgba(0,0,0,0.35)); z-index: 1100; display: flex; align-items: flex-end; }
.bk-kb-inner { width: 100%; /* background 由全局 .glass 提供 */ border-radius: 22px 22px 0 0; padding: 10px 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
.bk-kb-preview { text-align: center; font-size: var(--fs-amount-lg); font-weight: 800; padding: 6px 0 14px; color: var(--ink); }
.bk-kb-preview.c-inc { color: var(--inc); }
.bk-kb-preview.c-exp { color: var(--exp); }
.bk-kb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.bk-key { height: 52px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg, #f5f5f5); font-size: var(--fs-hero); font-weight: 500; color: var(--ink); cursor: pointer; }
.bk-key:active { background: var(--act-bg); }
.bk-kb-done { margin-top: 11px; width: 100%; height: 50px; border: none; border-radius: 12px; background: var(--accent); color: var(--accent-fg); font-size: var(--fs-title); font-weight: 700; cursor: pointer; }

.bk-toast { position: absolute; left: 50%; bottom: 160px; transform: translateX(-50%); background: var(--accent); color: var(--accent-fg); font-size: var(--fs-ui); font-weight: 600; padding: 10px 20px; border-radius: 999px; white-space: nowrap; z-index: 20; box-shadow: 0 8px 20px -8px rgba(0,0,0,0.3); }

.rs-sheet-up-enter-active, .rs-sheet-up-leave-active { transition: transform 0.24s ease, opacity 0.18s; }
.rs-sheet-up-enter-from, .rs-sheet-up-leave-to { transform: translateY(28px); opacity: 0; }
.bk-toast-enter-active { transition: opacity 0.2s ease; }
.bk-toast-leave-active { transition: opacity 0.25s ease; }
.bk-toast-enter-from, .bk-toast-leave-to { opacity: 0; }
</style>