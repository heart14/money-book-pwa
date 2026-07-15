<script setup lang="ts">
import { useCategoryStore } from '@/stores/categoryStore'
import type { Category } from '@/types'

defineProps<{
  modelValue: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const catStore = useCategoryStore()

function select(cat: Category) {
  if (cat.id) emit('update:modelValue', cat.id)
}
</script>

<template>
  <div class="category-picker">
    <div
      v-for="parent in catStore.expenseTree"
      :key="parent.id"
      class="cat-group"
    >
      <div class="cat-group-title">{{ parent.icon }} {{ parent.name }}</div>
      <div class="cat-grid">
        <div
          v-for="child in parent.children"
          :key="child.id"
          :class="['cat-item', { active: modelValue === child.id }]"
          @click="select(child)"
        >
          <span class="cat-icon">{{ child.icon || '📦' }}</span>
          <span class="cat-name">{{ child.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-picker {
  padding: 8px 16px;
  max-height: 300px;
  overflow-y: auto;
}
.cat-group {
  margin-bottom: 12px;
}
.cat-group-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  font-weight: 600;
}
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 8px;
  background: #f7f8fa;
  cursor: pointer;
}
.cat-item.active {
  background: #1989fa;
  color: #fff;
}
.cat-icon {
  font-size: 20px;
  margin-bottom: 4px;
}
.cat-name {
  font-size: 11px;
}
</style>