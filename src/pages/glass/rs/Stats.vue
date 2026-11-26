<template>
  <div class="st">
    <div class="st-scroll">
      <header class="st-head">
        <span class="st-month">11 月 <em>2026</em></span>
        <button class="st-chip">支出 ▾</button>
      </header>

      <!-- 整屏开篇：本月支出大数字 -->
      <div class="st-hero">
        <span class="st-hero-label">本月支出</span>
        <div class="st-hero-amount num c-exp">¥4,820.00</div>
        <div class="st-hero-delta">比上月 <b>↓ 12.4%</b></div>
      </div>

      <!-- 支出构成：连续条形区（非卡片） -->
      <section class="st-block">
        <span class="st-label">支出构成</span>
        <div class="st-rows">
          <div v-for="c in cats" :key="c.name" class="st-cat">
            <div class="st-cat-top">
              <span class="st-cat-name"><i>{{ c.icon }}</i> {{ c.name }}</span>
              <span class="num st-cat-amt">{{ c.pct }}% · ¥{{ c.amt }}</span>
            </div>
            <div class="st-bar"><div class="st-bar-fill" :style="{ width: c.pct + '%' }"></div></div>
          </div>
        </div>
      </section>

      <!-- 收支趋势：越简单越好，直接铺开 -->
      <section class="st-block">
        <span class="st-label">近 12 月支出趋势</span>
        <div class="st-spark">
          <span class="st-spark-bar" v-for="(h, i) in spark" :key="i" :style="{ height: h + '%' }"></span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const cats = [
  { icon: '🍱', name: '餐饮', pct: 34, amt: '1,640' },
  { icon: '🏠', name: '居住', pct: 26, amt: '1,250' },
  { icon: '🛒', name: '购物', pct: 18, amt: '870' },
  { icon: '🚕', name: '交通', pct: 12, amt: '580' },
  { icon: '🎮', name: '娱乐', pct: 10, amt: '480' },
]
const spark = [42, 55, 38, 62, 48, 70, 58, 66, 52, 78, 64, 72]
</script>

<style scoped>
.st { height: 100%; }
.st-scroll { padding: 24px 24px 30px; height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; }

.st-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
.st-month { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); }
.st-month em { font-size: 12px; color: var(--ink3); font-weight: 500; font-style: normal; margin-left: 6px; }
.st-chip { font-size: 12px; color: var(--ink2); border: 1px solid var(--line); background: none; padding: 4px 12px; border-radius: 999px; cursor: pointer; }

.st-hero { margin: 16px 0 38px; padding-bottom: 32px; border-bottom: 1px solid var(--line-soft); }
.st-hero-label { font-size: 13px; color: var(--ink2); font-weight: 600; }
.st-hero-amount { font-size: 58px; font-weight: 800; letter-spacing: -0.04em; margin: 8px 0 8px; font-variant-numeric: tabular-nums; }
.st-hero-delta { font-size: 12px; color: var(--ink3); }
.st-hero-delta b { color: var(--inc); }

.st-block { margin-bottom: 36px; }
.st-label { font-size: 13px; font-weight: 600; color: var(--ink2); margin-bottom: 16px; display: block; }

.st-cat { margin-bottom: 18px; }
.st-cat-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.st-cat-name { font-size: 14px; color: var(--ink); font-weight: 600; }
.st-cat-name i { font-style: normal; margin-right: 6px; }
.st-cat-amt { font-size: 12px; color: var(--ink2); }
.st-bar { height: 6px; border-radius: 3px; background: var(--act-bg); overflow: hidden; }
.st-bar-fill { height: 100%; border-radius: 3px; background: var(--ink); opacity: 0.85; }

.st-spark { display: flex; align-items: flex-end; gap: 6px; height: 110px; }
.st-spark-bar { flex: 1; border-radius: 4px 4px 2px 2px; background: var(--act-bg); }
.st-spark-bar:nth-child(odd) { background: var(--ink); opacity: 0.85; }
</style>