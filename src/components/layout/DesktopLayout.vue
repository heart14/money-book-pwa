<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { name: 'booking', title: '记账', icon: 'notes-o' },
  { name: 'accounts', title: '账户', icon: 'balance-o' },
  { name: 'stats', title: '统计', icon: 'chart-trending-o' },
  { name: 'settings', title: '设置', icon: 'setting-o' },
]

function navigate(name: string) {
  router.push({ name })
}
</script>

<template>
  <div class="desktop-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>💰 钱书</h2>
      </div>
      <van-sidebar :value="navItems.findIndex(i => i.name === route.name)">
        <van-sidebar-item
          v-for="item in navItems"
          :key="item.name"
          @click="navigate(item.name)"
        >
          <template #title>
            <span>{{ item.title }}</span>
          </template>
        </van-sidebar-item>
      </van-sidebar>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.desktop-layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 240px;
  border-right: 1px solid #ebedf0;
  background: #f7f8fa;
}
.sidebar-header {
  padding: 24px 16px 16px;
  border-bottom: 1px solid #ebedf0;
}
.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
}
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #fff;
}
</style>