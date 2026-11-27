<template>
  <CommonBottomSheet :visible="visible" :title="isEdit ? '编辑日记' : '写日记'" @close="$emit('close')">
    <!-- 日期行 -->
    <button class="di-date-row" @click="showDatePicker = true">
      <span class="di-date-label">日期</span>
      <span class="di-date-value">
        {{ formatDate(draftDate) }}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink3, #9aa3ac);">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </span>
    </button>
    <p v-if="dateError" class="di-date-error">{{ dateError }}</p>

    <!-- 内容编辑 -->
    <textarea
      ref="contentInput"
      v-model="draftContent"
      class="di-content-input"
      :placeholder="contentPlaceholder"
      rows="6"
    ></textarea>
    <div class="di-content-count">{{ draftContent.length }} 字</div>

    <template #actions>
      <button v-if="isEdit" class="di-btn di-btn--delete" @click="showDeleteConfirm = true">删除</button>
      <button class="di-btn di-btn--secondary" @click="$emit('close')">取消</button>
      <button class="di-btn di-btn--primary" :disabled="!canSave" @click="onSave">保存</button>
    </template>

    <!-- 日期选择 -->
    <DatePickerSheet
      :visible="showDatePicker"
      :model-value="draftDate"
      @update:model-value="draftDate = $event"
      @update:visible="showDatePicker = $event"
    />

    <!-- 删除确认 -->
    <ConfirmDialog
      :visible="showDeleteConfirm"
      title="删除这篇日记"
      message="确定要删除这篇日记吗？此操作无法撤销。"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="onDelete"
      @update:visible="showDeleteConfirm = $event"
    />
  </CommonBottomSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Diary } from '@/types'
import { db } from '@/db'
import { formatDate, toDateString } from '@/utils/format'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'
import DatePickerSheet from '@/components/common/DatePickerSheet.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  /** 传入日记则编辑，否则新建 */
  diary?: Diary | null
}>(), {
  diary: null,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { id?: number; date: string; content: string }): void
  (e: 'delete', id: number): void
}>()

const isEdit = computed(() => props.diary != null)

const draftDate = ref(toDateString(new Date()))
const draftContent = ref('')
const contentInput = ref<HTMLTextAreaElement | null>(null)
const showDatePicker = ref(false)
const showDeleteConfirm = ref(false)
const dateError = ref('')

const contentPlaceholder = computed(() =>
  isEdit.value ? '修改这篇日记…' : '此刻的心情或想说的话…',
)

const canSave = computed(() => draftContent.value.trim().length > 0)

watch(() => props.visible, (open) => {
  if (open) {
    if (props.diary) {
      draftDate.value = props.diary.date
      draftContent.value = props.diary.content
    } else {
      draftDate.value = toDateString(new Date())
      draftContent.value = ''
    }
    dateError.value = ''
    showDatePicker.value = false
    showDeleteConfirm.value = false
    nextTick(() => contentInput.value?.focus())
  } else {
    showDeleteConfirm.value = false
  }
})

async function onSave() {
  if (!canSave.value) return
  // 一天一条：目标日期是否已被另一篇日记占用
  dateError.value = ''
  const occupied = await db.diaries.where('date').equals(draftDate.value).first()
  if (occupied && occupied.id !== props.diary?.id) {
    dateError.value = '这一天已有一篇日记（每篇 1 天）'
    return
  }
  emit('save', {
    id: props.diary?.id,
    date: draftDate.value,
    content: draftContent.value.trim(),
  })
  emit('close')
}

function onDelete() {
  if (!props.diary?.id) return
  emit('delete', props.diary.id)
  showDeleteConfirm.value = false
  emit('close')
}
</script>

<style scoped>
.di-date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 0;
  margin-bottom: 4px;
  border: none;
  background: none;
  border-bottom: 1px solid var(--line-soft, rgba(22, 24, 28, 0.06));
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.di-date-label {
  font-size: var(--fs-body, 14px);
  color: var(--ink2, #5d6570);
  font-weight: 500;
}
.di-date-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-title, 15px);
  font-weight: 600;
  color: var(--ink, #16181c);
}

.di-content-input {
  width: 100%;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid var(--line-soft, rgba(22, 24, 28, 0.06));
  border-radius: 12px;
  background: var(--act-bg, rgba(22, 24, 28, 0.05));
  font-family: inherit;
  font-size: var(--fs-body, 14px);
  line-height: 1.6;
  color: var(--ink, #16181c);
  resize: none;
  box-sizing: border-box;
  outline: none;
}
.di-content-input:focus {
  border-color: var(--ink3, #9aa3ac);
}
.di-content-input::placeholder {
  color: var(--ink3, #9aa3ac);
}
.di-content-count {
  text-align: right;
  font-size: var(--fs-small, 12px);
  color: var(--ink3, #9aa3ac);
  margin-top: 6px;
}

.di-date-error {
  font-size: var(--fs-small, 12px);
  color: var(--exp, #d5503c);
  margin: 4px 0 0;
}

.di-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: var(--fs-amount, 16px);
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
  font-family: inherit;
}
.di-btn:active { opacity: 0.7; }
.di-btn:disabled { opacity: 0.45; cursor: default; }
.di-btn--delete {
  flex: 0 0 auto;
  padding: 0 14px;
  background: transparent;
  color: var(--exp, #d5503c);
}
.di-btn--secondary { background: var(--act-bg, rgba(22, 24, 28, 0.05)); color: var(--ink, #16181c); }
.di-btn--primary { background: var(--accent, #16181c); color: var(--accent-fg, #ffffff); }
</style>