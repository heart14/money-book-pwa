<template>
  <div v-if="visible" class="keyboard-mask" @click.self="emit('close')">
    <div class="keyboard-wrapper" @click.stop>
      <div class="keyboard-grid">
        <button
          v-for="key in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
          :key="key"
          class="key num-key"
          @click="handleDigit(key)"
        >
          {{ key }}
        </button>
        <button class="key dot-key" @click="handleDot">.</button>
        <button class="key zero-key" @click="handleDigit('0')">0</button>
        <button class="key backspace-key" @click="handleBackspace">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
            <line x1="18" y1="9" x2="12" y2="15"/>
            <line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>
        <button
          class="key confirm-key"
          @click="handleComplete"
        >
          ↵
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: string
  visible: boolean
}>()

const emit = defineEmits<{
  'update:value': [value: string]
  close: []
}>()

function handleDigit(d: string) {
  let v = props.value
  if (v === '0') {
    v = d
  } else {
    const digitsOnly = v.replace('.', '')
    if (digitsOnly.length >= 10) return
    v += d
  }
  emit('update:value', v)
}

function handleDot() {
  if (props.value.includes('.')) return
  emit('update:value', props.value + '.')
}

function handleBackspace() {
  let v = props.value
  if (v.length <= 1 || v === '0.') {
    emit('update:value', '0')
    return
  }
  emit('update:value', v.slice(0, -1))
}

function handleComplete() {
  emit('close')
}
</script>

<style scoped>
.keyboard-mask {
  position: fixed;
  inset: 0;
  z-index: 900;
}

.keyboard-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 901;
  background: #e5e5ea;
  padding-bottom: env(safe-area-inset-bottom);
  user-select: none;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 72px;
  grid-template-rows: repeat(4, 54px);
  gap: 6px;
  padding: 8px 8px 4px;
  max-width: 420px;
  margin: 0 auto;
}

.key {
  border: none;
  background: #fff;
  color: #1c1c1e;
  font-size: 22px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.key:active {
  background: #e5e5ea;
}

.zero-key {
  grid-column: 2;
}

.dot-key {
  grid-column: 1;
}

.backspace-key {
  grid-column: 3;
  color: #8e8e93;
}

.confirm-key {
  grid-column: 4;
  grid-row: 1 / -1;
  background: #007aff;
  color: #fff;
  font-size: 24px;
  font-weight: 500;
  border-radius: 10px;
}

.confirm-key:active {
  background: #0056cc;
}

.confirm-key.disabled {
  opacity: 0.35;
  pointer-events: none;
}
</style>