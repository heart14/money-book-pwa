import { onMounted, onUnmounted } from 'vue'

/**
 * 全局"液态镜面高光"（Liquid Glass sheen）。
 *
 * 在 App 根级挂载：单个固定在视口上的高光层，跟随指针移动，
 * 用 mix-blend-mode 与卡片/环境产生"光线掠过玻璃"的折射感。
 * 只有在指针（鼠标/触摸拖拽）存在时点亮，松手/静止后淡出。
 * 不支持 backdrop-filter、或开启"减少动态效果"时自动关闭。
 */
export function useLiquidSheen() {
  let el: HTMLDivElement | null = null
  let rafId = 0

  function canSheen(): boolean {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false
    }
    const style = document.documentElement?.style
    return Boolean(style && ('backdropFilter' in style || 'webkitBackdropFilter' in style))
  }

  // rAF 节流：把高频 pointermove 合并到下一帧再写布局属性
  let pendingX = 0
  let pendingY = 0
  let hasPending = false

  function flush() {
    rafId = 0
    if (!el || !hasPending) return
    el.style.setProperty('--sx', `${pendingX}px`)
    el.style.setProperty('--sy', `${pendingY}px`)
    el.classList.add('is-active')
    hasPending = false
  }

  function scheduleSet(x: number, y: number) {
    pendingX = x
    pendingY = y
    hasPending = true
    if (rafId) return
    rafId = window.requestAnimationFrame(flush)
  }

  function onPointerMove(e: PointerEvent) {
    if (el) scheduleSet(e.clientX, e.clientY)
  }

  function onPointerEnd() {
    if (!el) return
    el.classList.remove('is-active')
  }

  onMounted(() => {
    if (!canSheen()) return
    el = document.createElement('div')
    el.className = 'liquid-sheen'
    document.body.appendChild(el)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerEnd, { passive: true })
    window.addEventListener('pointerleave', onPointerEnd, { passive: true })
    document.addEventListener('pointercancel', onPointerEnd, { passive: true })
  })

  onUnmounted(() => {
    if (rafId) window.cancelAnimationFrame(rafId)
    if (el) {
      el.remove()
      el = null
    }
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerEnd)
    window.removeEventListener('pointerleave', onPointerEnd)
    document.removeEventListener('pointercancel', onPointerEnd)
  })
}