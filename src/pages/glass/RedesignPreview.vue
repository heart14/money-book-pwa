<template>
  <!-- 钱书「沉浸式」新视觉预览。
       与旧版最大的不同：不是换色，而是换骨架。
       - 记账页 = 全屏沉浸：手势滑切换 收入/支出/转账，全屏大金额，点数字弹键盘，
         点分类弹底部半屏九宫格（如同打车选目的地）。
       - Tab 栏 = 嵌入式底部导航：去掉中央圆形拟物按钮，改与页面同层的分区导航。
       - 其余四页 = 整屏连续沉浸排版：大标题、色块分区、细分隔线、等宽金额，无浮卡堆叠。
       本页为设计预览，自包含、不并入业务。 -->
  <div class="rs-app" :class="{ dark }">
    <!-- 预览控制条（预览页自己的，不是业务 UI） -->
    <div class="rs-controls">
      <div class="rs-controls-title">
        <span class="rs-c-name">钱书 · 沉浸式设计</span>
        <span class="rs-c-hint">{{ view === 'pages' ? '手机屏为真机效果：底部切页，记账页可左右滑 / 点数字弹键盘 / 点分类弹九宫格' : '锁屏/弹窗/面板/空状态等全部件风格总览' }}</span>
      </div>
      <div class="rs-ctrl">
        <div class="rs-view">
          <button class="rs-view-btn" :class="{ on: view === 'pages' }" @click="view = 'pages'">页面</button>
          <button class="rs-view-btn" :class="{ on: view === 'components' }" @click="view = 'components'">组件</button>
        </div>
        <button class="rs-toggle" @click="dark = !dark">
          {{ dark ? '☀️ 浅色' : '🌙 深色' }}
        </button>
      </div>
    </div>

    <!-- 页面模式：手机屏框 -->
    <div v-if="view === 'pages'" class="rs-phone">
      <div class="rs-statusbar"><span>9:41</span></div>

      <main class="rs-screen">
        <Booking v-if="page === 'booking'" />
        <Transactions v-else-if="page === 'transactions'" />
        <Stats v-else-if="page === 'stats'" />
        <Accounts v-else-if="page === 'accounts'" />
        <Settings v-else />
      </main>

      <!-- 嵌入式底部导航：无中央圆形拟物按钮，与页面同层的分区条 -->
      <nav class="rs-tabbar">
        <button
          class="rs-tab"
          :class="{ on: page === 'transactions' }"
          @click="page = 'transactions'"
        >
          <i class="rs-tab-icon">▤</i><span>明细</span>
        </button>
        <button
          class="rs-tab"
          :class="{ on: page === 'stats' }"
          @click="page = 'stats'"
        >
          <i class="rs-tab-icon">▲</i><span>统计</span>
        </button>
        <button
          class="rs-tab rs-tab--book"
          :class="{ on: page === 'booking' }"
          @click="page = 'booking'"
        >
          <i class="rs-tab-cycle">{{ page === 'booking' ? '✓' : '＋' }}</i>
        </button>
        <button
          class="rs-tab"
          :class="{ on: page === 'accounts' }"
          @click="page = 'accounts'"
        >
          <i class="rs-tab-icon">◐</i><span>账户</span>
        </button>
        <button
          class="rs-tab"
          :class="{ on: page === 'settings' }"
          @click="page = 'settings'"
        >
          <i class="rs-tab-icon">⚙</i><span>设置</span>
        </button>
      </nav>
    </div>

    <!-- 组件模式：全宽设计系统总览 -->
    <div v-else class="rs-components">
      <Components />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Booking from './rs/Booking.vue'
import Transactions from './rs/Transactions.vue'
import Stats from './rs/Stats.vue'
import Accounts from './rs/Accounts.vue'
import Settings from './rs/Settings.vue'
import Components from './rs/Components.vue'

const page = ref<'booking' | 'transactions' | 'stats' | 'accounts' | 'settings'>('booking')
const dark = ref(false)
const view = ref<'pages' | 'components'>('pages')
</script>

<style scoped>
/* ── 设计令牌：沉浸式「墨色账本」基座 ── */
.rs-app {
  --bg: #f3f4f5;
  --surface: #ffffff;
  --ink: #16181c;
  --ink2: #5d6570;
  --ink3: #9aa3ac;
  --line: rgba(22, 24, 28, 0.10);
  --line-soft: rgba(22, 24, 28, 0.06);
  --accent: #16181c;
  --accent-fg: #ffffff;
  --inc: #17a065;
  --exp: #d5503c;
  --radius: 16px;
  --act-bg: rgba(22, 24, 28, 0.05);
  --header-h: 64px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.rs-app.dark {
  --bg: #0f1013;
  --surface: #17181c;
  --ink: #f1f2f4;
  --ink2: #a6acb4;
  --ink3: #6f747b;
  --line: rgba(255, 255, 255, 0.12);
  --line-soft: rgba(255, 255, 255, 0.07);
  --accent: #f1f2f4;
  --accent-fg: #111316;
  --act-bg: rgba(255, 255, 255, 0.07);
  --inc: #2fc98b;
  --exp: #ff6b5c;
}

/* 数字统一用等宽表格数字 */
.rs-app :deep(.num) {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
  letter-spacing: -0.01em;
}

/* ── 预览外层布局 ── */
.rs-app {
  min-height: 100vh;
  margin: 0 auto;
  padding: 0 12px 40px;
  color: var(--ink);
  background: linear-gradient(180deg, #eceef1, #dfe2e6);
}
.rs-app.dark { background: linear-gradient(180deg, #0b0c0f, #2a2c31); }

.rs-controls { max-width: 430px; margin: 0 auto; padding: 24px 4px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.rs-c-name { display: block; font-size: 17px; font-weight: 700; color: #1a1c1f; }
.rs-app.dark .rs-c-name { color: #f1f2f4; }
.rs-c-hint { display: block; font-size: 11px; color: #8b919a; margin-top: 3px; }
.rs-app.dark .rs-c-hint { color: #8f959d; }
.rs-toggle { border: 1px solid #d3d6da; background: #fff; color: #333; border-radius: 999px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; flex-shrink: 0; }
.rs-app.dark .rs-toggle { background: #22232759; border-color: #3a3d42; color: #e8eaec; }

/* ── 手机屏框 ── */
.rs-phone {
  position: relative;
  max-width: 430px;
  height: 780px;
  margin: 0 auto;
  background: var(--bg);
  border-radius: 34px;
  overflow: hidden;
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}
.rs-statusbar { flex-shrink: 0; padding: 12px 22px 0; font-size: 13px; font-weight: 600; text-align: left; color: var(--ink); }
.rs-screen { flex: 1; overflow-y: auto; position: relative; -webkit-overflow-scrolling: touch; }

/* ── 嵌入式底部导航：分区条，无浮起胶囊，无中央圆形按钮 ── */
.rs-tabbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 8px calc(8px + env(safe-area-inset-bottom, 0px));
  background: var(--bg);
  border-top: 1px solid var(--line-soft);
  height: 64px;
}
.rs-tab {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: none;
  color: var(--ink3);
  font-size: 10px;
  cursor: pointer;
  transition: color 0.15s;
}
.rs-tab.on { color: var(--ink); }
.rs-tab-icon { font-size: 20px; font-style: normal; line-height: 1; }
.rs-tab--book { flex: 0 0 64px; }
/* 记账入口：同层色块，不复刻圆形拟物按钮 */
.rs-tab-cycle {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--ink);
  color: var(--accent-fg);
  font-style: normal;
  font-size: 26px;
  font-weight: 400;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px -6px rgba(22, 24, 28, 0.4);
  transition: background 0.15s, color 0.15s;
}
.rs-tab--book.on .rs-tab-cycle { background: var(--inc); color: var(--accent-fg); }

/* ── 组件模式容器 ── */
.rs-components {
  background: var(--bg);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.45);
  border-radius: 24px;
  overflow: hidden;
}
.rs-app.dark .rs-components { border-color: rgba(255, 255, 255, 0.06); }
</style>