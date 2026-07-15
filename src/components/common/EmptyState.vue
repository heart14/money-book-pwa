<template>
  <div class="empty-state">
    <div class="empty-state-icon">{{ icon }}</div>
    <p class="empty-state-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  message: string
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}

.empty-state-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 12px;
}

.empty-state-message {
  font-size: 14px;
  color: #8e8e93;
  text-align: center;
}
</style>