# 日期时间选择器 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用自建 iOS 风格滚轮选择器替换记账页和交易编辑页中的原生 `<input type="date">` / `<input type="time">`

**Architecture:** 三层结构：通用滚轮内核 `PickerWheel.vue` → 业务选择器 `DatePickerSheet.vue` / `TimePickerSheet.vue` → 集成到 `BookingPage.vue` 和 `TransactionEdit.vue`。零新增依赖。

**Tech Stack:** Vue 3 + TypeScript + UnoCSS 变量 + CommonBottomSheet

## Global Constraints

- 不使用任何第三方 UI / picker 库
- 所有新建组件使用 `.vue` SFC 格式，`<script setup lang="ts">` + `<style scoped>`
- 样式使用 CSS 变量（`var(--color-*)`），支持深色模式和字号缩放
- 日期格式为 `"YYYY-MM-DD"`，时间格式为 `"HH:mm"`
- 金额单位统一为"分"（仅涉及 TransactionEdit 保持现有逻辑）
- 文件路径均以项目根 `C:\Users\wfli\Documents\Workspace\VSCode\money-book-pwa\` 为准

---
### Task 1: PickerWheel.vue — 通用滚轮内核

**Files:**
- Create: `src/components/common/PickerWheel.vue`

**Interfaces:**
- Consumes: `items: { label: string; value: T }[]`, `modelValue: T`, `itemHeight?: number`, `visibleCount?: number`
- Produces: `update:modelValue` 事件

- [ ] **Step 1: 编写 PickerWheel 组件模板和样式**

```vue
<!-- src/components/common/PickerWheel.vue -->
<template>
  <div
    ref="containerRef"
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

const containerRef = ref<HTMLElement | null>(null)
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
let lastMoveY = 0
let lastMoveTime = 0
let velocityHistory: { y: number; t: number }[] = []
let animFrameId = 0

function onTouchStart(e: TouchEvent) {
  cancelAnimationFrame(animFrameId)
  isAnimating.value = false
  const y = e.touches[0].clientY
  touchStartY = y
  touchStartOffset = offset.value
  lastMoveY = y
  lastMoveTime = Date.now()
  velocityHistory = [{ y, t: lastMoveTime }]
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

  lastMoveY = y
  lastMoveTime = now
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
      offset.value = targetOffset
      isAnimating.value = false
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
```

- [ ] **Step 2: 确认文件写入完成**

Verify the file exists at `C:\Users\wfli\Documents\Workspace\VSCode\money-book-pwa\src\components\common\PickerWheel.vue`

---
### Task 2: DatePickerSheet.vue — 日期选择弹窗

**Files:**
- Create: `src/components/common/DatePickerSheet.vue`

**Interfaces:**
- Consumes: `visible: boolean`, `modelValue: string (YYYY-MM-DD)`
- Produces: `update:modelValue`, `update:visible`, `close`
- Depends on: Task 1 (PickerWheel), CommonBottomSheet (已有)

- [ ] **Step 1: 编写 DatePickerSheet 组件**

```vue
<!-- src/components/common/DatePickerSheet.vue -->
<template>
  <CommonBottomSheet :visible="visible" title="选择日期" @close="onCancel">
    <div class="date-picker-content">
      <div class="picker-columns">
        <div class="picker-column">
          <div class="picker-column-label">年</div>
          <PickerWheel
            :items="yearItems"
            :model-value="selectedYear"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onYearChange"
          />
        </div>
        <div class="picker-column">
          <div class="picker-column-label">月</div>
          <PickerWheel
            :items="monthItems"
            :model-value="selectedMonth"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onMonthChange"
          />
        </div>
        <div class="picker-column">
          <div class="picker-column-label">日</div>
          <PickerWheel
            :items="dayItems"
            :model-value="selectedDay"
            :item-height="40"
            :visible-count="5"
            @update:model-value="onDayChange"
          />
        </div>
      </div>
    </div>
    <template #actions>
      <button class="btn btn-secondary" @click="onCancel">取消</button>
      <button class="btn btn-primary" @click="onConfirm">完成</button>
    </template>
  </CommonBottomSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CommonBottomSheet from './CommonBottomSheet.vue'
import PickerWheel from './PickerWheel.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  modelValue?: string
}>(), {
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

// Parse initial date
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  }
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

const { year: initYear, month: initMonth, day: initDay } = parseDate(props.modelValue)
const selectedYear = ref(initYear)
const selectedMonth = ref(initMonth)
const selectedDay = ref(initDay)

// Reset internal state when sheet opens
watch(() => props.visible, (open) => {
  if (open) {
    const { year, month, day } = parseDate(props.modelValue)
    selectedYear.value = year
    selectedMonth.value = month
    selectedDay.value = day
  }
})

// Column data
const yearItems = computed(() => {
  const years: { label: string; value: number }[] = []
  for (let y = 1970; y <= 2050; y++) {
    years.push({ label: `${y}`, value: y })
  }
  return years
})

const monthItems = computed(() => {
  return Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }))
})

const daysInMonth = computed(() => {
  return new Date(selectedYear.value, selectedMonth.value, 0).getDate()
})

const dayItems = computed(() => {
  return Array.from({ length: daysInMonth.value }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }))
})

// Handlers with cross-column correction
function onYearChange(year: number) {
  selectedYear.value = year
  // Fix day if needed (e.g., Feb 29 in non-leap year)
  const maxDay = new Date(year, selectedMonth.value, 0).getDate()
  if (selectedDay.value > maxDay) {
    selectedDay.value = maxDay
  }
}

function onMonthChange(month: number) {
  selectedMonth.value = month
  // Fix day if needed (e.g., Jan 31 -> Feb)
  const maxDay = new Date(selectedYear.value, month, 0).getDate()
  if (selectedDay.value > maxDay) {
    selectedDay.value = maxDay
  }
}

function onDayChange(day: number) {
  selectedDay.value = day
}

function toDateStr(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function onConfirm() {
  emit('update:modelValue', toDateStr(selectedYear.value, selectedMonth.value, selectedDay.value))
  emit('update:visible', false)
}

function onCancel() {
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
.date-picker-content {
  padding: 0 8px;
}

.picker-columns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.picker-column {
  flex: 1;
  max-width: 100px;
  text-align: center;
}

.picker-column-label {
  font-size: var(--fs-small, 12px);
  color: var(--color-secondary-text);
  margin-bottom: 4px;
  font-weight: 500;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: var(--fs-amount, 16px);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}
.btn:active { opacity: 0.7; }
.btn-secondary { background: var(--color-bg); color: var(--color-text); }
.btn-primary { background: var(--color-primary); color: #fff; }
</style>
```

- [ ] **Step 2: 确认文件写入完成**

### Task 3: TimePickerSheet.vue — 时间选择弹窗

**Files:**
- Create: `src/components/common/TimePickerSheet.vue`

**Interfaces:**
- Consumes: `visible: boolean`, `modelValue: string (HH:mm)`
- Produces: `update:modelValue`, `update:visible`, `close`
- Depends on: Task 1 (PickerWheel), CommonBottomSheet (已有)

- [ ] **Step 1: 编写 TimePickerSheet 组件**

```vue
<!-- src/components/common/TimePickerSheet.vue -->
<template>
  <CommonBottomSheet :visible="visible" title="选择时间" @close="onCancel">
    <div class="time-picker-content">
      <div class="picker-columns">
        <div class="picker-column">
          <div class="picker-column-label">小时</div>
          <PickerWheel
            :items="hourItems"
            :model-value="selectedHour"
            :item-height="40"
            :visible-count="5"
            @update:model-value="selectedHour = $event"
          />
        </div>
        <div class="picker-column">
          <div class="picker-column-label">分钟</div>
          <PickerWheel
            :items="minuteItems"
            :model-value="selectedMinute"
            :item-height="40"
            :visible-count="5"
            @update:model-value="selectedMinute = $event"
          />
        </div>
      </div>
    </div>
    <template #actions>
      <button class="btn btn-secondary" @click="onCancel">取消</button>
      <button class="btn btn-primary" @click="onConfirm">完成</button>
    </template>
  </CommonBottomSheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import CommonBottomSheet from './CommonBottomSheet.vue'
import PickerWheel from './PickerWheel.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  modelValue?: string
}>(), {
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

function parseTime(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) {
    const now = new Date()
    return { hour: now.getHours(), minute: now.getMinutes() }
  }
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h || 0, minute: m || 0 }
}

const { hour: initHour, minute: initMinute } = parseTime(props.modelValue)
const selectedHour = ref(initHour)
const selectedMinute = ref(initMinute)

// Reset when sheet opens
watch(() => props.visible, (open) => {
  if (open) {
    const { hour, minute } = parseTime(props.modelValue)
    selectedHour.value = hour
    selectedMinute.value = minute
  }
})

const hourItems = Array.from({ length: 24 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: i,
}))

const minuteItems = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: i,
}))

function toTimeStr(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function onConfirm() {
  emit('update:modelValue', toTimeStr(selectedHour.value, selectedMinute.value))
  emit('update:visible', false)
}

function onCancel() {
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
.time-picker-content {
  padding: 0 8px;
}

.picker-columns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.picker-column {
  flex: 1;
  max-width: 100px;
  text-align: center;
}

.picker-column-label {
  font-size: var(--fs-small, 12px);
  color: var(--color-secondary-text);
  margin-bottom: 4px;
  font-weight: 500;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: var(--fs-amount, 16px);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}
.btn:active { opacity: 0.7; }
.btn-secondary { background: var(--color-bg); color: var(--color-text); }
.btn-primary { background: var(--color-primary); color: #fff; }
</style>
```

- [ ] **Step 2: 确认文件写入完成**

---
### Task 4: 集成到 BookingPage.vue

**Files:**
- Modify: `src/pages/booking/BookingPage.vue`
- Depends on: Task 2, Task 3

- [ ] **Step 1: 在模板中替换 dt-row，添加 DatePickerSheet 和 TimePickerSheet**

在 `<template>` 中找到 `dt-row` div，整体替换为：

```diff
-      <!-- Date & Time Inline -->
-      <div class="dt-row">
-        <input v-model="selectedDate" type="date" class="dt-input" />
-        <input v-model="selectedTime" type="time" class="dt-input" />
-      </div>
+      <!-- Date & Time Inline -->
+      <div class="dt-row">
+        <div class="dt-picker" @click="datePickerOpen = true">
+          <span class="dt-picker-icon">📅</span>
+          <span class="dt-picker-text">{{ formatDateLabel(selectedDate) }}</span>
+        </div>
+        <div class="dt-picker" @click="timePickerOpen = true">
+          <span class="dt-picker-icon">⏰</span>
+          <span class="dt-picker-text">{{ selectedTime }}</span>
+        </div>
+      </div>
```

在 `<template>` 底部、`<PromptDialog>` 之后、`</div>` 之前添加：

```diff
+    <!-- Date/Time Pickers -->
+    <DatePickerSheet v-model:visible="datePickerOpen" v-model="selectedDate" />
+    <TimePickerSheet v-model:visible="timePickerOpen" v-model="selectedTime" />
```

- [ ] **Step 2: 在 script 中添加 import 和新状态**

在 `<script setup>` 的 import 区域添加：

```diff
  import { formatShortCurrency, toDateString } from '@/utils/format'
+ import { formatDate as formatDateLabel } from '@/utils/format'
  import type { QuickTemplate } from '@/types'
  import TwemojiIcon from '@/components/common/TwemojiIcon.vue'
+ import DatePickerSheet from '@/components/common/DatePickerSheet.vue'
+ import TimePickerSheet from '@/components/common/TimePickerSheet.vue'
```

在 `selectedTime` ref 之后添加：

```diff
  const selectedTime = ref(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`)
+ const datePickerOpen = ref(false)
+ const timePickerOpen = ref(false)
```

- [ ] **Step 3: 更新样式**

找到 `<style scoped>` 中的 `.dt-row` 和 `.dt-input` 相关样式，替换为：

```diff
-/* ── Date / Time Inline ── */
-.dt-row {
-  display: flex;
-  gap: 8px;
-  margin-bottom: 12px;
-}
-.dt-input {
-  flex: 1;
-  height: 44px;
-  padding: 0 12px;
-  border: none;
-  border-radius: 10px;
-  background: var(--color-card);
-  font-size: 15px;
-  font-weight: 600;
-  color: var(--color-text);
-  font-family: inherit;
-  font-variant-numeric: tabular-nums;
-  outline: none;
-  cursor: pointer;
-}
-.dt-input::-webkit-calendar-picker-indicator {
-  opacity: .4;
-  cursor: pointer;
-  padding: 6px;
-}
+/* ── Date / Time Inline ── */
+.dt-row {
+  display: flex;
+  gap: 8px;
+  margin-bottom: 12px;
+}
+.dt-picker {
+  flex: 1;
+  height: 44px;
+  display: flex;
+  align-items: center;
+  gap: 6px;
+  padding: 0 12px;
+  border: none;
+  border-radius: 10px;
+  background: var(--color-card);
+  font-size: 15px;
+  font-weight: 600;
+  color: var(--color-text);
+  font-family: inherit;
+  font-variant-numeric: tabular-nums;
+  cursor: pointer;
+  transition: background 0.15s;
+  -webkit-tap-highlight-color: transparent;
+}
+.dt-picker:active {
+  background: var(--color-disabled-bg);
+}
+.dt-picker-icon {
+  font-size: 16px;
+  line-height: 1;
+  opacity: 0.6;
+}
+.dt-picker-text {
+  flex: 1;
+  text-align: center;
+}
```

- [ ] **Step 4: 确认修改完成**

Verify:
- `formatDateLabel` (即 `formatDate`) 已导入
- `datePickerOpen` / `timePickerOpen` 两个 ref 已声明
- DatePickerSheet / TimePickerSheet 已 import 并在模板中使用
- `formatDate(selectedDate)` 输出如 "今天" / "8月3日 周一" 等自然语言文本
- `selectedTime` 显示如 "15:30"

---
### Task 5: 集成到 TransactionEdit.vue

**Files:**
- Modify: `src/components/transactions/TransactionEdit.vue`
- Depends on: Task 2, Task 3

- [ ] **Step 1: 在模板中替换日期/时间 input**

找到日期和时间的 `.edit-row` 块：

```diff
-            <div class="edit-row">
-              <label class="edit-label">日期</label>
-              <input v-model="form.date" class="edit-input" type="date" />
-            </div>
-            <div class="edit-row">
-              <label class="edit-label">时间</label>
-              <input v-model="form.time" class="edit-input" type="time" />
-            </div>
+            <div class="edit-row">
+              <label class="edit-label">日期</label>
+              <div class="edit-input edit-picker-trigger" @click="datePickerOpen = true">
+                {{ formatDateLabel(form.date) }}
+              </div>
+            </div>
+            <div class="edit-row">
+              <label class="edit-label">时间</label>
+              <div class="edit-input edit-picker-trigger" @click="timePickerOpen = true">
+                {{ form.time }}
+              </div>
+            </div>
```

在模板底部、`</div>` 结束前添加：

```diff
+    <!-- Date/Time Pickers -->
+    <DatePickerSheet v-model:visible="datePickerOpen" v-model="form.date" />
+    <TimePickerSheet v-model:visible="timePickerOpen" v-model="form.time" />
```

- [ ] **Step 2: 在 script 中添加 import 和新状态**

```diff
  import { ref, reactive, computed } from 'vue'
  import { useCategoryStore } from '@/stores/categoryStore'
+ import { formatDate as formatDateLabel } from '@/utils/format'
  import type { Transaction } from '@/types'
+ import DatePickerSheet from '@/components/common/DatePickerSheet.vue'
+ import TimePickerSheet from '@/components/common/TimePickerSheet.vue'
```

在 `const tagInput = ref('')` 后添加：

```diff
  const tagInput = ref('')
+ const datePickerOpen = ref(false)
+ const timePickerOpen = ref(false)
```

- [ ] **Step 3: 添加样式**

在 `<style scoped>` 中添加：

```css
.edit-picker-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text);
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.edit-picker-trigger:active {
  background: var(--color-disabled-bg);
}
```

- [ ] **Step 4: 确认修改完成**

Verify:
- `formatDateLabel` 已导入
- `datePickerOpen` / `timePickerOpen` 已声明
- DatePickerSheet / TimePickerSheet 已 import
- 原生 `<input type="date">` 和 `<input type="time">` 已全部移除
- `form.date` 显示格式为 "今天" / "8月3日 周一"，`form.time` 显示 "15:30"

---
### Task 6: 编译验证

**Files:** 无变更

- [ ] **Step 1: 运行类型检查**

```bash
npx vue-tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 2: 运行构建**

```bash
npx vite build
```
Expected: 构建成功，无错误

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: replace native date/time inputs with iOS-style wheel pickers

- Add PickerWheel.vue — generic iOS-style spinning wheel with momentum
- Add DatePickerSheet.vue — 3-column (year/month/day) date picker
- Add TimePickerSheet.vue — 2-column (hour/minute) time picker
- Integrate into BookingPage.vue (记账页)
- Integrate into TransactionEdit.vue (交易编辑)
- Remove all native <input type=date/time> usage
```