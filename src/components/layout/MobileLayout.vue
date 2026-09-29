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
  height: 100%;
  /* iOS standalone + translucent + viewport-fit=cover：用动态视口高度，
     确保容器高度 = 实际可视区(含上下安全区)，避免文档体被撑高导致底部露出留白 */
  height: 100dvh;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: 56px;
  -webkit-overflow-scrolling: touch;
}
</style>