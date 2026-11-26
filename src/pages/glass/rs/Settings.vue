<template>
  <div class="se">
    <div class="se-scroll">
      <header class="se-title">设置</header>

      <section class="se-group">
        <span class="se-group-label">外观</span>
        <div v-for="row in group1" :key="row.t" class="se-row">
          <span class="se-row-l">{{ row.t }}</span>
          <span class="se-row-v">{{ row.v }}</span>
        </div>
      </section>

      <section class="se-group">
        <span class="se-group-label">安全</span>
        <div v-for="row in group2" :key="row.t" class="se-row">
          <span class="se-row-l">{{ row.t }}</span>
          <span class="se-row-caret">{{ row.v }}</span>
        </div>
      </section>

      <section class="se-group">
        <span class="se-group-label">数据</span>
        <div v-for="row in group3" :key="row.t" class="se-row">
          <span class="se-row-l" :class="{ danger: row.danger }">{{ row.t }}</span>
          <span class="se-row-caret">{{ row.v }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const group1 = [
  { t: '主题', v: '浅色' },
  { t: '字号', v: '标准' },
  { t: '货币单位', v: '¥ 人民币' },
]
const group2 = [
  { t: 'PIN 码锁', v: '已开启' },
]
const group3 = [
  { t: '数据导出', v: '' },
  { t: '清除全部数据', v: '', danger: true },
]
</script>

<style scoped>
.se { height: 100%; }
.se-scroll { padding: 24px 24px 30px; height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.se-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); margin-bottom: 30px; }

.se-group { margin-bottom: 30px; }
.se-group-label { display: block; font-size: 12px; font-weight: 600; color: var(--ink3); letter-spacing: 0.3px; margin-bottom: 6px; }
.se-row { display: flex; align-items: center; justify-content: space-between; padding: 17px 0; }
.se-row + .se-row { border-top: 1px solid var(--line-soft); }
.se-row-l { font-size: 15px; color: var(--ink); font-weight: 600; }
.se-row-l.danger { color: var(--exp); }
.se-row-v, .se-row-caret { font-size: 14px; color: var(--ink2); }
</style>