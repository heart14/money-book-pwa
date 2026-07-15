<template>
  <div class="keyboard-wrapper">
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
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
          <line x1="18" y1="9" x2="12" y2="15"/>
          <line x1="12" y1="9" x2="18" y2="15"/>
        </svg>
      </button>
      <button
        class="key confirm-key"
        :class="{ disabled: value === '0' }"
        @click="handleConfirm"
      >
        确定
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: string
}>()

const emit = defineEmits<{
  'update:value': [value: string]
  confirm: []
}>()

function handleDigit(d: string) {
  let v = props.value
  if (v === '0') {
    v = d
  } else {
    // Limit to 10 digits (excluding decimal point)
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

function handleConfirm() {
  if (props.value === '0') return
  emit('confirm')
}
</script>

<style scoped>
.keyboard-wrapper {
  width: 100%;
  background: #1c1c1e;
  padding-bottom: env(safe-area-inset-bottom);
  user-select: none;
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 64px;
  grid-template-rows: repeat(4, 56px);
  gap: 6px;
  padding: 8px 8px 4px;
}

.key {
  border: none;
  background: #333;
  color: #fff;
  font-size: 22px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
  font-family: inherit;
}

.key:active {
  background: #555;
}

.zero-key {
  grid-column: 2;
}

.dot-key {
  grid-column: 1;
}

.backspace-key {
  grid-column: 3;
}

.confirm-key {
  grid-column: 4;
  grid-row: 1 / -1;
  background: #34c759;
  font-size: 16px;
  font-weight: 600;
  writing-mode: vertical-lr;
  letter-spacing: 2px;
}

.confirm-key:active {
  background: #28a745;
}

.confirm-key.disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>