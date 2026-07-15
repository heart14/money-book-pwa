<template>
  <div class="category-picker">
    <!-- Level 1: Parent grid -->
    <div class="parent-grid">
      <button
        v-for="parent in parents"
        :key="parent.id"
        class="parent-item"
        :class="{ selected: selectedParentId === parent.id }"
        @click="selectParent(parent)"
      >
        <span class="parent-icon">{{ parent.icon || '📁' }}</span>
        <span class="parent-name">{{ parent.name }}</span>
      </button>
    </div>

    <!-- Level 2: Children chips -->
    <div v-if="children.length > 0" class="children-bar">
      <span class="children-label">子分类</span>
      <div class="children-scroll">
        <button
          v-for="child in children"
          :key="child.id"
          class="child-chip"
          :class="{ active: selectedChildId === child.id }"
          @click="selectChild(child)"
        >
          {{ child.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Category } from '@/types'

const props = defineProps<{
  type: 'expense' | 'income'
  selectedCategoryId: number | null
}>()

const emit = defineEmits<{
  select: [categoryId: number]
}>()

const categoryStore = useCategoryStore()

const selectedParentId = ref<number | null>(null)
const selectedChildId = ref<number | null>(null)

const parents = computed<Category[]>(() => {
  return categoryStore.getParents(props.type)
})

const children = computed<Category[]>(() => {
  if (selectedParentId.value === null) return []
  return categoryStore.getChildren(selectedParentId.value)
})

function selectParent(parent: Category) {
  selectedParentId.value = parent.id ?? null
  selectedChildId.value = null

  // Auto-select if parent has exactly 1 child
  const childList = categoryStore.getChildren(parent.id!)
  if (childList.length === 1) {
    selectChild(childList[0])
  }
}

function selectChild(child: Category) {
  selectedChildId.value = child.id ?? null
  emit('select', child.id!)
}

// Reset when type changes
watch(
  () => props.type,
  () => {
    selectedParentId.value = null
    selectedChildId.value = null
  },
)
</script>

<style scoped>
.category-picker {
  width: 100%;
}

.parent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.parent-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.parent-item.selected {
  border-color: #007aff;
  background: rgba(0, 122, 255, 0.08);
}

.parent-icon {
  font-size: 24px;
  line-height: 1;
}

.parent-name {
  font-size: 12px;
  color: #1c1c1e;
  font-weight: 500;
  line-height: 1.2;
}

.children-bar {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.children-label {
  font-size: 12px;
  color: #8e8e93;
  white-space: nowrap;
  flex-shrink: 0;
}

.children-scroll {
  overflow-x: auto;
  white-space: nowrap;
  display: flex;
  gap: 6px;
  flex: 1;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.children-scroll::-webkit-scrollbar {
  display: none;
}

.child-chip {
  display: inline-flex;
  padding: 6px 14px;
  border: 1px solid rgba(60, 60, 67, 0.12);
  border-radius: 16px;
  background: #fff;
  color: #1c1c1e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  font-family: inherit;
}

.child-chip.active {
  background: #007aff;
  color: #fff;
  border-color: #007aff;
}
</style>