<template>
  <Teleport to="body">
    <div class="sheet-overlay" @click.self="$emit('close')">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-body">
          <h3 class="edit-sheet-title">编辑交易</h3>
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
              <input v-model="form.date" class="edit-input" type="date" />
            </div>
            <div class="edit-row">
              <label class="edit-label">时间</label>
              <input v-model="form.time" class="edit-input" type="time" />
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
              <span class="edit-meta">{{ categoryName }}</span>
            </div>
          </div>
          <div class="edit-actions">
            <button class="btn btn-secondary" @click="$emit('close')">取消</button>
            <button class="btn btn-primary" :disabled="!canSave" @click="handleSave">保存</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Transaction } from '@/types'

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
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.sheet {
  width: 100%;
  max-width: 480px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  max-height: 85vh;
  overflow-y: auto;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d1d1d6;
  margin: 8px auto 0;
}

.sheet-body { padding: 16px 24px 32px; }

.edit-sheet-title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #1c1c1e;
}

.edit-form { margin-bottom: 24px; }

.edit-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.edit-label { width: 48px; flex-shrink: 0; font-size: 14px; color: #8e8e93; }

.edit-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: #f2f2f6;
  font-size: 15px;
  color: #1c1c1e;
  outline: none;
  font-family: inherit;
}

.edit-amount-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f2f2f6;
  border-radius: 8px;
  padding: 0 12px;
}

.edit-amount-sign { font-size: 16px; font-weight: 600; color: #8e8e93; }

.edit-amount-input { flex: 1; background: none; padding: 0; }

.edit-amount-input::-webkit-outer-spin-button,
.edit-amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.edit-tags-area {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #f2f2f6;
  border-radius: 8px;
  min-height: 36px;
}

.edit-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fff;
  color: #007aff;
}

.edit-tag-remove {
  border: none;
  background: none;
  color: #8e8e93;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.edit-tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  background: none;
  font-size: 13px;
  color: #1c1c1e;
  outline: none;
  font-family: inherit;
  padding: 2px 0;
}

.edit-tag-input::placeholder { color: #c7c7cc; }

.edit-row--meta {
  padding: 4px 0;
  border-top: 1px solid #f2f2f2;
  margin-top: 4px;
  padding-top: 12px;
}

.edit-meta { font-size: 14px; color: #1c1c1e; }

.edit-actions { display: flex; gap: 12px; }

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}
.btn:active { opacity: 0.7; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary { background: #f2f2f6; color: #1c1c1e; }
.btn-primary { background: #007aff; color: #fff; }

</style>