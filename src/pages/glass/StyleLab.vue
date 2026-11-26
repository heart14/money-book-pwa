<template>
  <!-- 风格方向对拍沙盒：在 A / B 之间来回切换，感受同一张记账页的两种材质与密度。
       壳页只负责切换 + 手机屏容器；两个原型各自自包含、共享同一份编辑状态(state.ts)。 -->
  <div class="lab">
    <div class="lab-bar">
      <button class="lab-back" aria-label="返回" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <div class="lab-title">
        <span class="lab-name">风格对拍 · 记账页</span>
        <span class="lab-hint">在 A / B 间切换，点选分类 · 敲键盘 · 保存</span>
      </div>
    </div>

    <div class="lab-switch" role="tablist">
      <button
        v-for="opt in options"
        :key="opt.key"
        class="lab-opt"
        :class="{ active: current === opt.key }"
        role="tab"
        @click="current = opt.key"
      >
        <span class="lab-opt-tag">{{ opt.key }}</span>
        <span class="lab-opt-name">{{ opt.name }}</span>
      </button>
    </div>

    <!-- 手机屏容器（居中、限宽）。两个原型据此自适应内部排版。 -->
    <div class="lab-frame">
      <PrototypeA v-if="current === 'A'" />
      <PrototypeB v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PrototypeA from './PrototypeA.vue'
import PrototypeB from './PrototypeB.vue'

const router = useRouter()
const current = ref<'A' | 'B'>('A')

const options = [
  { key: 'A' as const, name: '真·液态玻璃' },
  { key: 'B' as const, name: '呼吸感极简' },
]

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/booking')
}
</script>

<style scoped>
.lab {
  position: fixed;
  inset: 0;
  z-index: 10999;
  background: #dfe1e5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px calc(env(safe-area-inset-bottom, 0px) + 12px);
  overflow: hidden;
}
/* 壳页自用深色 */
:global(:root.dark) .lab { background: #0a0a0c; }

.lab-bar { width: 100%; max-width: 460px; display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.lab-back {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #c8cbd1; background: #f4f5f7; color: #333;
  display: grid; place-items: center; cursor: pointer; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
:global(:root.dark) .lab-back { background: #1c1c1f; border-color: #33333a; color: #efeff1; }
.lab-title { display: flex; flex-direction: column; line-height: 1.3; }
.lab-name { font-size: 15px; font-weight: 700; color: #1c1c1f; }
:global(:root.dark) .lab-name { color: #efeff1; }
.lab-hint { font-size: 11px; color: #8a8f96; }
:global(:root.dark) .lab-hint { color: #7c7f86; }

.lab-switch { display: flex; gap: 8px; width: 100%; max-width: 460px; margin-bottom: 14px; }
.lab-opt {
  flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
  padding: 10px 14px; border-radius: 14px; border: 1px solid #c8cbd1; background: #f4f5f7; color: #333;
  cursor: pointer; text-align: left; transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.lab-opt.active { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.18); }
:global(:root.dark) .lab-opt { background: #1c1c1f; border-color: #33333a; color: #efeff1; }
.lab-opt-tag { font-size: 11px; font-weight: 700; color: #4f46e5; letter-spacing: 0.5px; }
.lab-opt-name { font-size: 13px; font-weight: 600; }

.lab-frame {
  flex: 1;
  width: 100%;
  max-width: 460px;
  position: relative;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 30px 60px -20px rgba(20, 20, 40, 0.35);
  background: transparent;
}
</style>