<template>
  <Teleport to="body">
    <div v-if="visible" class="prompt-overlay" @click.self="onCancel">
      <div class="prompt-dialog">
        <h3 class="prompt-title">{{ title }}</h3>
        <input
          ref="inputRef"
          v-model="inputValue"
          class="prompt-input"
          :placeholder="placeholder"
          maxlength="50"
          @keydown.enter.prevent="onConfirm"
        />
        <div class="prompt-actions">
          <button class="prompt-btn prompt-btn--cancel" @click="onCancel">取消</button>
          <button class="prompt-btn prompt-btn--confirm" @click="onConfirm">{{ confirmText || '确认' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title: string
  initialValue?: string
  placeholder?: string
  confirmText?: string
}>(), {
  initialValue: '',
  placeholder: '请输入名称',
  confirmText: '确认',
})

const emit = defineEmits<{
  (e: 'confirm', value: string): void
  (e: 'cancel'): void
  (e: 'update:visible', v: boolean): void
}>()

const inputRef = ref<HTMLInputElement>()
const inputValue = ref(props.initialValue)

watch(() => props.visible, (v) => {
  if (v) {
    inputValue.value = props.initialValue
    nextTick(() => inputRef.value?.focus())
  }
})

function onConfirm() {
  const val = inputValue.value.trim()
  if (!val) return
  emit('confirm', val)
  emit('update:visible', false)
}

function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.prompt-dialog {
  width: 280px;
  background: var(--color-card, rgba(255,255,255,0.95));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-lg, 14px);
  padding: 24px;
  animation: fadeIn 0.2s ease;
}

.prompt-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text, #1c1c1e);
  text-align: center;
  margin-bottom: 16px;
}

.prompt-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-separator, rgba(60,60,67,0.08));
  border-radius: var(--radius-sm, 8px);
  background: #f2f2f6;
  font-size: 15px;
  color: var(--color-text, #1c1c1e);
  outline: none;
  font-family: inherit;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.prompt-input:focus {
  border-color: var(--color-primary, #007aff);
  background: #fff;
}

.prompt-actions {
  display: flex;
  gap: 12px;
}

.prompt-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: var(--radius-sm, 8px);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}

.prompt-btn:active {
  opacity: 0.7;
}

.prompt-btn--cancel {
  background: #f2f2f6;
  color: var(--color-text, #1c1c1e);
}

.prompt-btn--confirm {
  background: var(--color-primary, #007aff);
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>