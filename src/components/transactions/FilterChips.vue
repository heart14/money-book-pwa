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
      :class="{ active: selectedId === cat.id }"
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
  font-size: 14px;
  cursor: pointer;
  background: #e9e9ed;
  color: var(--color-text);
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, color 0.15s;
}

.chip.active {
  background: #007aff;
  color: #fff;
}

.chip-icon {
  font-size: 16px;
  line-height: 1;
}
</style>