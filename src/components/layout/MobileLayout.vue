<template>
  <div class="mobile-layout">
    <main class="mobile-content">
      <router-view />
    </main>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import TabBar from './TabBar.vue'
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  /* 高度回退：先 100%（相对 html/body），再用 100svh（小视口高度）覆盖。
     iOS standalone + translucent + viewport-fit=cover 下 svh 稳定 = 整屏(含安全区)，
     相比 100dvh 不会在回前台的首帧发生视口高度跳变，
     避免“底部露出留白、滑动才贴合屏幕底部”的问题 */
  height: 100%;
  height: 100svh;
}

.mobile-content {
  flex: 1;
  /* flex 子项默认 min-height:auto 会被内容撑高，导致滚动容器高度超出可用空间，
     底部溢出空白。min-height:0 令其正确收缩，滚动与安全区计算保持准确 */
  min-height: 0;
  overflow-y: auto;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: 56px;
  -webkit-overflow-scrolling: touch;
}
</style>