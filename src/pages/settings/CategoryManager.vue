<template>
  <div>
    <button class="section-row" @click="expanded = !expanded">
      <div class="row-left"><span class="row-icon"><TwemojiIcon emoji="📂" /></span><span class="row-label">管理分类</span></div>
      <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink3)" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <div v-if="expanded" class="expanded-content">
      <div v-if="categoryStore.categories.length === 0" class="empty-hint">暂无分类</div>
      <div v-for="cat in parentCategories" :key="cat.id" class="category-item">
        <div class="category-parent" @click="toggleChildren(cat.id!)">
          <span class="category-icon"><TwemojiIcon :emoji="cat.icon" /></span>
          <span class="category-name">{{ cat.name }}</span>
          <svg class="chevron small" :class="{ rotated: expandedIds.has(cat.id!) }" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--ink3)" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
        <div v-if="expandedIds.has(cat.id!)" class="category-children">
          <div v-for="child in getChildren(cat.id!)" :key="child.id" class="category-child">
            <span class="category-icon small"><TwemojiIcon :emoji="child.icon" /></span>
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
import TwemojiIcon from '@/components/common/TwemojiIcon.vue'

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
/* ═ 沉浸式 ═ */

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: var(--fs-title);
  color: var(--ink);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
}
.section-row:active { background: none; }

.row-left { display: flex; align-items: center; gap: 11px; }
.row-icon { font-size: var(--fs-heading); line-height: 1; }
.row-label { font-size: var(--fs-title); font-weight: 600; color: var(--ink); }

.chevron { color: var(--ink3); flex-shrink: 0; transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }
.chevron.small { width: 14px; height: 14px; }

.expanded-content { padding: 6px 0 10px; border-top: 1px solid var(--line-soft); }
.empty-hint { text-align: center; padding: 16px; font-size: var(--fs-body); color: var(--ink3); }
.empty-hint.small { padding: 8px; font-size: var(--fs-small); }

.category-item { margin-bottom: 4px; }
.category-item + .category-item { border-top: 1px solid var(--line-soft); }
.category-parent { display: flex; align-items: center; gap: 10px; padding: 11px 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.category-icon { font-size: var(--fs-heading); width: 24px; text-align: center; }
.category-icon.small { font-size: var(--fs-ui); }
.category-name { flex: 1; font-size: var(--fs-body); font-weight: 500; color: var(--ink); }
.category-children { padding-left: 26px; border-top: 1px solid var(--line-soft); }
.category-child { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
.category-child + .category-child { border-top: 1px solid var(--line-soft); }
</style>