<template>
  <div class="desktop-layout">
    <Sidebar />
    <main class="desktop-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
</script>

<style scoped>
.desktop-layout {
  display: flex;
  height: 100%;
}

.desktop-content {
  flex: 1;
  margin-left: 160px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>