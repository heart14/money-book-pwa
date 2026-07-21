<template>
  <Teleport to="body">
    <div v-if="visible" class="sheet-overlay" @click.self="$emit('close')">
      <div class="sheet">
        <div class="sheet-handle" />
        <div class="sheet-header" v-if="title">
          <h3 class="sheet-title">{{ title }}</h3>
        </div>
        <div class="sheet-body">
          <slot />
        </div>
        <div v-if="$slots.actions" class="sheet-actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  title?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
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
  background: #fff;
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  max-height: 85vh;
  overflow-y: auto;
  padding: 8px 24px 32px;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #d1d1d6;
  margin: 0 auto 12px;
}

.sheet-header {
  margin-bottom: 20px;
}

.sheet-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  color: var(--color-text);
}

.sheet-body {
  margin-bottom: 20px;
}

.sheet-body:last-child {
  margin-bottom: 0;
}

.sheet-actions {
  display: flex;
  gap: 12px;
}
</style>