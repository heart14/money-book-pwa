<template>
  <div class="bk" ref="rootEl">
    <div class="bk-screen" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <!-- 顶部语境：日期 + 简洁句 -->
      <header class="bk-top">
        <span class="bk-date">{{ dateStr }}</span>
        <span class="bk-mode-tag" :class="`tag-${mode}`">{{ modeLabel[mode] }}</span>
      </header>

      <!-- 全屏大金额：点击唤起键盘 -->
      <div class="bk-amount-zone" @click="kbOpen = true">
        <p class="bk-modal-hint">记一笔{{ modeLabel[mode] }}</p>
        <p class="num bk-amount" :class="mode === 'expense' ? 'c-exp' : mode === 'income' ? 'c-inc' : ''">{{ amountText }}</p>
        <p class="bk-tap-hint">点数字录入 · 左右滑切换类别</p>
      </div>

      <!-- 分类触发区：沉浸式网格，点开底部半屏九宫格 -->
      <section class="bk-cat-zone">
        <div class="bk-label-row">
          <span class="bk-label">选择分类</span>
          <button class="bk-open-btn" @click="sheetOpen = true">{{ selName || '展开九宫格' }}<i>›</i></button>
        </div>
        <!-- 主分类大图标横排（当前选中态） -->
        <div class="bk-prev-grid">
          <button
            v-for="p in parents"
            :key="p.id"
            class="bk-tile"
            :class="{ sel: selParent === p.id }"
            @click="quickPick(p)"
          >
            <span class="bk-tile-icon">{{ p.icon }}</span>
            <span class="bk-tile-name">{{ p.name }}</span>
          </button>
        </div>
      </section>

      <!-- 标题 / 备注 / 快记：沉浸折叠区 -->
      <section class="bk-fields">
        <div class="bk-field"><span class="bk-field-tag">标题</span><input class="bk-input" placeholder="给这笔记账加个标题" /></div>
        <div class="bk-field"><span class="bk-field-tag">备注</span><input class="bk-input" placeholder="备注（可选）" /></div>
      </section>
      <section v-if="templatesType.length" class="bk-block">
        <div class="bk-label">快记</div>
        <div class="bk-tpls">
          <button v-for="t in templatesType" :key="t.name" class="bk-tpl" @click="applyTemplate(t)">
            <span class="bk-tpl-icon">{{ t.icon }}</span>
            <span class="bk-tpl-name">{{ t.name }}</span>
            <span class="num bk-tpl-amt">{{ t.amount }}</span>
          </button>
        </div>
      </section>
    </div>

    <!-- 结算栏：沉浸把手，确认入账 -->
    <footer class="bk-commit" @click="save">
      <span class="bk-commit-label">记入账</span>
      <span class="num bk-commit-amt" :class="mode === 'expense' ? 'c-exp' : mode === 'income' ? 'c-inc' : ''">{{ amountText }}</span>
    </footer>

    <!-- 底部半屏分类九宫格（沉浸选择，像打车选目的地） -->
    <Transition name="rs-sheet-up">
      <div v-if="sheetOpen" class="bk-sheet-backdrop" @click="sheetOpen = false">
        <div class="bk-sheet" @click.stop>
          <div class="rs-handle" />
          <div class="bk-sheet-title">选择{{ modeLabel[mode] }}分类</div>
          <div class="bk-sheet-grid">
            <button
              v-for="p in parents"
              :key="p.id"
              class="bk-big-tile"
              :class="{ sel: selParent === p.id }"
              @click="pickParent(p)"
            >
              <span class="bk-big-icon">{{ p.icon }}</span>
              <span class="bk-big-name">{{ p.name }}</span>
            </button>
          </div>
          <div v-if="children.length" class="bk-sheet-chips">
            <button
              v-for="c in children"
              :key="c.id"
              class="bk-chip"
              :class="{ on: selChild === c.id }"
              @click="pickChild(c)"
            >{{ c.name }}</button>
          </div>
          <button class="bk-done" @click="sheetOpen = false">完成</button>
        </div>
      </div>
    </Transition>

    <!-- 数字键盘浮层 -->
    <Transition name="rs-sheet-up">
      <div v-if="kbOpen" class="bk-kb" @click.self="kbOpen = false">
        <div class="bk-kb-inner" @click.stop>
          <div class="rs-handle" />
          <div class="num bk-kb-preview" :class="mode === 'expense' ? 'c-exp' : mode === 'income' ? 'c-inc' : ''">{{ amountText }}</div>
          <div class="bk-kb-grid">
            <button v-for="k in keys" :key="k" class="num bk-key" :class="k" @click="press(k)">
              <span v-if="k !== 'del'">{{ k }}</span>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="17" y1="9" x2="13" y2="15"/><line x1="13" y1="9" x2="17" y2="15"/></svg>
            </button>
          </div>
          <button class="bk-kb-done" @click="kbOpen = false">完成</button>
        </div>
      </div>
    </Transition>

    <Transition name="bk-toast">
      <div v-if="toast" class="bk-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { mockCats as cats, mockTemplates } from '../mock'

const modes = ['income', 'expense', 'transfer'] as const
type Mode = (typeof modes)[number]
const modeLabel: Record<Mode, string> = { income: '收入', expense: '支出', transfer: '转账' }

const mode = ref<Mode>('expense')
const input = ref('0')
const kbOpen = ref(false)
const sheetOpen = ref(false)
const selParent = ref<number | null>(null)
const selChild = ref<number | null>(null)

const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' })

const amountText = computed(() => {
  const v = input.value
  if (v === '0') return '¥0.00'
  if (v.includes('.')) {
    const [i, d = ''] = v.split('.')
    const fi = i ? parseInt(i).toLocaleString('zh-CN') : '0'
    return d === '' ? `¥${fi}.00` : `¥${fi}.${d.padEnd(2, '0')}`
  }
  return `¥${parseInt(v).toLocaleString('zh-CN')}`
})

const parents = computed(() => cats[mode.value])
const children = computed(() =>
  selParent.value == null ? [] : (cats[mode.value].find((p) => p.id === selParent.value)?.children ?? []),
)
const templatesType = computed(() => mockTemplates.filter((t) => t.type === mode.value).slice(0, 6))
const selName = computed(() => {
  const p = cats[mode.value].find((c) => c.id === selParent.value)
  if (!p) return ''
  const c = p.children?.find((x) => x.id === selChild.value)
  return c ? p.name + ' · ' + c.name : p.name
})

// ── 手势切换模态：左滑下一类，右滑上一类 ──
let startX = 0
function onTouchStart(e: TouchEvent) { startX = e.touches[0].clientX }
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - startX
  const idx = modes.indexOf(mode.value)
  if (dx < -60 && idx < modes.length - 1) mode.value = modes[idx + 1]
  else if (dx > 60 && idx > 0) mode.value = modes[idx - 1]
}

function quickPick(p: { id: number; children?: { id: number }[] }) {
  selParent.value = p.id
  selChild.value = null
  if (p.children?.length === 1) selChild.value = p.children[0].id
}
function pickParent(p: { id: number; children?: { id: number }[] }) { quickPick(p); if (p.children?.length) return }
function pickChild(c: { id: number }) { selChild.value = c.id }

function applyTemplate(t: { type: Mode; amount: string }) {
  mode.value = t.type
  input.value = t.amount.replace(/[¥,]/g, '').replace('.00', '')
  const p = cats[t.type][0]
  if (p) { selParent.value = p.id; selChild.value = p.children?.[0]?.id ?? null }
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']
function press(k: string) {
  if (k === 'del') input.value = input.value.length <= 1 ? '0' : input.value.slice(0, -1)
  else if (k === '.') { if (!input.value.includes('.')) input.value += '.' }
  else input.value = input.value === '0' ? k : (input.value.length < 9 ? input.value + k : input.value)
}

const toast = ref('')
let timer = 0
function save() {
  if (input.value === '0') { toast.value = '先输入金额再保存'; show(); return }
  toast.value = `${modeLabel[mode.value]}已入账 · ${amountText.value}`
  show()
  input.value = '0'; selParent.value = null; selChild.value = null
}
function show() { clearTimeout(timer); timer = window.setTimeout(() => (toast.value = ''), 1800) }
</script>

<style scoped>
.bk { position: relative; height: 100%; display: flex; flex-direction: column; }
.bk-screen { flex: 1; overflow-y: auto; padding: 14px 24px 32px; -webkit-overflow-scrolling: touch; }

.bk-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.bk-date { font-size: 12px; color: var(--ink3); }
.bk-mode-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.4px; padding: 4px 12px; border-radius: 999px; background: var(--act-bg); color: var(--ink2); }
.bk-mode-tag.tag-expense { color: var(--exp); background: color-mix(in srgb, var(--exp) 12%, transparent); }
.bk-mode-tag.tag-income { color: var(--inc); background: color-mix(in srgb, var(--inc) 12%, transparent); }

/* 全屏大金额 */
.bk-amount-zone { text-align: center; padding: 46px 0 40px; cursor: text; }
.bk-modal-hint { font-size: 13px; font-weight: 600; color: var(--ink3); letter-spacing: 0.6px; }
.bk-amount { font-size: 84px; font-weight: 800; line-height: 1.02; margin: 14px 0 12px; letter-spacing: -0.04em; color: var(--ink); }
.bk-amount.c-inc { color: var(--inc); }
.bk-amount.c-exp { color: var(--exp); }
.bk-tap-hint { font-size: 11px; color: var(--ink3); }

/* 分类触发区 */
.bk-cat-zone { margin-bottom: 28px; }
.bk-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.bk-label { font-size: 13px; font-weight: 600; color: var(--ink2); }
.bk-open-btn { border: none; background: none; font-size: 12px; font-weight: 600; color: var(--ink); cursor: pointer; display: inline-flex; align-items: center; gap: 2px; padding: 6px 12px; border-radius: 999px; background: var(--act-bg); }
.bk-open-btn i { font-style: normal; font-size: 14px; }

.bk-prev-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.bk-tile { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 0; background: none; border: 1px solid var(--line); border-radius: 14px; cursor: pointer; transition: transform 0.12s; }
.bk-tile:active { transform: scale(0.95); }
.bk-tile-icon { font-size: 24px; line-height: 1; }
.bk-tile-name { font-size: 11px; color: var(--ink2); font-weight: 500; line-height: 1.1; }
.bk-tile.sel { background: var(--ink); border-color: var(--ink); }
.bk-tile.sel .bk-tile-name { color: var(--accent-fg); }

/* 输入 + 快记 */
.bk-fields { margin-bottom: 24px; }
.bk-field { display: flex; align-items: center; gap: 12px; padding: 15px 0; border-bottom: 1px solid var(--line-soft); }
.bk-field-tag { font-size: 13px; font-weight: 600; color: var(--ink3); flex-shrink: 0; width: 30px; }
.bk-input { flex: 1; border: none; background: none; font-size: 15px; color: var(--ink); outline: none; }
.bk-input::placeholder { color: var(--ink3); }

.bk-block { margin-bottom: 10px; }
.bk-tpls { display: flow-root; }
.bk-tpl { float: left; margin: 0 8px 8px 0; display: inline-flex; align-items: center; gap: 6px; padding: 9px 13px; border: 1px solid var(--line); border-radius: 12px; background: none; cursor: pointer; }
.bk-tpl-icon { font-size: 17px; }
.bk-tpl-name { font-size: 13px; font-weight: 500; color: var(--ink); }
.bk-tpl-amt { font-size: 12px; color: var(--ink2); }

/* 结算栏 */
.bk-commit {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  margin: 0 24px calc(12px + env(safe-area-inset-bottom, 0px));
  padding: 16px 20px; border-radius: 16px; background: var(--ink); color: var(--accent-fg); cursor: pointer;
  box-shadow: 0 10px 30px -12px rgba(22, 24, 28, 0.5);
}
.bk-commit-label { font-size: 15px; font-weight: 700; }
.bk-commit-amt { font-size: 20px; font-weight: 800; }
.bk-commit-amt.c-inc { color: var(--inc); }
.bk-commit-amt.c-exp { color: var(--exp); }

/* 半屏九宫格 */
.bk-sheet-backdrop { position: absolute; inset: 0; background: var(--color-overlay, rgba(0,0,0,0.35)); z-index: 12; display: flex; align-items: flex-end; }
.bk-sheet { width: 100%; background: var(--surface); border-radius: 22px 22px 0 0; padding: 10px 24px 28px; box-shadow: 0 -10px 40px -16px rgba(0,0,0,0.3); }
.rs-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--line-heavy, var(--ink3)); opacity: 0.4; margin: 0 auto 12px; }
.bk-sheet-title { font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 18px; color: var(--ink); }
.bk-sheet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.bk-big-tile { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 0; border: 1px solid var(--line); border-radius: 16px; background: var(--bg); cursor: pointer; }
.bk-big-icon { font-size: 32px; line-height: 1; }
.bk-big-name { font-size: 13px; font-weight: 600; color: var(--ink); }
.bk-big-tile.sel { background: var(--ink); border-color: var(--ink); }
.bk-big-tile.sel .bk-big-name { color: var(--accent-fg); }
.bk-sheet-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.bk-chip { padding: 7px 15px; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 13px; color: var(--ink2); cursor: pointer; }
.bk-chip.on { background: var(--ink); border-color: var(--ink); color: var(--accent-fg); }
.bk-done { margin-top: 18px; width: 100%; height: 50px; border: none; border-radius: 14px; background: var(--ink); color: var(--accent-fg); font-size: 15px; font-weight: 700; cursor: pointer; }

/* 键盘 */
.bk-kb { position: absolute; inset: 0; background: var(--color-overlay, rgba(0,0,0,0.35)); z-index: 12; display: flex; align-items: flex-end; }
.bk-kb-inner { width: 100%; background: var(--surface); border-radius: 22px 22px 0 0; padding: 10px 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
.bk-kb-preview { text-align: center; font-size: 44px; font-weight: 800; padding: 6px 0 14px; color: var(--ink); }
.bk-kb-preview.c-inc { color: var(--inc); }
.bk-kb-preview.c-exp { color: var(--exp); }
.bk-kb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.bk-key { height: 52px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); font-size: 22px; font-weight: 500; color: var(--ink); cursor: pointer; }
.bk-key:active { background: var(--act-bg); }
.bk-kb-done { margin-top: 11px; width: 100%; height: 50px; border: none; border-radius: 12px; background: var(--ink); color: var(--accent-fg); font-size: 15px; font-weight: 700; cursor: pointer; }

.bk-toast { position: absolute; left: 50%; bottom: 160px; transform: translateX(-50%); background: var(--ink); color: var(--accent-fg); font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 999px; white-space: nowrap; z-index: 20; }

.rs-sheet-up-enter-active, .rs-sheet-up-leave-active { transition: transform 0.24s ease, opacity 0.18s; }
.rs-sheet-up-enter-from, .rs-sheet-up-leave-to { transform: translateY(28px); opacity: 0; }
.bk-toast-enter-active { transition: opacity 0.2s ease; }
.bk-toast-leave-active { transition: opacity 0.25s ease; }
.bk-toast-enter-from, .bk-toast-leave-to { opacity: 0; }
</style>