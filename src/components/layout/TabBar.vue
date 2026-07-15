<template>
  <nav class="tab-bar">
    <button
      class="tab-item"
      :class="{ active: currentRoute === 'transactions' }"
      @click="navigate('transactions')"
    >
      <svg
        class="tab-icon"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
      <span class="tab-label">明细</span>
    </button>

    <button
      class="tab-item"
      :class="{ active: currentRoute === 'stats' }"
      @click="navigate('stats')"
    >
      <svg
        class="tab-icon"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="currentColor"
      >
        <rect x="4" y="14" width="4" height="8" rx="1" />
        <rect x="10" y="8" width="4" height="14" rx="1" />
        <rect x="16" y="3" width="4" height="19" rx="1" />
      </svg>
      <span class="tab-label">统计</span>
    </button>

    <div class="tab-item tab-item--booking">
      <button class="booking-btn" @click="navigate('booking')">
        <svg
          class="booking-icon"
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="#fff"
          stroke-width="2.8"
          stroke-linecap="round"
        >
          <line x1="12" y1="6" x2="12" y2="18" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      </button>
      <span class="tab-label booking-label">记账</span>
    </div>

    <button
      class="tab-item"
      :class="{ active: currentRoute === 'accounts' || currentRoute === 'account-detail' }"
      @click="navigate('accounts')"
    >
      <svg
        class="tab-icon"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <rect x="14" y="10" width="8" height="4" rx="1" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
      </svg>
      <span class="tab-label">账户</span>
    </button>

    <button
      class="tab-item"
      :class="{ active: currentRoute === 'settings' }"
      @click="navigate('settings')"
    >
      <svg
        class="tab-icon"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      <span class="tab-label">设置</span>
    </button>
  </nav>
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
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(60, 60, 67, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 4px;
  border: none;
  background: none;
  cursor: pointer;
  color: #8e8e93;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
  position: relative;
}

.tab-item.active {
  color: #007aff;
}

.tab-icon {
  display: block;
}

.tab-label {
  font-size: 10px;
  line-height: 1;
  margin-top: 2px;
}

/* Booking tab */
.tab-item--booking {
  position: relative;
  padding-top: 0;
}

.booking-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #007aff, #00a2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  top: -8px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
}

.booking-btn:active {
  transform: scale(0.92);
}

.booking-icon {
  display: block;
}

.booking-label {
  position: relative;
  top: -4px;
}
</style>