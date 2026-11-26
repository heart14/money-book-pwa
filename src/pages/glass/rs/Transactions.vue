<template>
  <div class="tx">
    <div class="tx-scroll">
      <!-- 整屏开篇：月份 + 收支总和（连续版画，非浮卡） -->
      <header class="tx-head">
        <span class="tx-month">11 月 <em>2026</em></span>
        <span class="tx-sum">
          <span class="tx-sum-item">支出 <b class="num c-exp">¥4,820</b></span>
          <span class="tx-sum-item">收入 <b class="num c-inc">¥8,100</b></span>
        </span>
      </header>

      <!-- 筛选分割条 -->
      <div class="tx-chips">
        <button class="tx-chip on">全部</button>
        <button class="tx-chip">支出</button>
        <button class="tx-chip">收入</button>
      </div>

      <!-- 按天分组的连续流水：无浮卡，直接分隔线排布成"账页" -->
      <section v-for="day in days" :key="day.label" class="tx-day">
        <div class="tx-day-label">
          <span>{{ day.label }}</span>
          <span class="num tx-day-sum">－{{ day.sum }}</span>
        </div>
        <div class="tx-rows">
          <div v-for="item in day.items" :key="item.name + item.amt" class="tx-row">
            <span class="tx-icon">{{ item.icon }}</span>
            <div class="tx-mid">
              <span class="tx-title">{{ item.name }}</span>
              <span class="tx-sub">{{ item.sub }}</span>
            </div>
            <span class="num tx-amt" :class="item.inc ? 'c-inc' : 'c-exp'">{{ item.inc ? '+' : '−' }}¥{{ item.amt }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const days = [
  {
    label: '11月25日 · 周三',
    sum: '186.00',
    items: [
      { icon: '🍱', name: '午餐', sub: '餐饮', amt: '25.00', inc: false },
      { icon: '🚕', name: '通勤', sub: '交通', amt: '18.00', inc: false },
      { icon: '🛒', name: '生鲜超市', sub: '购物', amt: '143.00', inc: false },
    ],
  },
  {
    label: '11月24日 · 周二',
    sum: '331.00',
    items: [
      { icon: '🏠', name: '物业费', sub: '居住', amt: '300.00', inc: false },
      { icon: '☕', name: '咖啡', sub: '餐饮', amt: '31.00', inc: false },
    ],
  },
  {
    label: '11月22日 · 周日',
    sum: '1200.00',
    items: [
      { icon: '💼', name: '报销', sub: '工资奖金', amt: '1200.00', inc: true },
    ],
  },
]
</script>

<style scoped>
.tx { height: 100%; }
.tx-scroll { padding: 22px 24px 30px; height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; }

.tx-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 22px; }
.tx-month { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); }
.tx-month em { font-size: 12px; color: var(--ink3); font-weight: 500; font-style: normal; margin-left: 6px; }
.tx-sum { display: flex; gap: 14px; font-size: 12px; color: var(--ink2); font-weight: 500; }
.tx-sum-item b { font-weight: 700; margin-left: 2px; }

.tx-chips { display: flex; gap: 8px; margin-bottom: 26px; border-bottom: 1px solid var(--line-soft); padding-bottom: 16px; }
.tx-chip { padding: 6px 15px; border: 1px solid var(--line); border-radius: 999px; background: none; font-size: 13px; color: var(--ink2); cursor: pointer; }
.tx-chip.on { background: var(--ink); border-color: var(--ink); color: var(--accent-fg); }

.tx-day { margin-bottom: 10px; }
.tx-day-label { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; font-weight: 600; color: var(--ink2); padding: 0 2px 8px; }
.tx-day-sum { color: var(--ink3); font-weight: 500; }

/* 连续流水：无浮卡，直接竖排分隔线 */
.tx-rows { }
.tx-row { display: flex; align-items: center; gap: 12px; padding: 15px 0; }
.tx-row + .tx-row { border-top: 1px solid var(--line-soft); }
.tx-icon { font-size: 21px; width: 34px; text-align: center; flex-shrink: 0; }
.tx-mid { flex: 1; min-width: 0; }
.tx-title { display: block; font-size: 15px; font-weight: 600; color: var(--ink); }
.tx-sub { font-size: 11px; color: var(--ink3); margin-top: 2px; }
.tx-amt { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
.c-inc { color: var(--inc); }
.c-exp { color: var(--exp); }
</style>