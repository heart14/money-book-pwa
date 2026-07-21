<template>
  <div class="filter-chips">
    <button
      class="chip"
      :class="{ active: selectedId === null }"
      @click="$emit('select', null)"
    >
      全部
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      class="chip"
      :class="{
        active: selectedId === cat.id,
        contextual: contextId === cat.id && selectedId !== cat.id,
      }"
      @click="$emit('select', cat.id)"
    >
      <span class="chip-icon">{{ cat.icon }}</span>
      {{ cat.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  categories: Array<{ id: number; name: string; icon: string }>
  selectedId: number | null
  /** 当子分类选中时，传父分类 ID → 父 chip 仅变蓝字 */
  contextId?: number | null
}>()

defineEmits<{
  select: [categoryId: number | null]
}>()
</script>

<style scoped>
.filter-chips {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 14px;
  border-radius: 18px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.8);
  color: #1c1c1e;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.15s;
  font-family: inherit;
}

.chip.active {
  background: #007aff;
  color: #fff;
  font-weight: 500;
}

.chip.contextual {
  background: rgba(255, 255, 255, 0.8);
  color: #007aff;
  font-weight: 600;
}

.chip-icon {
  font-size: 15px;
  line-height: 1;
}
</style>