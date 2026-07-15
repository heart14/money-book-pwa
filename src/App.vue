<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import DesktopLayout from '@/components/layout/DesktopLayout.vue'

const breakpoints = useBreakpoints({ mobile: 768 })
const isMobile = breakpoints.smaller('mobile')
</script>

<template>
  <MobileLayout v-if="isMobile" />
  <DesktopLayout v-else />
</template>