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
import { ref, onMounted, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import { hashPIN, getStoredPINHash } from '@/utils/crypto'
import { isBiometricEnabled, authenticateBiometric } from '@/utils/biometric'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import PinDialog from '@/components/common/PinDialog.vue'

const uiStore = useUiStore()

// ── PIN / Biometric lock state ──
const hasPin = !!getStoredPINHash()
const hasBiometric = hasPin && isBiometricEnabled()

if (!hasPin) {
  // 无 PIN → 直接解锁
  uiStore.unlocked = true
} else if (hasBiometric) {
  // 有 PIN + Biometric → 先不弹 PIN 弹窗，等待生物识别
  uiStore.unlocked = false
} else {
  // 只有 PIN → 立即弹出 PIN 弹窗
  uiStore.unlocked = false
}

const showPinLock = ref(!hasPin ? false : hasBiometric ? false : true)
const pinError = ref('')
const pinResetVersion = ref(0)

// ── 生物识别首次尝试 (仅在 hasBiometric 时执行) ──
async function tryBiometricUnlock() {
  const ok = await authenticateBiometric()
  if (ok) {
    unlockApp()
  } else {
    // 用户取消或凭证不可用 → 显示 PIN 弹窗
    showPinLock.value = true
    pinResetVersion.value++
  }
}

async function onPinSubmit(pin: string) {
  pinError.value = ''  // 清空上次错误，确保下次错误赋值能触发 watch
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
    // 回到前台且有 PIN → 重新锁定
    showPinLock.value = true
    pinError.value = ''
    pinResetVersion.value++

    // 如果启用了 Biometric，尝试生物识别解锁
    if (hasBiometric) {
      tryBiometricUnlock()
    }
  } else {
    // 回到前台且无 PIN → 恢复解锁状态
    uiStore.unlocked = true
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)

  // 首次加载时尝试生物识别
  if (hasBiometric) {
    tryBiometricUnlock()
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>