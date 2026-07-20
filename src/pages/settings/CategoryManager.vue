<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon">📂</span><span class="row-label">管理分类</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <div v-if="expanded" class="expanded-content">
      <div v-if="categoryStore.categories.length === 0" class="empty-hint">暂无分类</div>
      <div v-for="cat in parentCategories" :key="cat.id" class="category-item">
        <div class="category-parent" @click="toggleChildren(cat.id!)">
          <span class="category-icon">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.name }}</span>
          <svg class="chevron small" :class="{ rotated: expandedIds.has(cat.id!) }" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#c7c7cc" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
        <div v-if="expandedIds.has(cat.id!)" class="category-children">
          <div v-for="child in getChildren(cat.id!)" :key="child.id" class="category-child">
            <span class="category-icon small">{{ child.icon }}</span>
            <span class="category-name">{{ child.name }}</span>
          </div>
          <div v-if="getChildren(cat.id!).length === 0" class="empty-hint small">无子分类</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Category } from '@/types'

const categoryStore = useCategoryStore()

const expanded = ref(false)
const expandedIds = ref(new Set<number>())

const parentCategories = computed(() =>
  categoryStore.categories.filter((c: Category) => c.parentId === null)
)

function getChildren(parentId: number): Category[] {
  return categoryStore.categories.filter((c: Category) => c.parentId === parentId)
}

function toggleChildren(id: number) {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id)
  else expandedIds.value.add(id)
}
</script>

<style scoped>
.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 15px;
  color: #1c1c1e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
  transition: background 0.1s;
}
.section-row:active { background: rgba(0,0,0,0.03); }

.row-left { display: flex; align-items: center; gap: 10px; }
.row-icon { font-size: 18px; line-height: 1; }
.row-label { font-size: 15px; color: #1c1c1e; }

.chevron { color: #c7c7cc; flex-shrink: 0; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }
.chevron.small { width: 14px; height: 14px; }

.expanded-content { padding: 4px 14px 12px; }
.empty-hint { text-align: center; padding: 12px; font-size: 14px; color: #8e8e93; }
.empty-hint.small { padding: 8px; font-size: 12px; }

.category-item { margin-bottom: 4px; }
.category-parent { display: flex; align-items: center; gap: 8px; padding: 8px 4px; cursor: pointer; }
.category-icon { font-size: 16px; width: 24px; text-align: center; }
.category-icon.small { font-size: 13px; }
.category-name { flex: 1; font-size: 14px; color: #1c1c1e; }
.category-children { padding-left: 12px; }
.category-child { display: flex; align-items: center; gap: 6px; padding: 4px 0; }
</style>