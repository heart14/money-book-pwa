<template>
  <nav class="tab-bar">
    <!-- 明细 -->
    <button
      class="tab-item"
      :class="{ active: currentRoute === 'transactions' }"
      @click="navigate('transactions')"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 6px;">
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="4" y1="12" x2="20" y2="12"></line>
        <line x1="4" y1="18" x2="14" y2="18"></line>
      </svg>
      <span class="tab-label">明细</span>
    </button>

    <!-- 统计 -->
    <button
      class="tab-item"
      :class="{ active: currentRoute === 'stats' }"
      @click="navigate('stats')"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 6px;">
        <line x1="4" y1="20" x2="4" y2="10"></line>
        <line x1="10" y1="20" x2="10" y2="6"></line>
        <line x1="16" y1="20" x2="16" y2="14"></line>
        <line x1="20" y1="20" x2="20" y2="4"></line>
      </svg>
      <span class="tab-label">统计</span>
    </button>

    <!-- 记账 / 保存 (突出) -->
    <div class="tab-item tab-item--booking">
      <div class="booking-btn-wrap">
        <!-- 非记账页：+ 按钮导航到记账 -->
        <button
          v-if="!isBooking"
          class="booking-btn"
          @click="navigate('booking')"
        >
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
        <!-- 记账页：✓ 确认记账 -->
        <button
          v-else
          class="booking-btn booking-btn--save"
          :class="{ disabled: !uiStore.bookingCanSave }"
          :disabled="!uiStore.bookingCanSave"
          @click="handleBookingSave"
        >
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 13 9 18 20 6" />
          </svg>
        </button>
        <!-- 保存提示气泡 -->
        <Transition name="hint-fade">
          <div v-if="uiStore.bookingHintVisible" class="save-hint">点击这里保存</div>
        </Transition>
      </div>
      <span class="tab-label booking-label">{{ isBooking ? '保存' : '记账' }}</span>
    </div>

    <!-- 账户 -->
    <button
      class="tab-item"
      :class="{ active: currentRoute === 'accounts' }"
      @click="navigate('accounts')"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 6px;">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
        <path d="M16 14h2"></path>
      </svg>
      <span class="tab-label">账户</span>
    </button>

    <!-- 设置 -->
    <button
      class="tab-item"
      :class="{ active: currentRoute === 'settings' }"
      @click="navigate('settings')"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 6px;">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
      <span class="tab-label">设置</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const currentRoute = computed(() => route.name as string)
const isBooking = computed(() => currentRoute.value === 'booking')

function navigate(name: string) {
  router.push({ name })
}

function handleBookingSave() {
  if (!uiStore.bookingCanSave) return
  uiStore.triggerBookingSave()
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  background: #f2f2f6;
  padding: 6px 0 8px;
  padding-bottom: calc(15px + env(safe-area-inset-bottom));
  z-index: 100;
}

/* Non-full-width top separator */
.tab-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: rgba(60, 60, 67, 0.08);
}

.tab-item {
  text-align: center;
  font-size: 11px;
  color: #8e8e93;
  width: 24%;
  border: none;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}

.tab-item.active {
  color: #007aff;
}

.tab-label {
  display: block;
  line-height: 1;
}

/* Booking tab - highlighted */
.tab-item--booking {
  position: relative;
  width: 24%;
  top: -8px;
}

.booking-btn-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.booking-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #007aff, #00a2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
}

.booking-btn:active {
  transform: scale(0.92);
}

.booking-btn--save {
  background: linear-gradient(135deg, #34c759, #30d158);
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4);
}

.booking-btn--save.disabled {
  background: #c7c7cc;
  box-shadow: none;
  pointer-events: none;
}

.booking-label {
  font-weight: 700;
}

/* Save hint bubble */
.save-hint {
  position: absolute;
  bottom: 66px;
  left: 50%;
  transform: translateX(-50%);
  background: #1c1c1e;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
}

.save-hint::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1c1c1e;
}

/* Hint fade transition */
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.hint-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

.hint-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
</style>