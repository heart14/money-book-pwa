<template>
  <!-- 方向 A：真·液态玻璃 + 化繁为简。
       材质移植自 /glass 的 GlassDemoPage（逐元素指针镜面、分层内高光、强 blur、环境光斑）。
       布局上把记账页"拆开、放大间距、聚焦"：模式分段控件 + 独立金额 hero + 分类整卡 + 输入分组卡，
       数字键盘做成真正的底部浮层（不再用内联 280px 占位），让一屏只承载几件事。 -->
  <div class="pa-stage">
    <div class="pa-backdrop" aria-hidden="true">
      <i class="pa-orb pa-orb--1"></i>
      <i class="pa-orb pa-orb--2"></i>
      <i class="pa-orb pa-orb--3"></i>
      <i class="pa-orb pa-orb--4"></i>
    </div>

    <main class="pa-content">
      <!-- 模式分段控件 + 撤销 -->
      <div class="pa-header">
        <div class="pa-seg">
          <button
            v-for="m in modes"
            :key="m"
            class="pa-seg-btn"
            :class="{ active: bookingState.mode === m }"
            @click="bookingState.mode = m"
          >{{ modeLabel[m] }}</button>
        </div>
        <button class="pa-undo" title="撤销" @click="reset">&nbsp;</button>
      </div>

      <!-- 金额 hero（独立一块，点它弹键盘） -->
      <section
        class="p-glass pa-sheen hero"
        @pointermove="sheenX"
        @pointerleave="sheenOff"
        @click="bookingState.keyboardVisible = true"
      >
        <span class="hero-eyebrow">本次金额</span>
        <p class="hero-amount">{{ amountText }}</p>
        <div class="hero-meta">
          <span>{{ today }}</span>
          <span class="hero-dot">·</span>
          <span>{{ nowTime }}</span>
        </div>
      </section>

      <!-- 分类整卡 -->
      <section
        class="p-glass pa-sheen"
        @pointermove="sheenX"
        @pointerleave="sheenOff"
      >
        <div class="card-label">选择分类</div>
        <div class="pa-parents">
          <button
            v-for="p in currentParents"
            :key="p.id"
            class="pa-parent"
            :class="{ selected: bookingState.selectedParentId === p.id }"
            @click="selectParent(p)"
          >
            <span class="pa-parent-icon">{{ p.icon }}</span>
            <span class="pa-parent-name">{{ p.name }}</span>
          </button>
        </div>
        <div v-if="currentChildren.length" class="pa-children">
          <button
            v-for="c in currentChildren"
            :key="c.id"
            class="pa-child"
            :class="{ active: bookingState.selectedChildId === c.id }"
            @click="bookingState.selectedChildId = c.id"
          >{{ c.name }}</button>
        </div>
      </section>

      <!-- 输入分组卡 -->
      <section class="p-glass pa-inputs">
        <div class="input-row"><input class="pa-input" placeholder="标题（可选）" maxlength="30" /></div>
        <div class="input-row"><input class="pa-input" placeholder="备注（可选）" maxlength="100" /></div>
      </section>

      <!-- 快记气泡 -->
      <section v-if="visibleTemplates.length" class="pa-tpls">
        <div class="card-label">快记</div>
        <div class="pa-tpl-row">
          <button
            v-for="t in visibleTemplates"
            :key="t.name"
            class="pa-tpl p-glass pa-sheen"
            @pointermove="sheenX"
            @pointerleave="sheenOff"
            @click="applyTemplate(t)"
          >
            <span class="pa-tpl-icon">{{ t.icon }}</span>
            <span class="pa-tpl-name">{{ t.name }}</span>
            <span class="pa-tpl-amount">{{ t.amount }}</span>
          </button>
        </div>
      </section>
    </main>

    <!-- 数字键盘底部浮层 -->
    <Transition name="pa-sheet">
      <div v-if="bookingState.keyboardVisible" class="pa-kb">
        <div class="pa-kb-grip"></div>
        <div class="pa-kb-grid">
          <button v-for="k in keyLayout()" :key="k" class="p-glass pa-sheen pa-key" :class="k" @pointermove="sheenX" @pointerleave="sheenOff" @click="keyPress(k)">
            <span v-if="k !== 'del'">{{ k }}</span>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
          </button>
        </div>
        <button class="pa-save" @click="doSave">保存 · {{ amountText }}</button>
      </div>
    </Transition>

    <!-- 保存 toast -->
    <Transition name="pa-toast">
      <div v-if="toast" class="pa-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { bookingState, modeLabel, displayAmount, keyPress, keyLayout, type Mode } from './state'
import { parentsFor, childrenFor, mockTemplates, type MockCategory } from './mock'

const modes: Mode[] = ['expense', 'income', 'transfer']

const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

const amountText = computed(() => displayAmount(bookingState.input))

const currentParents = computed(() => parentsFor(bookingState.mode))
const currentChildren = computed(() =>
  bookingState.selectedParentId == null
    ? []
    : childrenFor(bookingState.mode, bookingState.selectedParentId),
)

const visibleTemplates = computed(() =>
  mockTemplates.filter((t) => t.type === bookingState.mode).slice(0, 6),
)

function selectParent(p: MockCategory) {
  bookingState.selectedParentId = p.id
  bookingState.selectedChildId = null
  const kids = childrenFor(bookingState.mode, p.id)
  if (kids.length === 1) bookingState.selectedChildId = kids[0].id
}

function applyTemplate(t: { type: Mode; amount: string; name: string; icon: string }) {
  bookingState.mode = t.type
  bookingState.input = t.amount.replace(/[¥,]/g, '').replace('.00', '')
  const cat = parentsFor(t.type)[0]
  if (cat) { bookingState.selectedParentId = cat.id; bookingState.selectedChildId = cat.children?.[0]?.id ?? null }
}

function reset() {
  bookingState.input = '0'
  bookingState.selectedParentId = null
  bookingState.selectedChildId = null
}

const toast = ref('')
let toastTimer = 0
function doSave() {
  if (bookingState.input === '0') { toast.value = '请先输入金额'; show(); return }
  const label = modeLabel[bookingState.mode]
  toast.value = `${label}已记录 · ${amountText.value}`
  show()
}
function show() {
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = '' }, 1800)
}

// ── 逐元素指针镜面（液态反射） ──
function sheenX(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - r.left}px`)
  el.style.setProperty('--my', `${e.clientY - r.top}px`)
  el.classList.add('pa-hover')
}
function sheenOff(e: MouseEvent) {
  ;(e.currentTarget as HTMLElement).classList.remove('pa-hover')
}
</script>

<style scoped>
.pa-stage {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  color: #1c1c1e;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --mx: 50%;
  --my: -20%;
}

/* ── 环境背景（不透明，作为玻璃折射来源；absolutely 铺满 stage） ── */
.pa-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(60% 50% at 15% 12%, rgba(96, 165, 250, 0.5), transparent 62%),
    radial-gradient(50% 42% at 88% 18%, rgba(244, 114, 182, 0.44), transparent 60%),
    radial-gradient(70% 60% at 20% 82%, rgba(129, 140, 248, 0.46), transparent 66%),
    radial-gradient(55% 55% at 85% 78%, rgba(94, 234, 212, 0.44), transparent 62%),
    linear-gradient(160deg, #cfe9ff 0%, #f9e6f4 38%, #e6ddff 66%, #d3f6f2 100%);
  filter: saturate(1.12);
}
.pa-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.72; pointer-events: none; }
.pa-orb--1 { width: 40vw; height: 40vw; left: -8vw; top: -6vh; background: #7dd3fc66; }
.pa-orb--2 { width: 46vw; height: 46vw; right: -12vw; top: 12vh; background: #f9a8d466; }
.pa-orb--3 { width: 52vw; height: 52vw; left: 6vw; bottom: -14vh; background: #c3b5fd66; }
.pa-orb--4 { width: 34vw; height: 34vw; right: -4vw; bottom: -8vh; background: #5eead455; }

/* ── 玻璃材质基元（真液态玻璃） ── */
.p-glass {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.24));
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow:
    0 1px 1px rgba(255, 255, 255, 0.7) inset,
    0 -1px 1px rgba(255, 255, 255, 0.25) inset,
    0 24px 48px -16px rgba(60, 70, 140, 0.3),
    0 0 0 0.5px rgba(120, 140, 220, 0.06);
}
.p-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(80% 55% at 50% 0%, rgba(255, 255, 255, 0.5), transparent 55%),
    radial-gradient(120% 90% at 50% 110%, rgba(255, 255, 255, 0.16), transparent 55%);
}
.pa-sheen::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: radial-gradient(
    320px circle at var(--mx, 50%) var(--my, -20%),
    rgba(255, 255, 255, 0.62),
    rgba(255, 255, 255, 0) 42%
  );
  opacity: 0;
  transition: opacity 0.35s ease;
  mix-blend-mode: soft-light;
}
.pa-sheen.pa-hover::after { opacity: 1; }

/* ── 布局容器 ── */
.pa-content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 20px 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 头：分段控件 + 撤销 */
.pa-header { display: flex; align-items: center; gap: 12px; }
.pa-seg {
  flex: 1;
  display: flex;
  padding: 4px;
  gap: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(16px) saturate(170%);
  -webkit-backdrop-filter: blur(16px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.pa-seg-btn {
  flex: 1;
  padding: 9px 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: rgba(28, 28, 30, 0.7);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s, color 0.2s;
}
.pa-seg-btn.active { background: rgba(255, 255, 255, 0.85); color: #1c1c1e; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); }
.pa-undo { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.6); background: rgba(255,255,255,0.4); }

/* 金额 hero */
.hero { padding: 26px 24px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
.hero-eyebrow { font-size: 13px; font-weight: 600; opacity: 0.6; }
.hero-amount { font-size: 52px; font-weight: 700; letter-spacing: -1px; font-variant-numeric: tabular-nums; line-height: 1.05; }
.hero-meta { display: flex; gap: 8px; font-size: 12px; opacity: 0.6; font-variant-numeric: tabular-nums; }
.hero-dot { opacity: 0.5; }

/* 分类卡 */
.card-label { font-size: 12px; font-weight: 600; opacity: 0.6; padding: 0 4px; margin-bottom: 8px; }
.pa-parents { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 4px; }
.pa-parent {
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  padding: 14px 0; border: none; border-radius: 18px; background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  cursor: pointer; transition: background 0.15s, transform 0.12s; -webkit-tap-highlight-color: transparent;
}
.pa-parent:active { transform: scale(0.95); }
.pa-parent.selected { background: #007aff; color: #fff; box-shadow: 0 10px 24px -10px rgba(0, 122, 255, 0.6); }
.pa-parent-icon { font-size: 26px; line-height: 1; }
.pa-parent-name { font-size: 11px; font-weight: 500; line-height: 1.1; }
.pa-parent.selected .pa-parent-name { color: #fff; }

.pa-children { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 4px 2px; margin-top: 10px; }
.pa-child { padding: 7px 16px; border: none; border-radius: 999px; background: rgba(255, 255, 255, 0.45); font-size: 13px; font-weight: 500; color: #1c1c1e; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pa-child.active { background: #007aff; color: #fff; }

/* 输入分组卡 */
.pa-inputs { padding: 4px 18px; }
.input-row { padding: 13px 0; }
.input-row + .input-row { border-top: 1px solid rgba(255, 255, 255, 0.45); }
.pa-input { width: 100%; border: none; background: transparent; font-size: 14px; color: inherit; outline: none; font-family: inherit; }
.pa-input::placeholder { color: rgba(28, 28, 30, 0.45); }

/* 快记气泡 */
.pa-tpl-row { display: flex; flex-wrap: wrap; gap: 10px; }
.pa-tpl { display: inline-flex; align-items: center; gap: 7px; padding: 12px 16px; border: none; cursor: pointer; border-radius: 18px; background: linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.22)); }
.pa-tpl-icon { font-size: 20px; }
.pa-tpl-name { font-size: 13px; font-weight: 600; }
.pa-tpl-amount { font-size: 12px; opacity: 0.6; font-variant-numeric: tabular-nums; }

/* 数字键盘浮层 */
.pa-kb {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 10;
  padding: 12px 14px calc(14px + env(safe-area-inset-bottom, 0px));
  border-radius: 26px 26px 0 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.28));
  backdrop-filter: blur(26px) saturate(180%);
  -webkit-backdrop-filter: blur(26px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.66);
  box-shadow: 0 1px 1px rgba(255,255,255,0.7) inset, 0 24px 50px -18px rgba(40, 50, 110, 0.5);
}
.pa-kb-grip { width: 44px; height: 4px; border-radius: 2px; background: rgba(0, 0, 0, 0.18); margin: 2px auto 12px; }
.pa-kb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.pa-key { height: 54px; border: none; border-radius: 18px; font-size: 22px; font-weight: 600; color: #1c1c1e; cursor: pointer; background: linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,255,255,0.3)); -webkit-tap-highlight-color: transparent; }
.pa-key:active { transform: scale(0.94); }
.pa-save { margin-top: 12px; width: 100%; height: 52px; border: none; border-radius: 18px; background: #007aff; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 12px 26px -10px rgba(0, 122, 255, 0.6); -webkit-tap-highlight-color: transparent; }

/* toast */
.pa-toast {
  position: absolute; left: 50%; bottom: 240px; transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78); color: #fff; font-size: 14px; font-weight: 500;
  padding: 10px 22px; border-radius: 999px; z-index: 30; white-space: nowrap;
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
}

/* 过渡 */
.pa-sheet-enter-active, .pa-sheet-leave-active { transition: transform 0.25s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.2s; }
.pa-sheet-enter-from, .pa-sheet-leave-to { transform: translateY(30px); opacity: 0; }
.pa-toast-enter-active { transition: all 0.2s ease; }
.pa-toast-leave-active { transition: all 0.25s ease; }
.pa-toast-enter-from, .pa-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

/* ── 深色 ── */
@media (prefers-color-scheme: dark) {
  .pa-stage { color: #f5f5f7; }
  .pa-backdrop {
    background:
      radial-gradient(60% 50% at 15% 12%, rgba(37, 99, 235, 0.4), transparent 62%),
      radial-gradient(50% 42% at 88% 18%, rgba(190, 24, 93, 0.3), transparent 60%),
      radial-gradient(70% 60% at 20% 82%, rgba(76, 29, 149, 0.4), transparent 66%),
      radial-gradient(55% 55% at 85% 78%, rgba(13, 148, 136, 0.32), transparent 62%),
      linear-gradient(160deg, #0e1020 0%, #1c1224 38%, #141230 66%, #0c1e20 100%);
    filter: saturate(1.05);
  }
  .pa-orb--1 { background: #1d4ed833; } .pa-orb--2 { background: #be185d33; }
  .pa-orb--3 { background: #5b21b63d; } .pa-orb--4 { background: #0d948833; }
  .p-glass {
    background: linear-gradient(135deg, rgba(60, 60, 78, 0.5), rgba(30, 30, 42, 0.26));
    border-color: rgba(255, 255, 255, 0.16);
    box-shadow: 0 1px 1px rgba(255,255,255,0.2) inset, 0 24px 48px -16px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04);
  }
  .p-glass::before { background: radial-gradient(80% 55% at 50% 0%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(120% 90% at 50% 110%, rgba(255,255,255,0.07), transparent 55%); }
  .pa-sheen::after { mix-blend-mode: overlay; }
  .pa-seg { background: rgba(255, 255, 255, 0.1); border-color: rgba(255,255,255,0.16); }
  .pa-seg-btn { color: rgba(245, 245, 247, 0.7); }
  .pa-seg-btn.active { background: rgba(255, 255, 255, 0.16); color: #fff; box-shadow: none; }
  .pa-undo { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); }
  .pa-parent { background: rgba(255, 255, 255, 0.08); }
  .pa-parent.selected { background: #0a84ff; }
  .pa-child { background: rgba(255, 255, 255, 0.1); color: #f5f5f7; }
  .pa-child.active { background: #0a84ff; }
  .pa-input::placeholder { color: rgba(245, 245, 247, 0.45); }
  .input-row + .input-row { border-top-color: rgba(255, 255, 255, 0.12); }
  .pa-kb { background: linear-gradient(135deg, rgba(44, 44, 56, 0.7), rgba(28, 28, 36, 0.4)); border-color: rgba(255,255,255,0.18); }
  .pa-kb-grip { background: rgba(255, 255, 255, 0.28); }
  .pa-key { color: #f5f5f7; background: linear-gradient(135deg, rgba(70,70,90,0.55), rgba(40,40,52,0.35)); }
  .pa-save { background: #0a84ff; }
}
</style>