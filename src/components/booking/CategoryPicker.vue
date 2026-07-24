<template>
  <div class="category-picker">
    <!-- "选择分类" label -->
    <div class="picker-label">选择分类</div>

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
  type: 'expense' | 'income' | 'transfer'
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
  const childList = categoryStore.getChildren(parent.id!)
  if (childList.length === 1) {
    selectChild(childList[0])
  }
}

function selectChild(child: Category) {
  selectedChildId.value = child.id ?? null
  emit('select', child.id!)
}

// Sync internal selection state from external prop
watch(
  () => props.selectedCategoryId,
  (newId) => {
    if (newId === null) {
      selectedParentId.value = null
      selectedChildId.value = null
      return
    }
    const cat = categoryStore.categories.find((c: Category) => c.id === newId)
    if (!cat) return
    if (cat.parentId === null) {
      selectedParentId.value = cat.id!
      selectedChildId.value = null
    } else {
      selectedParentId.value = cat.parentId
      selectedChildId.value = cat.id!
    }
  },
  { immediate: true },
)

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
  margin-bottom: 12px;
}

.picker-label {
  font-size: 13px;
  color: #8e8e93;
  margin-bottom: 8px;
  padding: 0 4px;
}

.parent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.parent-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 0;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.parent-item.selected {
  background: #007aff;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
}

.parent-item.selected .parent-icon,
.parent-item.selected .parent-name {
  color: #fff;
}

.parent-icon {
  font-size: 22px;
  line-height: 1;
  margin-bottom: 2px;
}

.parent-name {
  font-size: 11px;
  color: #1c1c1e;
  font-weight: 500;
  line-height: 1.2;
}

.children-bar {
  display: flex;
  align-items: center;
  gap: 8px;
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
  border: none;
  border-radius: 16px;
  background: #f2f2f7;
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
}
</style>