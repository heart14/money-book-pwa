<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click.self="onCancel">
      <div class="confirm-content">
        <p v-if="title" class="confirm-title">{{ title }}</p>
        <p class="confirm-desc">{{ message }}</p>
        <div class="confirm-actions" :class="{ column: layout === 'column' }">
          <slot name="actions">
            <button
              v-if="cancelText"
              class="confirm-btn confirm-btn--cancel"
              @click="onCancel"
            >{{ cancelText }}</button>
            <button
              class="confirm-btn confirm-btn--confirm"
              :class="`confirm-btn--${confirmType}`"
              @click="onConfirm"
            >{{ confirmText }}</button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmType?: 'primary' | 'danger'
  layout?: 'row' | 'column'
}>(), {
  confirmText: '确定',
  cancelText: '取消',
  confirmType: 'primary',
  layout: 'row',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:visible', v: boolean): void
}>()

function onConfirm() {
  emit('confirm')
  emit('update:visible', false)
}

function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.confirm-content {
  width: 280px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
}

.confirm-title {
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
  color: var(--color-text, #1c1c1e);
}

.confirm-desc {
  font-size: 14px;
  color: var(--color-secondary-text, #8e8e93);
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.4;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-actions.column {
  flex-direction: column;
}

.confirm-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.confirm-btn:active {
  opacity: 0.7;
}

.confirm-btn--cancel {
  background: #f2f2f6;
  color: var(--color-text, #1c1c1e);
}

.confirm-btn--primary {
  background: #007aff;
  color: #fff;
}

.confirm-btn--danger {
  background: #ff3b30;
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>