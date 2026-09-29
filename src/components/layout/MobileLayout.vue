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
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 56px;
  -webkit-overflow-scrolling: touch;
}
</style>