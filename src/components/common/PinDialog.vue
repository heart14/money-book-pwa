<template>
  <Teleport to="body">
    <Transition name="pin-enter">
      <div v-if="visible" class="pin-overlay">
        <div class="pin-shell">
          <!-- ── Header ── -->
          <div class="pin-header">
            <div class="pin-lock-badge">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <!-- <h1 class="pin-app-name">钱书</h1> -->
            <p class="pin-subtitle">已锁定</p>
          </div>

          <!-- ── PIN Dots ── -->
          <div class="pin-dots-wrap" :class="{ shake: shaking }">
            <div class="pin-dots">
              <span
                v-for="i in 6"
                :key="i"
                class="pin-dot"
                :class="{ filled: i <= pinLength }"
              />
            </div>
            <Transition name="err-fade">
              <p v-if="errorMsg" class="pin-error">{{ errorMsg }}</p>
            </Transition>
          </div>

          <!-- ── Spacer ── -->
          <div class="pin-spacer" />

          <!-- ── Keyboard ── -->
          <div class="pin-keyboard">
            <button
              v-for="key in keys"
              :key="key"
              class="pin-key"
              :class="{ 'pin-key--pressed': pressedKey === key }"
              @click="onKeyPress(key)"
              @pointerdown="onPointerDown(key)"
              @pointerup="onPointerUp"
              @pointerleave="onPointerUp"
            >
              <span class="pin-key-label">{{ key }}</span>
            </button>
            <div class="pin-key pin-key--blank" />
            <button class="pin-key" :class="{ 'pin-key--pressed': pressedKey === 0 }" @click="onKeyPress(0)" @pointerdown="onPointerDown(0)" @pointerup="onPointerUp" @pointerleave="onPointerUp">
              <span class="pin-key-label">0</span>
            </button>
            <button class="pin-key pin-key--backspace" :class="{ 'pin-key--pressed': pressedKey === -1 }" @click="onBackspace" @pointerdown="onPointerDown(-1)" @pointerup="onPointerUp" @pointerleave="onPointerUp">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 5H9l-6 7 6 7h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                <line x1="16" y1="10" x2="12" y2="14" />
                <line x1="12" y1="10" x2="16" y2="14" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </Transition>
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
const pressedKey = ref<number | null>(null)
const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function onPointerDown(key: number) {
  pressedKey.value = key
}

function onPointerUp() {
  pressedKey.value = null
}

function clearPin() {
  pinValue.value = ''
  pinLength.value = 0
}

function triggerShake() {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 500)
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

watch(() => props.visible, (visible) => {
  if (visible) clearPin()
})

watch(() => props.errorMsg, (msg) => {
  if (msg) {
    triggerShake()
    clearPin()
  }
})

watch(() => props.resetKey, () => {
  clearPin()
})
</script>

<style scoped>
/* ── Overlay ── */
.pin-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  display: flex;
  align-items: stretch;
  justify-content: center;
  z-index: 1000;
}

.pin-shell {
  flex: 1;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 36px;
  padding-top: max(env(safe-area-inset-top, 0px) + 48px, 80px);
  padding-bottom: max(env(safe-area-inset-bottom, 0px) + 48px, 80px);
}

/* ── Header ── */
.pin-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.pin-lock-badge {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #0056b3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  margin-bottom: 2px;
  transition: box-shadow 0.3s;
}

.pin-app-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.5px;
}

.pin-subtitle {
  font-size: 14px;
  color: var(--color-secondary-text);
  font-weight: 400;
  margin-top: -4px;
}

/* ── PIN Dots ── */
.pin-dots-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
}

.pin-dots {
  display: flex;
  gap: 16px;
}

.pin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: transparent;
  border: 2.5px solid var(--color-placeholder);
  transition: background 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pin-dot.filled {
  background: var(--color-primary);
  border-color: var(--color-primary);
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.35);
}

.pin-error {
  font-size: 13px;
  color: var(--color-destructive);
  text-align: center;
  min-height: 18px;
  font-weight: 500;
}

/* ── Error fade ── */
.err-fade-enter-active,
.err-fade-leave-active {
  transition: opacity 0.2s ease;
}
.err-fade-enter-from,
.err-fade-leave-to {
  opacity: 0;
}

/* ── Shake ── */
.shake {
  animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
}

/* ── Spacer ── */
.pin-spacer {
  flex: 1;
  min-height: 20px;
}

/* ── Keyboard ── */
.pin-keyboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 300px;
}

.pin-key {
  aspect-ratio: 1;
  max-height: 84px;
  border: none;
  border-radius: 50%;
  background: var(--color-card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background 0.2s,
              transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.2s;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07),
              0 0 0 0.5px rgba(0, 0, 0, 0.02);
  user-select: none;
  -webkit-user-select: none;
}

.pin-key:active,
.pin-key--pressed {
  background: var(--color-disabled-bg);
  transform: scale(0.92);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pin-key-label {
  font-size: 34px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0;
  line-height: 1;
}

.pin-key--blank {
  background: transparent;
  box-shadow: none;
  cursor: default;
  pointer-events: none;
}

.pin-key--backspace {
  color: var(--color-secondary-text);
}

.pin-key--backspace:active,
.pin-key--backspace.pin-key--pressed {
  color: var(--color-text);
}

/* ── Dark mode refinements ── */
:root.dark .pin-key {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.05);
}

:root.dark .pin-lock-badge {
  box-shadow: 0 4px 20px rgba(10, 132, 255, 0.35);
}

/* ── Entrance transition ── */
.pin-enter-enter-active {
  transition: opacity 0.25s ease;
}

.pin-enter-enter-active .pin-shell {
  transition: transform 0.35s cubic-bezier(0.34, 1.0, 0.64, 1), opacity 0.25s ease;
}

.pin-enter-leave-active {
  transition: opacity 0.2s ease;
}

.pin-enter-leave-active .pin-shell {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.pin-enter-enter-from {
  opacity: 0;
}

.pin-enter-enter-from .pin-shell {
  transform: translateY(16px);
  opacity: 0;
}

.pin-enter-leave-to {
  opacity: 0;
}

.pin-enter-leave-to .pin-shell {
  transform: translateY(-8px);
  opacity: 0;
}
</style>