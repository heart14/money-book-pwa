<template>
  <span class="twemoji-icon" :class="sizeClass">
    <Icon v-if="iconData" :icon="iconData" />
    <span v-else class="twemoji-fallback">{{ emoji }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { IconifyIcon } from '@iconify/vue'
import { emojiToName, iconByName } from '@/utils/twemoji-bundle'

const props = withDefaults(defineProps<{
  emoji?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  emoji: '',
  size: 'md',
})

const iconData = computed<IconifyIcon | null>(() => {
  const iconName = emojiToName[props.emoji]
  if (!iconName) return null
  return iconByName[iconName] || null
})

const sizeClass = computed(() => `twemoji-${props.size}`)
</script>

<style scoped>
.twemoji-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.twemoji-icon :deep(svg) {
  display: block;
}

.twemoji-fallback {
  line-height: 1;
}

/* Size variants */
.twemoji-sm :deep(svg),
.twemoji-sm .twemoji-fallback {
  width: 1em;
  height: 1em;
  font-size: 0.9em;
}

.twemoji-md :deep(svg),
.twemoji-md .twemoji-fallback {
  width: 1.1em;
  height: 1.1em;
  font-size: 1em;
}

.twemoji-lg :deep(svg),
.twemoji-lg .twemoji-fallback {
  width: 1.3em;
  height: 1.3em;
  font-size: 1.15em;
}
</style>