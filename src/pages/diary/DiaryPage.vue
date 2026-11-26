<template>
  <div class="page diary-page">
    <!-- 沉浸式标题 + 右上角 + 新建 -->
    <header class="di-head">
      <span class="di-title">日记</span>
      <button class="di-add" aria-label="写日记" @click="openNew">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      </button>
    </header>

    <!-- 内容 -->
    <EmptyState
      v-if="diaries.length === 0"
      icon="📔"
      message="还没有日记，点右上角 + 写一篇吧"
    />

    <div v-else class="di-list">
      <button
        v-for="d in diaries"
        :key="d.id"
        class="di-card glass"
        @click="openEdit(d)"
      >
        <span class="di-card-date">{{ formatDate(d.date) }}</span>
        <p class="di-card-content">{{ d.content }}</p>
      </button>
    </div>

    <!-- 编辑/新建 bottom sheet -->
    <DiaryEditSheet
      :visible="sheetVisible"
      :diary="editingDiary"
      @save="handleSave"
      @delete="handleDelete"
      @close="sheetVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { formatDate } from '@/utils/format'
import type { Diary } from '@/types'
import EmptyState from '@/components/common/EmptyState.vue'
import DiaryEditSheet from '@/components/diary/DiaryEditSheet.vue'

// 按日期倒序直排（不分页：日记量小，一次全量）
const allDiaries = useLiveQuery<Diary[]>(
  () => db.diaries.orderBy('date').reverse().toArray(),
  [],
)
const diaries = computed(() => allDiaries.value)

// ── 编辑 / 新建 ──
const sheetVisible = ref(false)
const editingDiary = ref<Diary | null>(null)

function openNew() {
  editingDiary.value = null
  sheetVisible.value = true
}

function openEdit(d: Diary) {
  editingDiary.value = d
  sheetVisible.value = true
}

async function handleSave(payload: { id?: number; date: string; content: string }) {
  if (payload.id != null) {
    await db.diaries.update(payload.id, { date: payload.date, content: payload.content })
  } else {
    await db.diaries.add({ date: payload.date, content: payload.content })
  }
}

async function handleDelete(id: number) {
  await db.diaries.delete(id)
}
</script>

<style scoped>
.diary-page {
  min-height: 100%;
  min-height: 100svh;
  padding: 0 16px 16px;
  background: transparent;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

/* ── 沉浸式标题 ── */
.di-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 2px 6px;
  margin-bottom: 10px;
}
.di-title { font-size: var(--fs-page-title); font-weight: 800; letter-spacing: -0.03em; color: var(--ink); }

.di-add {
  width: 38px;
  height: 38px;
  border: none;
  background: none;
  color: var(--ink3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, color 0.15s;
}
.di-add:active { background: var(--act-bg); }

/* ── 日记卡片列表 ── */
.di-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.di-card {
  width: 100%;
  display: block;
  text-align: left;
  padding: 14px 16px;
  border-radius: var(--radius-big);
  border: none;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.di-card:active { transform: scale(0.99); }

.di-card-date {
  display: block;
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--ink2);
  margin-bottom: 8px;
}

.di-card-content {
  margin: 0;
  font-size: var(--fs-title);
  line-height: 1.6;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>