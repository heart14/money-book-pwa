<template>
  <!-- PIN 锁定层: 不可穿透 -->
  <PinDialog
    :visible="showPinLock"
    :error-msg="pinError"
    :reset-key="pinResetVersion"
    @submit="onPinSubmit"
    @close="onPinClose"
  />
  <!-- 正常 App 内容, 仅解锁后可见 -->
  <MobileLayout v-if="uiStore.unlocked" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import { hashPIN, getStoredPINHash } from '@/utils/crypto'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import PinDialog from '@/components/common/PinDialog.vue'

const uiStore = useUiStore()

// ── Theme management ──
function resolveTheme(): 'light' | 'dark' {
  if (uiStore.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return uiStore.theme
}

function applyTheme() {
  const isDark = resolveTheme() === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isDark ? '#000000' : '#f2f2f6')
}

function applyFontSize() {
  const html = document.documentElement
  html.classList.remove('font-xs', 'font-sm', 'font-lg', 'font-xl')
  const level = uiStore.fontSize
  if (level !== 'md') html.classList.add(`font-${level}`)
}

// Apply on mount
applyTheme()
applyFontSize()

// Watch store changes
watch(() => uiStore.theme, applyTheme)
watch(() => uiStore.fontSize, applyFontSize)

// Listen to system preference changes
const mql = window.matchMedia('(prefers-color-scheme: dark)')
function onSystemChange() {
  if (uiStore.theme === 'system') applyTheme()
}
mql.addEventListener('change', onSystemChange)
onUnmounted(() => mql.removeEventListener('change', onSystemChange))

// ── PIN lock state ──
const hasPin = !!getStoredPINHash()

if (!hasPin) {
  uiStore.unlocked = true
} else {
  uiStore.unlocked = false
}

const showPinLock = ref(hasPin)
const pinError = ref('')
const pinResetVersion = ref(0)

async function onPinSubmit(pin: string) {
  pinError.value = ''
  const stored = getStoredPINHash()
  if (!stored) { unlockApp(); return }
  const hash = await hashPIN(pin)
  if (hash === stored) {
    unlockApp()
  } else {
    pinError.value = 'PIN 码错误，请重试'
  }
}

function unlockApp() {
  uiStore.unlocked = true
  showPinLock.value = false
  pinError.value = ''
}

function onPinClose() {
  // PIN 锁定层不允许关闭, 忽略即可
}

function onVisibilityChange() {
  if (document.hidden) {
    uiStore.unlocked = false
  } else if (getStoredPINHash()) {
    // 回到前台且有 PIN → 立即弹出 PIN 弹窗
    pinError.value = ''
    pinResetVersion.value++
    showPinLock.value = true
  } else {
    uiStore.unlocked = true
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>