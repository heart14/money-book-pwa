<template>
  <!--
    这是一个基于 iOS 26 液态玻璃 (Liquid Glass) 视觉语言的沉浸式预览页。
    自包含、独立于业务；通过 /glass 访问。预览不影响任何业务页面。
  -->
  <div
    ref="stageEl"
    class="lg-stage"
    @pointermove="onSheenMove"
    @pointerleave="onSheenLeave"
  >
    <!-- 环境背景层：玻璃下方"被折射"的色彩环境 -->
    <div class="lg-backdrop" aria-hidden="true">
      <i class="lg-orb lg-orb--1"></i>
      <i class="lg-orb lg-orb--2"></i>
      <i class="lg-orb lg-orb--3"></i>
      <i class="lg-orb lg-orb--4"></i>
    </div>

    <!-- 顶部渐变玻璃条（贴合页面、营造连续玻璃） -->
    <div class="lg-topbar glass">
      <button class="lg-back" aria-label="返回" @click="goBack">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <div class="lg-topbar-title">
        <span class="lg-title">钱书 · Liquid Glass</span>
        <span class="lg-subtitle">iOS 26 液态玻璃视觉预览 · 移动设备或鼠标滑动查看折射</span>
      </div>
      <div class="lg-topbar-spacer" aria-hidden="true"></div>
    </div>

    <main class="lg-content">
      <!-- 主资产玻璃卡 -->
      <section class="lg-hero glass" :style="sheenStyle">
        <div class="lg-hero-top">
          <span class="lg-eyebrow">总资产</span>
          <span class="lg-chip">本月</span>
        </div>
        <p class="lg-amount">{{ formatCurrency(accountBalance) }}</p>
        <div class="lg-hero-foot">
          <span class="lg-delta up">▲ 本月 +¥3,280</span>
          <span class="lg-delta flat">结余稳健</span>
        </div>
      </section>

      <!-- 三栏统计玻璃卡 -->
      <section class="lg-stats">
        <div v-for="s in statItems" :key="s.label" class="lg-stat glass" :style="sheenStyle">
          <span class="lg-stat-icon">{{ s.icon }}</span>
          <span class="lg-stat-value">{{ s.value }}</span>
          <span class="lg-stat-label">{{ s.label }}</span>
        </div>
      </section>

      <!-- 分类玻璃行 -->
      <section class="lg-cards">
        <div class="lg-section-label">常用分类</div>
        <div v-for="c in categories" :key="c.name" class="lg-row glass" :style="sheenStyle">
          <span class="lg-row-icon glass-icon">{{ c.icon }}</span>
          <span class="lg-row-name">{{ c.name }}</span>
          <span class="lg-row-amount">{{ c.amount }}</span>
        </div>
      </section>

      <!-- 底部组件示例：浮动玻璃按钮 -->
      <div class="lg-actions">
        <div class="lg-fab glass-fab" :style="sheenStyle" @click="goBack">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        </div>
        <span class="lg-fab-hint">液态玻璃 FAB · 点击返回</span>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

function goBack() {
  // 预览页独立路由；优先返回来源，否则回到首页
  if (window.history.length > 1) router.back()
  else router.push('/booking')
}

const accountBalance = 128000 // 分

const statItems = [
  { icon: '📉', label: '本月支出', value: '¥4,820' },
  { icon: '📈', label: '本月收入', value: '¥8,100' },
  { icon: '💰', label: '结余', value: '¥3,280' },
]

const categories = [
  { icon: '🍽️', name: '餐饮', amount: '¥1,240' },
  { icon: '🚗', name: '交通', amount: '¥386' },
  { icon: '🛍️', name: '购物', amount: '¥2,010' },
  { icon: '🏠', name: '居住', amount: '¥1,180' },
]

// ── 跟随指针的镜面高光（液态反射） ──
const sheenStyle = ref<Record<string, string>>({})
function onSheenMove(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  sheenStyle.value = { animationName: 'none' }
  ;(e.currentTarget as HTMLElement).style.setProperty('--mx', `${x}px`)
  ;(e.currentTarget as HTMLElement).style.setProperty('--my', `${y}px`)
  ;(e.currentTarget as HTMLElement).classList.add('lg-hover')
}
function onSheenLeave(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).classList.remove('lg-hover')
}

// 页面滚动速度影响：让玻璃上的滚动高光更"液态"（增强动态）
const stageEl = useTemplateRef<HTMLElement>('stageEl') as any
let scrollHandler: (() => void) | null = null
onMounted(() => {
  scrollHandler = () => {
    const el = stageEl.value as HTMLElement | undefined
    if (el) el.style.setProperty('--scroll', String(window.scrollY || el.scrollTop || 0))
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
  scrollHandler()
})
onUnmounted(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
})
</script>

<style scoped>
/* ============================================================
   Liquid Glass（液态玻璃）核心样式
   ============================================================ */
.lg-stage {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow-y: auto;
  color: #1c1c1e;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --mx: 50%;
  --my: -20%;
}

/* ── 环境背景：玻璃下方的"可折射"彩色环境 ── */
.lg-backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(60% 50% at 15% 12%, rgba(96, 165, 250, 0.55), transparent 62%),
    radial-gradient(50% 42% at 88% 18%, rgba(244, 114, 182, 0.5), transparent 60%),
    radial-gradient(70% 60% at 20% 82%, rgba(129, 140, 248, 0.5), transparent 66%),
    radial-gradient(55% 55% at 85% 78%, rgba(94, 234, 212, 0.5), transparent 62%),
    linear-gradient(160deg, #cfe9ff 0%, #f9e6f4 38%, #e6ddff 66%, #d3f6f2 100%);
  filter: saturate(1.15);
}

/* 大光斑（模糊润色，增加环境深度） */
.lg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.7;
  pointer-events: none;
}
.lg-orb--1 { width: 40vw; height: 40vw; left: -8vw; top: -6vh; background: #7dd3fc66; }
.lg-orb--2 { width: 46vw; height: 46vw; right: -12vw; top: 12vh; background: #f9a8d466; }
.lg-orb--3 { width: 52vw; height: 52vw; left: 6vw; bottom: -14vh; background: #a5b4fc66; }
.lg-orb--4 { width: 34vw; height: 34vw; right: -4vw; bottom: -8vh; background: #5eead455; }

/* ── 玻璃材质基元 ── */
.glass {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.24));
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow:
    0 1px 1px rgba(255,255,255,0.7) inset,
    0 -1px 1px rgba(255,255,255,0.25) inset,
    0 24px 48px -16px rgba(60, 70, 140, 0.35),
    0 0 0 0.5px rgba(120, 140, 220, 0.06);
}
/* 顶部内高光条：强化玻璃体积感 */
.glass::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(80% 55% at 50% 0%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(120% 90% at 50% 110%, rgba(255,255,255,0.18), transparent 55%);
  opacity: 0.9;
  pointer-events: none;
}

/* 镜面高光：随指针移动（液态反射核心） */
.glass::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  background: radial-gradient(
    320px circle at var(--mx, 50%) var(--my, -20%),
    rgba(255, 255, 255, 0.65),
    rgba(255, 255, 255, 0) 42%
  );
  opacity: 0;
  transition: opacity 0.35s ease;
  mix-blend-mode: soft-light;
  pointer-events: none;
}
.glass.lg-hover::after { opacity: 1; }

/* 深色模式的玻璃 */
@media (prefers-color-scheme: dark) {
  .lg-stage { color: #f5f5f7; }
  .glass {
    background: linear-gradient(135deg, rgba(60,60,72,0.55), rgba(34,34,44,0.28));
    border-color: rgba(255,255,255,0.18);
    box-shadow:
      0 1px 1px rgba(255,255,255,0.22) inset,
      0 24px 48px -16px rgba(0,0,0,0.6),
      0 0 0 0.5px rgba(255,255,255,0.05);
  }
  .glass::before {
    background:
      radial-gradient(80% 55% at 50% 0%, rgba(255,255,255,0.18), transparent 55%),
      radial-gradient(120% 90% at 50% 110%, rgba(255,255,255,0.08), transparent 55%);
  }
  .glass::after { mix-blend-mode: overlay; }
}

/* ── 顶部栏 ── */
.lg-topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin: 12px 12px 4px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.12));
  backdrop-filter: blur(24px) saturate(170%);
  -webkit-backdrop-filter: blur(24px) saturate(170%);
}
.lg-back {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.3);
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, background 0.15s ease;
}
.lg-back:active { transform: scale(0.9); background: rgba(255,255,255,0.5); }
.lg-topbar-title { flex: 1; min-width: 0; }
.lg-title { display: block; font-size: 16px; font-weight: 700; letter-spacing: 0.2px; }
.lg-subtitle { display: block; font-size: 11px; opacity: 0.6; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lg-topbar-spacer { width: 34px; flex-shrink: 0; }

/* ── 内容 ── */
.lg-content {
  padding: 16px 16px 120px;
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 主资产卡 */
.lg-hero { padding: 22px 20px; display: flex; flex-direction: column; gap: 14px; }
.lg-hero-top { display: flex; align-items: center; justify-content: space-between; }
.lg-eyebrow { font-size: 13px; font-weight: 600; opacity: 0.65; }
.lg-chip {
  font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
  background: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.6);
}
.lg-amount { font-size: 42px; font-weight: 700; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
.lg-hero-foot { display: flex; gap: 12px; flex-wrap: wrap; }
.lg-delta { font-size: 12px; font-weight: 600; }
.lg-delta.up { color: #1f9d55; }
.lg-delta.flat { opacity: 0.7; }

/* 三栏统计 */
.lg-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.lg-stat {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  padding: 14px 14px; border-radius: 20px;
}
.lg-stat-icon { font-size: 18px; }
.lg-stat-value { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
.lg-stat-label { font-size: 11px; opacity: 0.6; }

/* 分类列表 */
.lg-section-label { font-size: 12px; font-weight: 600; opacity: 0.55; padding: 0 6px; }
.lg-cards { display: flex; flex-direction: column; gap: 10px; }
.lg-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 20px; cursor: pointer;
}
.lg-row-icon {
  display: grid; place-items: center; width: 40px; height: 40px; border-radius: 13px;
  background: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.6);
  font-size: 20px;
}
.lg-row-name { flex: 1; font-size: 15px; font-weight: 600; }
.lg-row-amount { font-size: 15px; font-weight: 700; opacity: 0.85; font-variant-numeric: tabular-nums; }

/* 浮动玻璃按钮 */
.lg-actions { margin-top: 8px; display: flex; align-items: center; gap: 16px; }
.lg-fab {
  display: grid; place-items: center; width: 58px; height: 58px; border-radius: 20px;
  background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3));
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow: 0 1px 1px rgba(255,255,255,0.7) inset, 0 16px 32px -10px rgba(60,70,140,0.4);
  color: #4f46e5;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
}
.lg-fab:active { transform: scale(0.92); }
.lg-fab-hint { font-size: 12px; opacity: 0.6; }
</style>