<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useBreakpoints } from '@vueuse/core'
import { usePinLock } from '@/composables/usePinLock'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import DesktopLayout from '@/components/layout/DesktopLayout.vue'
import PinDialog from '@/components/common/PinDialog.vue'

const breakpoints = useBreakpoints({ mobile: 768 })
const isMobile = breakpoints.smaller('mobile')

const { isLocked, pinSet, verifyPin } = usePinLock()

// Auto-lock on visibility change (app resume)
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && pinSet.value) {
    isLocked.value = true
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

async function onPinConfirm(pin: string) {
  const ok = await verifyPin(pin)
  if (!ok) {
    // Will show error via PinDialog's internal logic
  }
}

function onCancel() {
  // On cancel, just keep locked
}
</script>

<template>
  <PinDialog
    v-if="isLocked"
    @confirm="onPinConfirm"
    @cancel="onCancel"
  />
  <MobileLayout v-else-if="isMobile" />
  <DesktopLayout v-else />
</template>