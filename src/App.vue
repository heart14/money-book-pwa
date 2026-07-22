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
  <MobileLayout v-if="isMobile && uiStore.unlocked" />
  <DesktopLayout v-else-if="!isMobile && uiStore.unlocked" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBreakpoints } from '@vueuse/core'
import { useUiStore } from '@/stores/uiStore'
import { hashPIN, getStoredPINHash } from '@/utils/crypto'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import DesktopLayout from '@/components/layout/DesktopLayout.vue'
import PinDialog from '@/components/common/PinDialog.vue'

const uiStore = useUiStore()
const isMobile = useBreakpoints({ mobile: 768 }).smaller('mobile')

// ── PIN lock state (同步初始化, 无闪烁) ──
const hasPin = !!getStoredPINHash()
uiStore.unlocked = !hasPin
const showPinLock = ref(hasPin)
const pinError = ref('')
const pinResetVersion = ref(0)

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
    // 回到前台且有 PIN → 重新锁定 + 清空部分输入
    showPinLock.value = true
    pinError.value = ''
    pinResetVersion.value++
  } else {
    // 回到前台且无 PIN → 恢复解锁状态
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