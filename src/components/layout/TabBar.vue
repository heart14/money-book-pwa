<template>
  <nav class="tab-bar">
    <!-- 明细 -->
    <button class="tab-item" :class="{ on: currentRoute === 'transactions' }" @click="navigate('transactions')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 4px;">
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="4" y1="12" x2="20" y2="12"></line>
        <line x1="4" y1="18" x2="14" y2="18"></line>
      </svg>
      <span class="tab-label">明细</span>
    </button>

    <!-- 统计 -->
    <button class="tab-item" :class="{ on: currentRoute === 'stats' }" @click="navigate('stats')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:block;margin:0 auto 4px;">
        <line x1="4" y1="20" x2="4" y2="10"></line>
        <line x1="10" y1="20" x2="10" y2="6"></line>
        <line x1="16" y1="20" x2="16" y2="14"></line>
        <line x1="20" y1="20" x2="20" y2="4"></line>
      </svg>
      <span class="tab-label">统计</span>
    </button>

    <!-- 记账 / 保存（嵌入式色块） -->
    <div class="tab-item tab-item--booking">
      <div class="booking-wrap">
        <button
          v-if="!isBooking"
          class="tab-cycle"
          @click="navigate('booking')"
          aria-label="记账"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
        <button
          v-else
          class="tab-cycle tab-cycle--save"
          :class="{ disabled: !uiStore.bookingCanSave }"
          :disabled="!uiStore.bookingCanSave"
          @click="handleBookingSave"
          aria-label="保存记账"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 13 9 18 20 6" />
          </svg>
        </button>
        <Transition name="hint-fade">
          <div v-if="uiStore.bookingHintVisible" class="save-hint">点击这里保存</div>
        </Transition>
      </div>
    </div>

    <!-- 账户 -->
    <button class="tab-item" :class="{ on: currentRoute === 'accounts' }" @click="navigate('accounts')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 4px;">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
        <path d="M16 14h2"></path>
      </svg>
      <span class="tab-label">账户</span>
    </button>

    <!-- 设置 -->
    <button class="tab-item" :class="{ on: currentRoute === 'settings' }" @click="navigate('settings')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 4px;">
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
  // 顶层 Tab 之间使用 replace：history 栈始终只保留一条记录，
  // 根绝「左右边缘滑动前进/后退」在 Tab 间来回切换。
  router.replace({ name })
}

function handleBookingSave() {
  if (!uiStore.bookingCanSave) return
  uiStore.triggerBookingSave()
}
</script>

<style scoped>
/* 嵌入式底部导航：与页面同层的分区条，无浮起胶囊，无中央圆形拟物按钮 */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(60px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: center;
  padding: 0 6px env(safe-area-inset-bottom, 0px);
  background: var(--surface);
  border-top: 1px solid var(--line-soft);
  z-index: 100;
}

.tab-item {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border: none;
  background: none;
  color: var(--ink3);
  font-size: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}
.tab-item.on { color: var(--ink); }

.tab-label { line-height: 1; font-weight: 500; }

/* 记账入口：同层色块，不复刻圆形拟物按钮 */
.tab-item--booking { flex: 0 0 64px; position: relative; }
.booking-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
.tab-cycle {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: none;
  background: var(--accent);
  color: var(--accent-fg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 16px -6px rgba(22, 24, 28, 0.4);
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, color 0.15s, transform 0.12s;
}
.tab-cycle:active { transform: scale(0.92); }
.tab-cycle--save { background: var(--inc); color: var(--accent-fg); box-shadow: 0 6px 16px -8px rgba(23, 160, 101, 0.5); }
.tab-cycle--save.disabled {
  background: var(--line); color: var(--ink3); box-shadow: none; pointer-events: none;
}

.save-hint {
  position: absolute;
  bottom: 52px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: var(--accent-fg);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 999px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
  box-shadow: 0 6px 18px -8px rgba(0, 0, 0, 0.3);
}

.hint-fade-enter-active, .hint-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.hint-fade-enter-from, .hint-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(6px); }
</style>