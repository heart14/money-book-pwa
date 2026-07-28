<template>
  <span
    class="twemoji-icon"
    :class="$attrs.class"
    :style="iconStyle"
  >
    <span v-if="processedSvg" v-html="processedSvg" />
    <span v-else class="twemoji-icon--fallback">{{ emoji }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { emojiToCodepoint } from '@/utils/emoji'
import { getSvgContent } from '@/assets/twemoji'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  emoji: string
  size?: number | string
}>(), {
  size: 24,
})

const iconStyle = computed(() => {
  const px = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: px,
    height: px,
  }
})

const processedSvg = computed(() => {
  if (!props.emoji) return null
  const cp = emojiToCodepoint(props.emoji)
  if (!cp) return null
  const raw = getSvgContent(cp)
  if (!raw) return null
  // 移除 SVG 根标签上的 width/height 属性，让 CSS 控制尺寸
  return raw.replace(/<svg([^>]*?)\s+(?:width|height)="[^"]*"/g, '<svg$1')
})
</script>

<style scoped>
.twemoji-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}
.twemoji-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
.twemoji-icon--fallback {
  font-size: inherit;
  text-align: center;
}
</style>