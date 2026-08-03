<template>
  <div
    class="picker-wheel"
    :style="containerStyle"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @wheel.prevent="onWheel"
  >
    <div class="picker-wheel-track" :style="trackStyle">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="picker-wheel-item"
        :style="getItemStyle(idx)"
      >
        {{ item.label }}
      </div>
    </div>
    <!-- center indicator bar -->
    <div class="picker-wheel-indicator" :style="indicatorStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  items: { label: string; value: any }[]
  modelValue: any
  itemHeight?: number
  visibleCount?: number
}>(), {
  itemHeight: 36,
  visibleCount: 5,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const offset = ref(0)          // current translateY offset (px)
const isAnimating = ref(false)

// Find selected index from modelValue
const selectedIndex = computed(() => {
  const idx = props.items.findIndex(item => item.value === props.modelValue)
  return idx >= 0 ? idx : 0
})

const containerHeight = computed(() => props.itemHeight * props.visibleCount)
const centerOffset = computed(() => (containerHeight.value - props.itemHeight) / 2)
const totalHeight = computed(() => props.items.length * props.itemHeight)

const containerStyle = computed(() => ({
  height: `${containerHeight.value}px`,
}))

const indicatorStyle = computed(() => ({
  height: `${props.itemHeight}px`,
  top: `${centerOffset.value}px`,
}))

const trackStyle = computed(() => ({
  transform: `translateY(${offset.value}px)`,
}))

// Initialize offset based on current selection
watch(selectedIndex, (idx) => {
  if (!isAnimating.value) {
    offset.value = centerOffset.value - idx * props.itemHeight
  }
}, { immediate: true })

function getItemStyle(idx: number): Record<string, string> {
  const center = -offset.value + centerOffset.value
  const itemCenter = idx * props.itemHeight + props.itemHeight / 2
  const dist = Math.abs(itemCenter - center) / props.itemHeight

  let scale = 1
  let opacity = 1

  if (dist <= 2) {
    scale = 1 - dist * 0.15
    opacity = 1 - dist * 0.25
  } else {
    scale = 0.6
    opacity = 0
  }

  return {
    transform: `scale(${scale})`,
    opacity: String(opacity),
    height: `${props.itemHeight}px`,
    lineHeight: `${props.itemHeight}px`,
  }
}

// ── Touch handling ──
let touchStartY = 0
let touchStartOffset = 0
let velocityHistory: { y: number; t: number }[] = []
let animFrameId = 0

function onTouchStart(e: TouchEvent) {
  cancelAnimationFrame(animFrameId)
  isAnimating.value = false
  const y = e.touches[0].clientY
  touchStartY = y
  touchStartOffset = offset.value
  velocityHistory = [{ y, t: Date.now() }]
}

function onTouchMove(e: TouchEvent) {
  const y = e.touches[0].clientY
  const now = Date.now()
  const deltaY = y - touchStartY

  offset.value = clamp(touchStartOffset + deltaY, -totalHeight.value + props.itemHeight, containerHeight.value - props.itemHeight)

  // Track velocity (keep last ~100ms)
  velocityHistory.push({ y, t: now })
  const cutoff = now - 100
  while (velocityHistory.length > 0 && velocityHistory[0].t < cutoff) {
    velocityHistory.shift()
  }
}

function onTouchEnd() {
  if (velocityHistory.length < 2) {
    snapToNearest()
    return
  }

  const first = velocityHistory[0]
  const last = velocityHistory[velocityHistory.length - 1]
  const dt = last.t - first.t
  const dy = last.y - first.y

  if (dt > 0 && Math.abs(dy) > 3) {
    const velocity = dy / dt * 15 // normalize to px per frame
    animateMomentum(velocity)
  } else {
    snapToNearest()
  }
}

// ── Momentum animation ──
function animateMomentum(velocity: number) {
  isAnimating.value = true
  const FRICTION = 0.92
  const MIN_VELOCITY = 0.5

  function step() {
    velocity *= FRICTION
    offset.value = clamp(
      offset.value + velocity,
      -totalHeight.value + props.itemHeight,
      containerHeight.value - props.itemHeight,
    )

    if (Math.abs(velocity) > MIN_VELOCITY) {
      animFrameId = requestAnimationFrame(step)
    } else {
      snapToNearest()
    }
  }

  animFrameId = requestAnimationFrame(step)
}

// ── Snap to nearest item ──
function snapToNearest() {
  isAnimating.value = true
  const rawIndex = Math.round((centerOffset.value - offset.value) / props.itemHeight)
  const idx = clamp(rawIndex, 0, props.items.length - 1)
  const targetOffset = centerOffset.value - idx * props.itemHeight

  // Animate to target
  const startOffset = offset.value
  const delta = targetOffset - startOffset
  const duration = 200
  const startTime = performance.now()

  function animateSnap(time: number) {
    const elapsed = time - startTime
    const progress = Math.min(elapsed / duration, 1)
    // easeOutCubic
    const ease = 1 - Math.pow(1 - progress, 3)
    offset.value = startOffset + delta * ease

    if (progress < 1) {
      animFrameId = requestAnimationFrame(animateSnap)
    } else {
      isAnimating.value = false
      offset.value = centerOffset.value - selectedIndex.value * props.itemHeight
      emitValue(idx)
    }
  }

  cancelAnimationFrame(animFrameId)
  animFrameId = requestAnimationFrame(animateSnap)
}

// ── Mouse wheel ──
function onWheel(e: WheelEvent) {
  cancelAnimationFrame(animFrameId)
  isAnimating.value = false
  offset.value = clamp(
    offset.value - e.deltaY / 2,
    -totalHeight.value + props.itemHeight,
    containerHeight.value - props.itemHeight,
  )

  // Auto-snap after wheel stops
  if (wheelTimer) clearTimeout(wheelTimer)
  wheelTimer = setTimeout(() => snapToNearest(), 150)
}

let wheelTimer: ReturnType<typeof setTimeout> | null = null

// ── Utilities ──
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function emitValue(idx: number) {
  const item = props.items[idx]
  if (item && item.value !== props.modelValue) {
    emit('update:modelValue', item.value)
  }
}

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  if (wheelTimer) clearTimeout(wheelTimer)
})
</script>

<style scoped>
.picker-wheel {
  position: relative;
  overflow: hidden;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.picker-wheel-track {
  will-change: transform;
  transition: none;
}

.picker-wheel-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-title, 15px);
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  will-change: transform, opacity;
  transition: none;
}

.picker-wheel-indicator {
  position: absolute;
  left: 8px;
  right: 8px;
  border-radius: 8px;
  background: var(--color-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  pointer-events: none;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--color-separator);
  z-index: 1;
}
</style>