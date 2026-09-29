<template>
  <div class="mobile-layout">
    <main class="mobile-content">
      <router-view />
    </main>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TabBar from './TabBar.vue'

/**
 * iOS standalone + 透明状态栏 + viewport-fit=cover 下，应用从后台回到前台时，
 * 视觉/布局视口在首帧可能暂时未就绪，导致排版错位（例如底部露出空白）。
 * 这里在回前台时强制触发一次文档重排（读 offsetHeight 同步布局），
 * 让浏览器立即按实际可视区重算，抹平瞬态差异。
 */
function forceReflow() {
  const tick = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void document.documentElement.offsetHeight
        window.scrollTo(window.scrollX, window.scrollY)
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
/* 采用 body(html) 原生滚动而非内滚动容器：
   - 与 PullToRefresh(依赖 window.scrollY===0 判断页顶) 天然兼容；
   - 页面随内容自然变长，由 window 负责滚动，
     避免“内滚动容器高度被视口单位锁定、iOS 回前台首帧视口错位”导致底部留白/顶部被推出。
   用 min-height 而非 height：页面至少占满一屏，内容多则自然向下延伸。 */
.mobile-layout {
  min-height: 100%;
  min-height: 100svh;
}

.mobile-content {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: 56px;
}
</style>