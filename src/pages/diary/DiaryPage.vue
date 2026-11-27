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

    <!-- 列表（内部滚动区，上下边缘渐变弱化，中间高亮） -->
    <div ref="listWrapEl" class="di-list-wrap">
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { formatDate } from '@/utils/format'
import type { Diary } from '@/types'
import EmptyState from '@/components/common/EmptyState.vue'
import DiaryEditSheet from '@/components/diary/DiaryEditSheet.vue'

// ── 渲染时机：等底图（AmbientBackdrop 环境渐变）与 TabBar 就位后再同步视口逻辑 ──
const ready = ref(false)
onMounted(() => requestAnimationFrame(() => nextTick(() => { ready.value = true })))

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

// ═════════════════════════════════════════════════════════════════
// 滚动景深：列表上下边缘渐隐、中间高亮
// 用列表容器 mask 渐隐（贴合动态环境光底，无需匹配背景色）。
// ═════════════════════════════════════════════════════════════════
const listWrapEl = ref<HTMLElement | null>(null)

// 视口高度阈值：≥520px 才算正常屏（触发淡出），小屏/分屏为稳妥直接全亮淡出
const viewportH = ref(0)
const isSmallViewport = computed(() => viewportH.value < 520)

const topDim = ref(0)      // 顶部渐隐强度 0~1（scrollTop=0 时保持 0）
const bottomDim = ref(1)   // 底部渐隐强度 0~1

/** 有列表、内容超过可视区、滚动区本身能滚 时才需要渐隐 */
function needsFade(el: HTMLElement): boolean {
  if (diaries.value.length === 0) return false
  return el.scrollHeight > el.clientHeight + 1
}

function update() {
  const el = listWrapEl.value
  if (!el || !ready.value || isSmallViewport.value) return
  // 顶部：scrollTop 未过 8px 视为停在顶部，不淡出（最上方第一个卡片保持清晰）
  topDim.value = el.scrollTop > 8 ? 1 : 0
  // 底部：能滚时始终淡出
  bottomDim.value = needsFade(el) ? 1 : 0
  applyMask()
}

function applyMask() {
  const el = listWrapEl.value
  if (!el || !ready.value) return
  // 无需景深时（小屏/空列表/不能滚）：写一整块不透明掩膜，避免回退到 CSS 默认的顶部渐隐
  if (isSmallViewport.value || diaries.value.length === 0 || !needsFade(el)) {
    const solid = 'linear-gradient(to bottom, #000 0, #000 100%)'
    el.style.maskImage = solid
    el.style.webkitMaskImage = solid
    return
  }
  const top = topDim.value * 46   // px
  const bot = bottomDim.value * 46
  const mask = `linear-gradient(to bottom, transparent 0, #000 ${top}px, #000 calc(100% - ${bot}px), transparent 100%)`
  el.style.maskImage = mask
  el.style.webkitMaskImage = mask
}

const onScroll = () => {
  // 滚动期间也要保持顶部渐显（滚离顶部即淡出首卡）
  topDim.value = (listWrapEl.value?.scrollTop ?? 0) > 8 ? 1 : 0
  applyMask()
}

const onVisualViewportResize = () => {
  viewportH.value = window.visualViewport?.height ?? window.innerHeight
  update()
}

// 列表内容变化（增删改）后重算渐变
watch(diaries, async () => {
  await nextTick()
  update()
})

watch(ready, (r) => {
  if (r) {
    viewportH.value = window.visualViewport?.height ?? window.innerHeight
    update()
    const el = listWrapEl.value
    if (el) {
      el.addEventListener('scroll', onScroll, { passive: true })
      window.visualViewport?.addEventListener('resize', onVisualViewportResize)
    }
  }
})

onUnmounted(() => {
  const el = listWrapEl.value
  el?.removeEventListener('scroll', onScroll)
  window.visualViewport?.removeEventListener('resize', onVisualViewportResize)
})
</script>

<style scoped>
/* 应用级框架：锁定视口高度，内部滚动，header 固定、列表滚动 + 上下掩膜景深 */
.diary-page {
  height: 100%;
  height: 100svh;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  background: transparent;
}

/* ── 沉浸式标题 ── */
.di-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 16px 2px 8px;
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

/* ── 列表滚动区：内部滚动 + 上下边缘渐隐掩膜（中间高亮） ── */
.di-list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* 底部 26px 让最后一张卡能滚进掩膜渐隐区 */
  padding: 0 0 26px;
  /* 掩膜默认值：底部 46px 渐隐、顶部留出清亮区；JS 会按滚动位置改写 */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 46px, #000 calc(100% - 46px), transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 46px, #000 calc(100% - 46px), transparent 100%);
}

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