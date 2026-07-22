<template>
  <Teleport to="body">
    <div v-if="visible" class="pin-overlay" @click.self="$emit('close')">
      <div class="pin-dialog">
        <h2 class="pin-title">输入PIN码</h2>
        <div class="pin-dots" :class="{ shake: shaking }">
          <span
            v-for="i in 6"
            :key="i"
            class="pin-dot"
            :class="{ filled: i <= pinLength }"
          />
        </div>
        <p v-if="errorMsg" class="pin-error">{{ errorMsg }}</p>
        <div class="pin-keyboard">
          <button
            v-for="key in keys"
            :key="key"
            class="pin-key"
            @click="onKeyPress(key)"
          >
            {{ key }}
          </button>
          <button class="pin-key pin-key--empty" disabled />
          <button class="pin-key pin-key--zero" @click="onKeyPress(0)">0</button>
          <button class="pin-key pin-key--backspace" @click="onBackspace">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  errorMsg?: string
  resetKey?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', pin: string): void
}>()

const pinValue = ref('')
const pinLength = ref(0)
const shaking = ref(false)

const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function clearPin() {
  pinValue.value = ''
  pinLength.value = 0
}

function triggerShake() {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 400)
}

function onKeyPress(key: number) {
  if (pinLength.value >= 6) return
  pinValue.value += String(key)
  pinLength.value = pinValue.value.length
  if (pinLength.value === 6) {
    emit('submit', pinValue.value)
  }
}

function onBackspace() {
  if (pinValue.value.length > 0) {
    pinValue.value = pinValue.value.slice(0, -1)
    pinLength.value = pinValue.value.length
  }
}

// 每次打开弹窗时重置 PIN 输入和错误
watch(() => props.visible, (visible) => {
  if (visible) {
    clearPin()
  }
})

// 输错 PIN 时自动清空 + shake 动画
watch(() => props.errorMsg, (msg) => {
  if (msg) {
    triggerShake()
    clearPin()
  }
})

// 收到重置信号时清空部分输入的 PIN
watch(() => props.resetKey, () => {
  clearPin()
})
</script>

<style scoped>
.pin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pin-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 280px;
}

.pin-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1c1c1e;
}

.pin-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
}

.pin-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #c7c7cc;
  transition: background 0.2s, border-color 0.2s;
}

.pin-dot.filled {
  background: #007aff;
  border-color: #007aff;
}

.pin-error {
  text-align: center;
  font-size: 13px;
  color: #ff3b30;
  margin-bottom: 12px;
  min-height: 18px;
}

/* ── Shake 动画 ── */
.shake {
  animation: shake 0.35s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.pin-keyboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pin-key {
  height: 48px;
  border: none;
  border-radius: 8px;
  background: #f2f2f6;
  font-size: 20px;
  font-weight: 500;
  color: #1c1c1e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.pin-key:active {
  background: #e5e5ea;
}

.pin-key--empty {
  background: transparent;
  cursor: default;
}

.pin-key--zero {
  grid-column: 2;
}

.pin-key--backspace svg {
  color: #8e8e93;
}
</style>