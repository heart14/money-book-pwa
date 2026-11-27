<template>
  <CommonBottomSheet :visible="true" title="编辑交易" @close="$emit('close')">
    <div class="edit-form">
      <div class="edit-row">
        <label class="edit-label">标题</label>
        <input v-model="form.title" class="edit-input" maxlength="100" />
      </div>
      <div class="edit-row">
        <label class="edit-label">金额</label>
        <div class="edit-amount-wrap">
          <span class="edit-amount-sign">¥</span>
          <input v-model.number="form.amountYuan" class="edit-input edit-amount-input" type="number" step="0.01" min="0" />
        </div>
      </div>
      <div class="edit-row">
        <label class="edit-label">日期</label>
        <div class="edit-input edit-picker-trigger" @click="datePickerOpen = true">
          {{ form.date }}
        </div>
      </div>
      <div class="edit-row">
        <label class="edit-label">时间</label>
        <div class="edit-input edit-picker-trigger" @click="timePickerOpen = true">
          {{ form.time }}
        </div>
      </div>
      <div class="edit-row">
        <label class="edit-label">备注</label>
        <input v-model="form.note" class="edit-input" maxlength="200" />
      </div>
      <div class="edit-row">
        <label class="edit-label">标签</label>
        <div class="edit-tags-area">
          <span v-for="(tag, idx) in form.tags" :key="idx" class="edit-tag-chip">
            {{ tag }}
            <button class="edit-tag-remove" @click="form.tags.splice(idx, 1)">&times;</button>
          </span>
          <input
            v-model="tagInput"
            class="edit-tag-input"
            placeholder="添加标签"
            maxlength="20"
            @keydown.enter.prevent="addTag"
            @keydown.,.prevent="addTag"
          />
        </div>
      </div>
      <div class="edit-row edit-row--meta">
        <span class="edit-label">分类</span>
        <span class="edit-meta">
          {{ categoryName || (props.transaction.type === 'expense' ? '支出' : '收入') }}
        </span>
      </div>
    </div>

    <template #actions>
      <button class="edit-btn edit-btn--secondary" @click="$emit('close')">取消</button>
      <button class="edit-btn edit-btn--primary" :disabled="!canSave" @click="handleSave">保存</button>
    </template>

    <!-- Date/Time Pickers -->
    <DatePickerSheet v-model:visible="datePickerOpen" v-model="form.date" />
    <TimePickerSheet v-model:visible="timePickerOpen" v-model="form.time" :selected-date="form.date" />
  </CommonBottomSheet>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Transaction } from '@/types'
import CommonBottomSheet from '@/components/common/CommonBottomSheet.vue'
import DatePickerSheet from '@/components/common/DatePickerSheet.vue'
import TimePickerSheet from '@/components/common/TimePickerSheet.vue'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  (e: 'save', id: number, updates: Partial<Transaction>): void
  (e: 'close'): void
}>()

const categoryStore = useCategoryStore()

const categoryName = computed(() => {
  if (props.transaction.categoryId == null) return ''
  const cat = categoryStore.categories.find((c) => c.id === props.transaction.categoryId)
  return cat?.name ?? ''
})

const tagInput = ref('')
const datePickerOpen = ref(false)
const timePickerOpen = ref(false)

const form = reactive({
  title: props.transaction.title || '',
  amountYuan: Math.round(props.transaction.amount) / 100,
  date: props.transaction.date,
  time: props.transaction.time?.slice(0, 5) || '',
  note: props.transaction.note || '',
  tags: [...(props.transaction.tags || [])],
})

const canSave = computed(() => form.amountYuan > 0)

function addTag() {
  const t = tagInput.value.trim()
  if (t && !form.tags.includes(t)) {
    form.tags.push(t)
  }
  tagInput.value = ''
}

function handleSave() {
  if (props.transaction.id == null) return
  const updates: Partial<Transaction> = {
    title: form.title,
    amount: Math.round(form.amountYuan * 100),
    date: form.date,
    time: form.time,
    note: form.note,
    tags: [...form.tags],
  }
  emit('save', props.transaction.id, updates)
}
</script>

<style scoped>
.edit-form { margin-bottom: 20px; }

.edit-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid var(--line-soft);
}

.edit-label {
  width: 48px;
  flex-shrink: 0;
  font-size: var(--fs-body);
  color: var(--ink2);
}

.edit-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background: var(--act-bg);
  font-size: var(--fs-title);
  color: var(--ink);
  outline: none;
  font-family: inherit;
}
.edit-input:focus {
  border-color: var(--ink3);
}

.edit-amount-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--act-bg);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0 12px;
}

.edit-amount-sign { font-size: var(--fs-amount); font-weight: 600; color: var(--ink2); }

.edit-amount-input { flex: 1; background: none; border: none; padding: 0; }

.edit-amount-input::-webkit-outer-spin-button,
.edit-amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.edit-picker-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: var(--ink);
  transition: border-color 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.edit-picker-trigger:active {
  border-color: var(--ink3);
}

.edit-tags-area {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--act-bg);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  min-height: 36px;
}

.edit-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-small);
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--line-soft);
  color: var(--ink);
}

.edit-tag-remove {
  border: none;
  background: none;
  color: var(--ink3);
  font-size: var(--fs-body);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.edit-tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  background: none;
  font-size: var(--fs-ui);
  color: var(--ink);
  outline: none;
  font-family: inherit;
  padding: 2px 0;
}

.edit-tag-input::placeholder { color: var(--ink3); }

.edit-row--meta { min-height: 40px; }

.edit-meta { font-size: var(--fs-body); color: var(--ink); }

.edit-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: var(--fs-amount);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}
.edit-btn:active { opacity: 0.7; }
.edit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.edit-btn--secondary { background: var(--act-bg); color: var(--ink); }
.edit-btn--primary { background: var(--accent); color: var(--accent-fg); }
</style>