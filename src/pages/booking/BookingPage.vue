<template>
  <div class="booking-page">
    <div class="booking-content" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <!-- Mode Switch centered -->
      <div class="mode-switch-wrapper">
        <ModeSwitch v-model="bookingMode" @update:model-value="onModeChange" />
      </div>

      <!-- Amount Display -->
      <div class="amount-display" @click="keyboardVisible = true">{{ displayAmount }}</div>

      <!-- Animated content area -->
      <Transition name="mode-fade" mode="out-in">
        <div :key="bookingMode" class="mode-content">
          <!-- Category Picker -->
          <CategoryPicker
            :type="bookingMode"
            :selected-category-id="selectedCategoryId"
            @select="onCategorySelect"
          />

          <!-- Title Input -->
          <div class="note-section">
            <input
              v-model="title"
              class="note-input"
              type="text"
              placeholder="添加标题"
              maxlength="100"
            />
          </div>

          <!-- Tags Input -->
          <div class="tags-section">
            <div class="tags-chips">
              <span
                v-for="(tag, idx) in tags"
                :key="idx"
                class="tag-chip"
              >
                {{ tag }}
                <button class="tag-remove" @click="removeTag(idx)">&times;</button>
              </span>
              <input
                v-model="tagInput"
                class="tag-input"
                type="text"
                placeholder="添加标签（可选）"
                maxlength="20"
                @keydown.enter.prevent="addTag"
                @keydown.,.prevent="addTag"
              />
            </div>
          </div>

          <!-- Note Input -->
          <div class="note-section">
            <input
              v-model="note"
              class="note-input"
              type="text"
              placeholder="添加备注（可选）"
              maxlength="200"
            />
          </div>
        </div>
      </Transition>

      <!-- Quick Template Bubbles -->
      <div v-if="displayBubbles.length > 0" class="quick-tpl-section">
        <div class="quick-tpl-label">快记</div>
        <div class="quick-tpl-bubbles">
          <button
            v-for="tpl in visibleBubbles"
            :key="tpl.id"
            class="quick-tpl-bubble"
            @click="applyTemplate(tpl)"
          >
            <span class="tpl-icon">{{ tpl.categoryIcon }}</span>
            <span class="tpl-name">{{ tpl.name }}</span>
            <span class="tpl-amount">{{ formatShortCurrency(tpl.amount) }}</span>
          </button>
          <button
            v-if="hasMoreBubbles"
            class="quick-tpl-bubble quick-tpl-more"
            @click="onBubbleExpandToggle"
          >
            <span class="tpl-more-text">{{ bubbleExpanded ? '收起' : `+${displayBubbles.length - 4}` }}</span>
          </button>
          <button class="quick-tpl-bubble quick-tpl-add" @click="saveAsTemplate" title="保存当前为模板">
            <span class="tpl-add-icon">+</span>
          </button>
        </div>
      </div>
      <div v-else class="quick-tpl-section quick-tpl-empty">
        <button class="quick-tpl-bubble quick-tpl-add" @click="saveAsTemplate" title="保存当前为模板">
          <span class="tpl-add-icon">+</span>
        </button>
      </div>
    </div>

    <!-- Number Keyboard -->
    <NumberKeyboard
      :value="inputValue"
      :visible="keyboardVisible"
      @update:value="inputValue = $event"
      @close="keyboardVisible = false"
    />

    <!-- Save Toast -->
    <Transition name="toast">
      <div v-if="toastVisible" class="save-toast">{{ toastMessage }}</div>
    </Transition>

    <!-- Quick Template Prompt -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useUiStore, type BookingMode } from '@/stores/uiStore'
import type { Transaction } from '@/types'
import ModeSwitch from '@/components/booking/ModeSwitch.vue'
import NumberKeyboard from '@/components/booking/NumberKeyboard.vue'
import CategoryPicker from '@/components/booking/CategoryPicker.vue'
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import PromptDialog from '@/components/common/PromptDialog.vue'
import { formatShortCurrency } from '@/utils/format'
import type { QuickTemplate } from '@/types'

const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()
const uiStore = useUiStore()
const quickTemplateStore = useQuickTemplateStore()

// Swipe mode order
const modeOrder: BookingMode[] = ['income', 'expense', 'transfer']

// ── State ──
const bookingMode = ref<BookingMode>(uiStore.bookingMode)
const inputValue = ref('0')
const keyboardVisible = ref(false)
const selectedCategoryId = ref<number | null>(null)
const note = ref('')
const title = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')

// Touch swipe state
let touchStartX = 0

// ── Computed ──
const displayAmount = computed(() => {
  const v = inputValue.value
  if (v === '0') return '¥0.00'

  if (v.includes('.')) {
    const [intPart, decPart = ''] = v.split('.')
    const formattedInt = intPart ? parseInt(intPart).toLocaleString('zh-CN') : '0'
    if (decPart === '') {
      return `¥${formattedInt}.00`
    }
    return `¥${formattedInt}.${decPart.padEnd(2, '0')}`
  }

  return `¥${parseInt(v).toLocaleString('zh-CN')}`
})

const canSave = computed(() => {
  if (inputValue.value === '0') return false
  const amount = Math.round(parseFloat(inputValue.value) * 100)
  if (isNaN(amount) || amount <= 0) return false
  return selectedCategoryId.value != null
})

// ── Quick Template Bubbles ──
const displayBubbles = computed(() => {
  return quickTemplateStore.templates
    .filter(t => t.type === bookingMode.value)
    .map(t => {
      const cat = categoryStore.categories.find(c => c.id === t.categoryId)
      return { ...t, categoryIcon: cat?.icon || '📋' }
    })
    .slice(0, 6) // 最多 6 个
})

const bubbleExpanded = ref(false)
const showBubbleLimit = computed(() => bubbleExpanded.value ? displayBubbles.value.length : 4)
const visibleBubbles = computed(() => displayBubbles.value.slice(0, showBubbleLimit.value))
const hasMoreBubbles = computed(() => displayBubbles.value.length > 4)

// ── Swipe handlers ──
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  const deltaX = touch.clientX - touchStartX
  const absDelta = Math.abs(deltaX)
  if (absDelta < 50) return

  const idx = modeOrder.indexOf(bookingMode.value)
  if (deltaX < 0 && idx < modeOrder.length - 1) {
    onModeChange(modeOrder[idx + 1])
  } else if (deltaX > 0 && idx > 0) {
    onModeChange(modeOrder[idx - 1])
  }
}

// ── Mode change ──
function onModeChange(mode: BookingMode) {
  bookingMode.value = mode
  uiStore.setMode(mode)
  selectedCategoryId.value = null
}

// ── Category selection ──
function onCategorySelect(categoryId: number) {
  selectedCategoryId.value = categoryId
  keyboardVisible.value = false
}

// ── Tags ──
function addTag() {
  const t = tagInput.value.trim()
  if (t && !tags.value.includes(t)) {
    tags.value.push(t)
  }
  tagInput.value = ''
}

function removeTag(idx: number) {
  tags.value.splice(idx, 1)
}

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

// ── Confirm (submit transaction) ──
async function handleConfirm() {
  if (inputValue.value === '0') return

  const amount = Math.round(parseFloat(inputValue.value) * 100)
  if (isNaN(amount) || amount <= 0) return
  if (!selectedCategoryId.value) return

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const tx: Omit<Transaction, 'id'> = {
    type: bookingMode.value,
    title: title.value,
    amount,
    categoryId: selectedCategoryId.value,
    tags: [...tags.value],
    note: note.value,
    date: dateStr,
    time: timeStr,
  }

  try {
    await transactionStore.addTransaction(tx)
    uiStore.hideBookingHint()
    const typeLabel = bookingMode.value === 'expense' ? '支出' : bookingMode.value === 'income' ? '收入' : '转账'
    showToast(`${typeLabel}已记录 · ${displayAmount.value}`)
    resetState()
  } catch (e) {
    console.error('记账失败', e)
  }
}

// ── Quick Template Functions ──
function applyTemplate(tpl: QuickTemplate) {
  // 校验分类是否存在
  const cat = categoryStore.categories.find(c => c.id === tpl.categoryId)
  if (!cat) {
    showToast('该分类已不存在')
    return
  }

  bookingMode.value = tpl.type
  uiStore.setMode(tpl.type)

  // 金额：从分反算回元显示
  const yuan = tpl.amount / 100
  inputValue.value = yuan.toFixed(2).replace(/\.?0+$/, '') || '0'

  selectedCategoryId.value = tpl.categoryId
  title.value = tpl.title
  tags.value = [...tpl.tags]
  note.value = tpl.note
  keyboardVisible.value = false
}

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

    // 检查内容重复
    const dup = await quickTemplateStore.isDuplicate({
      type: bookingMode.value,
      amount,
      categoryId: selectedCategoryId.value,
    })
    if (dup) {
      showToast('该模板已存在')
      return
    }

    promptTitle.value = '命名快记模板'
    promptInitialValue.value = title.value || ''
    promptVisible.value = true
  } catch (e) {
    console.error('save template failed', e)
    showToast('保存模板失败')
  }
}

async function onPromptConfirm(name: string) {
  try {
    const amount = Math.round(parseFloat(inputValue.value) * 100)
    const result = await quickTemplateStore.add({
      name: name,
      type: bookingMode.value,
      amount,
      categoryId: selectedCategoryId.value!,
      title: title.value,
      tags: [...tags.value],
      note: note.value,
      sort: 0, // add() 会自动分配
    })
    if (result.success) {
      showToast('已添加快记模板')
    } else if (result.duplicateMsg) {
      showToast(result.duplicateMsg)
    }
  } catch (e) {
    console.error('onPromptConfirm failed', e)
    showToast('保存模板失败')
  }
}

function onBubbleExpandToggle() {
  bubbleExpanded.value = !bubbleExpanded.value
}

function resetState() {
  inputValue.value = '0'
  keyboardVisible.value = false
  selectedCategoryId.value = null
  note.value = ''
  title.value = ''
  tags.value = []
  tagInput.value = ''
}

// ── Bridge to TabBar checkmark save ──
watch(canSave, (v) => {
  uiStore.bookingCanSave = v
  if (v && !keyboardVisible.value) {
    uiStore.showBookingHint()
  }
}, { immediate: true })

watch(keyboardVisible, (visible) => {
  if (!visible && canSave.value) {
    uiStore.showBookingHint()
  }
})

watch(
  () => uiStore.bookingSaveTrigger,
  () => {
    if (uiStore.bookingSaveTrigger > 0) handleConfirm()
  },
)
</script>

<style scoped>
.booking-page {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.booking-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 280px;
  -webkit-overflow-scrolling: touch;
}

/* ── Mode Switch ── */
.mode-switch-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

/* ── Amount Display ── */
.amount-display {
  text-align: center;
  font-size: 60px;
  font-weight: 700;
  color: #1c1c1e;
  letter-spacing: -1px;
  line-height: 1.2;
  margin-bottom: 12px;
  font-variant-numeric: tabular-nums;
  cursor: text;
}

/* ── Tags Input ── */
.tags-section {
  margin-bottom: 12px;
  margin-top: 16px;
}

.tags-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e9e9ed;
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

.tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: #c7c7cc;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.tag-remove:active {
  background: #8e8e93;
}

.tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text);
  outline: none;
}

.tag-input::placeholder {
  color: var(--color-secondary-text);
}

/* ── Note Input ── */
.note-section {
  margin-bottom: 20px;
}

.note-input {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-family: inherit;
  font-size: 14px;
  color: #1c1c1e;
  outline: none;
}

.note-input::placeholder {
  color: var(--color-secondary-text);
}

/* ── Mode fade transition ── */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}

/* ── Save Toast ── */
.save-toast {
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
  -webkit-backdrop-filter: blur(4px);
}

.toast-enter-active {
  transition: all 0.25s ease;
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0px);
}

/* ── Quick Template Bubbles ── */
.quick-tpl-section {
  padding: 12px 0 4px;
}

.quick-tpl-label {
  font-size: 12px;
  color: var(--color-secondary-text, #8e8e93);
  margin-bottom: 8px;
}

.quick-tpl-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.quick-tpl-bubble {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 13px;
  color: var(--color-text, #1c1c1e);
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  white-space: nowrap;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
}

.quick-tpl-bubble:active {
  background: #e5e5ea;
}

.tpl-icon {
  font-size: 14px;
  line-height: 1;
}

.tpl-name {
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-amount {
  font-weight: 600;
  color: var(--color-primary, #007aff);
  font-variant-numeric: tabular-nums;
}

.quick-tpl-more {
  background: transparent;
  box-shadow: none;
  font-weight: 500;
  color: var(--color-secondary-text, #8e8e93);
}

.quick-tpl-add {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
}

.tpl-add-icon {
  font-size: 18px;
  font-weight: 300;
  color: var(--color-secondary-text, #8e8e93);
  line-height: 1;
}

.quick-tpl-empty {
  padding: 8px 0;
  display: flex;
  justify-content: flex-end;
}
</style>