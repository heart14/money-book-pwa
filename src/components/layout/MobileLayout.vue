<template>
  <div class="mobile-layout">
    <main ref="contentRef" class="mobile-content">
      <router-view />
    </main>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TabBar from './TabBar.vue'

// 主滚动容器
const contentRef = ref<HTMLElement | null>(null)

/**
 * iOS standalone + 透明状态栏 + viewport-fit=cover 下，应用从后台回到前台时，
 * 布局/视觉视口在首帧会暂时错位（report 的 svh/dvh 偏小），
 * 导致页面底部露出一段空白，需手动滑动触发重排才会贴合。
 * 这里在回前台时强制触发一次重排（读 offsetHeight 强制同步布局），
 * 把“手动滑一下才能恢复”的动作自动化，抹平这一瞬态差异。
 */
function forceReflow() {
  const tick = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = contentRef.value
        if (!el) return
        // 强制同步布局，让浏览器重新计算容器与视口尺寸
        void el.offsetHeight
        // scrollTop 若已越界则回正到有效范围，保持视觉贴合
        el.scrollTop = el.scrollTop
      })
    })
  }
  tick()
  setTimeout(tick, 60)
}

function onVisibility() {
  if (!document.hidden) forceReflow()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pageshow', onVisibility)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pageshow', onVisibility)
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  /* 100svh 为静态“小视口高度”：standalone 无浏览器侧工具栏时恒定 = 整屏(含安全区)。
     相比 100dvh，不会在“回前台”首帧报一个偏小的瞬时值（那是底部空白、需滑动才贴合的根源） */
  height: 100%;
  height: 100svh;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: 56px;
  -webkit-overflow-scrolling: touch;
}
</style>