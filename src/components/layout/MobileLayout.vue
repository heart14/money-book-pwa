<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: 'booking', title: '记账', icon: 'notes-o' },
  { name: 'accounts', title: '账户', icon: 'balance-o' },
  { name: 'stats', title: '统计', icon: 'chart-trending-o' },
  { name: 'settings', title: '设置', icon: 'setting-o' },
]

function onTabChange(name: string) {
  router.push({ name })
}
</script>

<template>
  <div class="mobile-layout">
    <div class="mobile-content">
      <router-view />
    </div>
    <van-tabbar
      :value="route.name as string"
      @change="onTabChange"
      active-color="#1989fa"
    >
      <van-tabbar-item
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
      >
        {{ tab.title }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 50px;
}
</style>