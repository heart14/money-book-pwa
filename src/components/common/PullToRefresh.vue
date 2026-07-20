<template>
  <div ref="containerEl" class="ptr-container">
    <!-- Pull indicator -->
    <div
      class="ptr-indicator"
      :class="{ 'ptr-indicator--refreshing': refreshing }"
      :style="indicatorStyle"
    >
      <div v-if="refreshing" class="ptr-spinner" />
      <svg v-else class="ptr-arrow" :class="{ 'ptr-arrow--flip': pullDist >= THRESHOLD }" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="12 5 12 19" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
      <span class="ptr-text">
        {{ refreshing ? '刷新中…' : pullDist >= THRESHOLD ? '释放刷新' : '下拉刷新' }}
      </span>
    </div>

    <div class="ptr-content" :style="contentStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  refresh: []
}>()

const THRESHOLD = 60
const MAX_PULL = 120

let touchStartY = 0
let isPulling = false

const pullDist = ref(0)
const refreshing = ref(false)

const containerEl = ref<HTMLElement | null>(null)

function onTouchStart(e: TouchEvent) {
  if (refreshing.value) return
  if (e.touches.length !== 1) return
  if (window.scrollY !== 0) return
  touchStartY = e.touches[0].clientY
  isPulling = true
  // Lock body scroll so the page can't fight the pull gesture
  document.body.style.overflow = 'hidden'
}

function onTouchMove(e: TouchEvent) {
  if (!isPulling || refreshing.value) return
  const raw = e.touches[0].clientY - touchStartY
  if (raw <= 0) {
    pullDist.value = 0
    return
  }
  // Rubber-band damping (body.overflow=hidden already stops native scroll)
  pullDist.value = Math.min(raw * 0.5, MAX_PULL)
}

function onTouchEnd() {
  if (!isPulling) return
  isPulling = false
  // Restore body scroll
  document.body.style.overflow = ''

  if (pullDist.value >= THRESHOLD) {
    refreshing.value = true
    pullDist.value = THRESHOLD
    emit('refresh')
  } else {
    pullDist.value = 0
  }
}

function doneRefreshing() {
  refreshing.value = false
  pullDist.value = 0
}

defineExpose({ doneRefreshing })

onMounted(() => {
  const el = containerEl.value
  if (!el) return
  el.addEventListener('touchstart', onTouchStart as EventListener, { passive: true })
  el.addEventListener('touchmove', onTouchMove as EventListener)
  el.addEventListener('touchend', onTouchEnd)
  el.addEventListener('touchcancel', onTouchEnd)
})

onUnmounted(() => {
  const el = containerEl.value
  if (!el) return
  el.removeEventListener('touchstart', onTouchStart as EventListener)
  el.removeEventListener('touchmove', onTouchMove as EventListener)
  el.removeEventListener('touchend', onTouchEnd)
  el.removeEventListener('touchcancel', onTouchEnd)
})

const indicatorStyle = computed(() => ({
  height: refreshing.value ? `${THRESHOLD}px` : `${pullDist.value}px`,
  opacity: refreshing.value ? 1 : Math.min(pullDist.value / THRESHOLD, 1),
}))

const contentStyle = computed(() => {
  const transY = pullDist.value > 0 || refreshing.value ? pullDist.value : 0
  return {
    transform: `translateY(${transY}px)`,
    transition: isPulling ? 'none' : 'transform 0.3s ease',
  }
})
</script>

<style scoped>
.ptr-container {
  position: relative;
}

.ptr-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  z-index: 1;
  transition: height 0.3s ease, opacity 0.2s;
  pointer-events: none;
}

.ptr-text {
  font-size: 13px;
  color: #8e8e93;
  white-space: nowrap;
}

.ptr-arrow {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.ptr-arrow--flip {
  transform: rotate(180deg);
}

.ptr-spinner {
  width: 16px;
  height: 16px;
  border: 2.5px solid #c7c7cc;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: ptr-spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes ptr-spin {
  to { transform: rotate(360deg); }
}

.ptr-content {
  will-change: transform;
  transition: transform 0.3s ease;
}
</style>