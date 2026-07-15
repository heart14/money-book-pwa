<template>
  <MobileLayout v-if="isMobile" />
  <DesktopLayout v-else />
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import DesktopLayout from '@/components/layout/DesktopLayout.vue'

const isMobile = useBreakpoints({ mobile: 768 }).smaller('mobile')
</script>