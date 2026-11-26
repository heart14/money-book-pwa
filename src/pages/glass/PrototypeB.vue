<template>
  <!-- 方向 B：呼吸感极简平面。
       纯平面：无 blur、无渐变、无高光噪点。白/浅灰或近黑纯色背景，只有带浅描边的扁平分区块。
       用大留白（16~20px 区间）、克制的字号层级、表单式排布营造"透气感"；
       单一强调色只用于"当前选中/保存按钮"，其余信息尽量靠层级而非颜色。 -->
  <div class="pb-stage">
    <main class="pb-content">
      <!-- 模式分段控件 -->
      <div class="pb-seg">
        <button
          v-for="m in modes"
          :key="m"
          class="pb-seg-btn"
          :class="{ active: bookingState.mode === m }"
          @click="bookingState.mode = m"
        >{{ modeLabel[m] }}</button>
      </div>

      <!-- 金额：独立一块，不加卡片 -->
      <section class="pb-amount" @click="bookingState.keyboardVisible = true">
        <span class="pb-amount-label">本次金额</span>
        <p :class="['pb-amount-value', amountClass]">{{ amountText }}</p>
        <span class="pb-amount-meta">{{ today }} · {{ nowTime }}</span>
      </section>

      <!-- 分类：扁平区块 -->
      <section class="pb-panel">
        <div class="pb-panel-title">选择分类</div>
        <div class="pb-parents">
          <button
            v-for="p in currentParents"
            :key="p.id"
            class="pb-parent"
            :class="{ selected: bookingState.selectedParentId === p.id }"
            @click="selectParent(p)"
          >
            <span class="pb-parent-icon">{{ p.icon }}</span>
            <span class="pb-parent-name">{{ p.name }}</span>
          </button>
        </div>
        <div v-if="currentChildren.length" class="pb-children">
          <button
            v-for="c in currentChildren"
            :key="c.id"
            class="pb-child"
            :class="{ active: bookingState.selectedChildId === c.id }"
            @click="bookingState.selectedChildId = c.id"
          >{{ c.name }}</button>
        </div>
      </section>

      <!-- 输入：underline 式，几乎不占视觉重心 -->
      <section class="pb-fields">
        <div class="pb-field"><span class="pb-field-icon">📝</span><input class="pb-input" placeholder="标题（可选）" /></div>
        <div class="pb-field"><span class="pb-field-icon">🗒️</span><input class="pb-input" placeholder="备注（可选）" /></div>
      </section>

      <!-- 快记：扁平气泡 -->
      <section v-if="visibleTemplates.length" class="pb-tpls">
        <div class="pb-panel-title">快记</div>
        <div class="pb-tpl-row">
          <button v-for="t in visibleTemplates" :key="t.name" class="pb-tpl" :class="[t.type === 'income' ? 'is-income' : '']" @click="applyTemplate(t)">
            <span class="pb-tpl-icon">{{ t.icon }}</span>
            <span class="pb-tpl-name">{{ t.name }}</span>
          </button>
        </div>
      </section>
    </main>

    <!-- 数字键盘底部浮层（扁平） -->
    <Transition name="pb-sheet">
      <div v-if="bookingState.keyboardVisible" class="pb-kb">
        <div class="pb-kb-grip"></div>
        <div class="pb-kb-grid">
          <button v-for="k in keyLayout()" :key="k" class="pb-key" :class="k" @click="keyPress(k)">
            <span v-if="k !== 'del'">{{ k }}</span>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
          </button>
        </div>
        <button class="pb-save" @click="doSave">保存 · {{ amountText }}</button>
      </div>
    </Transition>

    <Transition name="pb-toast">
      <div v-if="toast" class="pb-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { bookingState, modeLabel, displayAmount, keyPress, keyLayout, type Mode } from './state'
import { parentsFor, childrenFor, mockTemplates, type MockCategory } from './mock'

const modes: Mode[] = ['expense', 'income', 'transfer']

const today = new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

const amountText = computed(() => displayAmount(bookingState.input))
const amountClass = computed(() =>
  bookingState.mode === 'income' ? 'is-income' : bookingState.mode === 'expense' ? 'is-expense' : '',
)
const currentParents = computed(() => parentsFor(bookingState.mode))
const currentChildren = computed(() =>
  bookingState.selectedParentId == null
    ? []
    : childrenFor(bookingState.mode, bookingState.selectedParentId),
)
const visibleTemplates = computed(() => mockTemplates.filter((t) => t.type === bookingState.mode).slice(0, 6))

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
</script>

<style scoped>
.pb-stage {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  color: #1c1c1f;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f6f7f8;
  --accent: #4f46e5;
  --panel: #ffffff;
  --panel-border: #e8e9ed;
  --panel-sub: #f1f2f4;
  --text-dim: #9aa0a6;
  --ink: #1c1c1f;
}

.pb-content {
  max-width: 460px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top, 0px) + 22px) 22px 320px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* 分段控件（扁平，细边框） */
.pb-seg {
  display: flex;
  padding: 3px;
  gap: 3px;
  border-radius: 12px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
}
.pb-seg-btn {
  flex: 1; padding: 9px 0; border: none; border-radius: 9px;
  background: transparent; font-size: 14px; font-weight: 600; color: var(--text-dim);
  cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background 0.15s, color 0.15s;
}
.pb-seg-btn.active { background: var(--panel-sub); color: var(--ink); }

/* 金额（无卡片，纯文本） */
.pb-amount { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 0; cursor: pointer; }
.pb-amount-label { font-size: 12px; color: var(--text-dim); font-weight: 500; letter-spacing: 0.3px; }
.pb-amount-value { font-size: 46px; font-weight: 700; letter-spacing: -1px; font-variant-numeric: tabular-nums; line-height: 1.05; color: var(--ink); }
.pb-amount-value.is-income { color: #15803d; }
.pb-amount-value.is-expense { color: #b91c1c; }
.pb-amount-meta { font-size: 12px; color: var(--text-dim); font-variant-numeric: tabular-nums; }

/* 面板 */
.pb-panel {
  background: var(--panel); border: 1px solid var(--panel-border); border-radius: 16px; padding: 16px;
}
.pb-panel-title { font-size: 12px; font-weight: 600; color: var(--text-dim); letter-spacing: 0.3px; margin-bottom: 12px; }
.pb-parents { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.pb-parent {
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 0 12px;
  border: 1px solid var(--panel-border); border-radius: 12px; background: transparent;
  cursor: pointer; transition: border-color 0.15s, background 0.15s; -webkit-tap-highlight-color: transparent;
}
.pb-parent.selected { border-color: var(--accent); background: rgba(79, 70, 229, 0.05); }
.pb-parent-icon { font-size: 26px; line-height: 1; }
.pb-parent-name { font-size: 11px; font-weight: 500; color: var(--ink); line-height: 1.1; }
.pb-parent.selected .pb-parent-name { color: var(--accent); }
.pb-children { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; border-top: 1px solid var(--panel-border); padding-top: 12px; }
.pb-child { padding: 7px 15px; border: 1px solid var(--panel-border); border-radius: 999px; background: transparent; font-size: 13px; font-weight: 500; color: var(--ink); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pb-child.active { border-color: var(--accent); color: var(--accent); background: rgba(79, 70, 229, 0.05); }

/* 输入（underline） */
.pb-fields { display: flex; flex-direction: column; }
.pb-field { display: flex; align-items: center; gap: 10px; padding: 13px 2px; }
.pb-field + .pb-field { border-top: 1px solid var(--panel-border); }
.pb-field-icon { font-size: 15px; opacity: 0.7; }
.pb-input { flex: 1; border: none; background: transparent; font-size: 14px; color: var(--ink); outline: none; font-family: inherit; }
.pb-input::placeholder { color: var(--text-dim); }

/* 快记 */
.pb-tpls { display: flex; flex-direction: column; gap: 10px; }
.pb-tpl-row { display: flex; flex-wrap: wrap; gap: 10px; }
.pb-tpl {
  display: inline-flex; align-items: center; gap: 7px; padding: 10px 14px;
  background: var(--panel); border: 1px solid var(--panel-border); border-radius: 10px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.pb-tpl-icon { font-size: 18px; }
.pb-tpl-name { font-size: 13px; font-weight: 500; color: var(--ink); }

/* 键盘浮层（扁平） */
.pb-kb {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 10;
  padding: 10px 14px calc(14px + env(safe-area-inset-bottom, 0px));
  background: var(--panel); border: 1px solid var(--panel-border); border-radius: 20px 20px 0 0;
  box-shadow: 0 20px 44px -18px rgba(20, 20, 30, 0.18);
}
.pb-kb-grip { width: 40px; height: 4px; border-radius: 2px; background: var(--text-dim); opacity: 0.4; margin: 2px auto 12px; }
.pb-kb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.pb-key { height: 54px; border: 1px solid var(--panel-border); border-radius: 12px; background: transparent; font-size: 20px; font-weight: 600; color: var(--ink); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pb-key:active { background: var(--panel-sub); }
.pb-save { margin-top: 12px; width: 100%; height: 52px; border: none; border-radius: 12px; background: var(--accent); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; -webkit-tap-highlight-color: transparent; }

/* toast */
.pb-toast {
  position: absolute; left: 50%; bottom: 250px; transform: translateX(-50%);
  background: var(--ink); color: #fff; font-size: 14px; font-weight: 500;
  padding: 10px 22px; border-radius: 999px; z-index: 30; white-space: nowrap;
}

.pb-sheet-enter-active, .pb-sheet-leave-active { transition: transform 0.22s ease, opacity 0.18s; }
.pb-sheet-enter-from, .pb-sheet-leave-to { transform: translateY(24px); opacity: 0; }
.pb-toast-enter-active { transition: all 0.2s ease; }
.pb-toast-leave-active { transition: all 0.25s ease; }
.pb-toast-enter-from, .pb-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ── 深色 ── */
@media (prefers-color-scheme: dark) {
  .pb-stage { background: #0e0e10; color: #efeff1; --ink: #efeff1; --text-dim: #7c7f86; }
  .pb-panel { background: #18181b; border-color: #29292e; --panel-sub: #232327; }
  .pb-fields .pb-field + .pb-field, .pb-children { border-top-color: #29292e; }
  .pb-seg, .pb-seg-btn.active, .pb-parent, .pb-child, .pb-tpl { border-color: #29292e; }
  .pb-seg { background: #131315; }
  .pb-seg-btn.active { background: #232327; }
  .pb-child, .pb-parent, .pb-tpl { background: #131315; }
  .pb-parent.selected, .pb-child.active { border-color: var(--accent); background: rgba(79, 70, 229, 0.16); }
  .pb-key { border-color: #29292e; color: #efeff1; }
  .pb-key:active { background: #232327; }
  .pb-kb { background: #18181b; border-color: #29292e; box-shadow: 0 20px 44px -18px rgba(0, 0, 0, 0.5); }
}
</style>