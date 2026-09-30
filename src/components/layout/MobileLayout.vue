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

/* ── 拦截浏览器/系统的“边缘滑动前进/后退”(edge swipe navigation) ──
   用户从屏幕左/右边缘横向滑动时，Chrome/Edge/Safari 会在系统层面接管手势，
   触发 history.back()/history.forward()。因为本应用用 HTML5 History 路由
   (createWebHistory)，每次 TabBar router.push() 都会往 history 栈压入记录，
   于是左右滑动直接从浏览器层面“滑着切换 Tab 页面”，绕过底部导航栏。
   overscroll-behavior-x 在部分移动 WebView/Chrome 上并不约束该历史导航手势，
   故在文档根部对手势做兜底：仅当触摸起点落在屏幕左/右边缘带、且手势呈横向
   主导时 preventDefault，阻断浏览器接管。它不影响页面自身垂直滚动，也不影响
   各应用自定义手势（touchend 照常派发，记账页的滑动切换用的是 DOM 手势）。 */
const EDGE_ZONE = 22                       // 距屏幕左/右边缘 22px 视为边缘手势
const MIN_SWIPE = 24                       // 触发拦截的最小横向位移
let startX = 0
let startY = 0
let armed = false

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  const nearEdge = t.clientX <= EDGE_ZONE || window.innerWidth - t.clientX <= EDGE_ZONE
  // 边缘开启拦截，但纵向晃动不算；中部滑动（记账页模式切换等）完全放行
  if (nearEdge) {
    startX = t.clientX
    startY = t.clientY
    armed = true
  } else {
    armed = false
  }
}

function onTouchMove(e: TouchEvent) {
  if (!armed) return
  const t = e.touches[0]
  if (!t) return
  const dx = t.clientX - startX
  const dy = Math.abs(t.clientY - startY)
  // 仅横向主导（横向位移明显大于纵向）才视作“历史滑动”倾向
  if (Math.abs(dx) > MIN_SWIPE && Math.abs(dx) > dy * 1.5) {
    e.preventDefault() // 阻止浏览器接管该手势触发前进/后退
    armed = false      // 一次性拦截，之后放行后续移动
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pageshow', onVisibility)
  // 需在非 passive 模式下监听 touchmove 才能调用 preventDefault
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchmove', onTouchMove, { passive: false })
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pageshow', onVisibility)
  document.removeEventListener('touchstart', onTouchStart)
  document.removeEventListener('touchmove', onTouchMove)
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