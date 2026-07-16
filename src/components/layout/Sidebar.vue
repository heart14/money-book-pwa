<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <button
        class="nav-item"
        :class="{ active: currentRoute === 'booking' }"
        @click="navigate('booking')"
      >
        <span class="nav-emoji">📝</span>
        <span class="nav-text">记账</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: currentRoute === 'transactions' }"
        @click="navigate('transactions')"
      >
        <span class="nav-emoji">📋</span>
        <span class="nav-text">明细</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: currentRoute === 'accounts' || currentRoute === 'account-detail' }"
        @click="navigate('accounts')"
      >
        <span class="nav-emoji">🏦</span>
        <span class="nav-text">账户</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: currentRoute === 'stats' }"
        @click="navigate('stats')"
      >
        <span class="nav-emoji">📊</span>
        <span class="nav-text">统计</span>
      </button>

      <button
        class="nav-item"
        :class="{ active: currentRoute === 'settings' }"
        @click="navigate('settings')"
      >
        <span class="nav-emoji">⚙️</span>
        <span class="nav-text">设置</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const currentRoute = computed(() => route.name as string)

function navigate(name: string) {
  router.push({ name })
}
</script>

<style scoped>
.sidebar {
  width: 160px;
  min-width: 160px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid rgba(60, 60, 67, 0.08);
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #8e8e93;
  text-align: left;
  transition: background 0.15s, color 0.15s;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.nav-item:hover {
  background: rgba(0, 122, 255, 0.05);
}

.nav-item.active {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  font-weight: 600;
}

.nav-emoji {
  font-size: 18px;
  line-height: 1;
}

.nav-text {
  font-size: 14px;
  line-height: 1;
}
</style>