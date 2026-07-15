<template>
  <Teleport to="body">
    <div v-if="visible" class="pin-overlay" @click.self="$emit('close')">
      <div class="pin-dialog">
        <h2 class="pin-title">输入PIN码</h2>
        <div class="pin-dots">
          <span
            v-for="i in 6"
            :key="i"
            class="pin-dot"
            :class="{ filled: i <= pinLength }"
          />
        </div>
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
import { ref } from 'vue'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'submit', pin: string): void
}>()

const pinLength = ref(0)

const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function onKeyPress(key: number) {
  if (pinLength.value < 6) {
    pinLength.value++
  }
}

function onBackspace() {
  if (pinLength.value > 0) {
    pinLength.value--
  }
}
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