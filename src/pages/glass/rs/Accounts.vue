<template>
  <div class="ac">
    <div class="ac-scroll">
      <!-- 整屏开篇：净资产大数字 -->
      <header class="ac-net">
        <span class="ac-net-label">净资产</span>
        <div class="ac-net-value num">¥128,530.00</div>
        <span class="ac-net-sub">较上月 <b class="c-inc">+¥3,280</b></span>
      </header>

      <section>
        <div class="ac-label-row">
          <span class="ac-label">我的账户</span>
          <button class="ac-add">＋ 添加</button>
        </div>
        <div class="ac-rows">
          <div v-for="a in accounts" :key="a.name" class="ac-row">
            <span class="ac-icon" :style="{ background: a.tint + '1a' }">{{ a.icon }}</span>
            <div class="ac-mid">
              <span class="ac-name">{{ a.name }}</span>
              <span class="ac-sub">{{ a.sub }}</span>
            </div>
            <span class="num ac-amt">{{ a.amt }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const accounts = [
  { name: '银行卡', sub: '招商银行 · 尾号 6628', amt: '¥86,200.00', icon: '💳', tint: '#2a6fdb' },
  { name: '支付宝', sub: '余额 + 理财', amt: '¥21,330.00', icon: '🅰️', tint: '#1677ff' },
  { name: '微信', sub: '零钱', amt: '¥9,000.00', icon: '💬', tint: '#07c160' },
  { name: '现金', sub: '钱包', amt: '¥12,000.00', icon: '💵', tint: '#d5503c' },
]
</script>

<style scoped>
.ac { height: 100%; }
.ac-scroll { padding: 24px 24px 30px; height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; }

.ac-net { padding: 26px 0 38px; border-bottom: 1px solid var(--line-soft); margin-bottom: 26px; }
.ac-net-label { font-size: 13px; color: var(--ink2); font-weight: 600; letter-spacing: 0.3px; }
.ac-net-value { font-size: 52px; font-weight: 800; letter-spacing: -0.04em; margin: 10px 0 8px; color: var(--ink); font-variant-numeric: tabular-nums; }
.ac-net-sub { font-size: 12px; color: var(--ink3); }
.c-inc { color: var(--inc); }

.ac-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ac-label { font-size: 13px; font-weight: 600; color: var(--ink2); }
.ac-add { border: none; background: none; font-size: 13px; font-weight: 600; color: var(--ink); cursor: pointer; padding: 6px 10px; border-radius: 8px; background: var(--act-bg); }

/* 连续账户列表：无浮卡，直接分隔线 */
.ac-row { display: flex; align-items: center; gap: 13px; padding: 16px 0; }
.ac-row + .ac-row { border-top: 1px solid var(--line-soft); }
.ac-icon { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; flex-shrink: 0; }
.ac-mid { flex: 1; min-width: 0; }
.ac-name { display: block; font-size: 15px; font-weight: 600; color: var(--ink); }
.ac-sub { display: block; font-size: 11px; color: var(--ink3); margin-top: 2px; }
.ac-amt { font-size: 15px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
</style>