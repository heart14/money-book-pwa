<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  confirm: [pin: string]
  cancel: []
  unlockByAnswer: []
}>()

const pin = ref('')
const errorMsg = ref('')

function onDigit(d: string) {
  if (pin.value.length < 6) {
    pin.value += d
    errorMsg.value = ''
  }
}

function onDelete() {
  pin.value = pin.value.slice(0, -1)
}

function onConfirm() {
  if (pin.value.length >= 4) {
    emit('confirm', pin.value)
  } else {
    errorMsg.value = 'PIN 码至少 4 位'
  }
}
</script>

<template>
  <div class="pin-overlay">
    <div class="pin-dialog">
      <h3>输入 PIN 码</h3>
      <div class="pin-dots">
        <span
          v-for="i in 6"
          :key="i"
          :class="['dot', { filled: i <= pin.length }]"
        ></span>
      </div>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div class="pin-keypad">
        <button
          v-for="n in 9"
          :key="n"
          class="pin-key"
          @click="onDigit(String(n))"
        >
          {{ n }}
        </button>
        <button class="pin-key pin-key-empty"></button>
        <button class="pin-key" @click="onDigit('0')">0</button>
        <button class="pin-key" @click="onDelete">⌫</button>
      </div>
      <div class="pin-actions">
        <van-button size="small" plain @click="$emit('cancel')">取消</van-button>
        <van-button size="small" type="primary" @click="onConfirm">确认</van-button>
      </div>
      <div class="pin-forgot">
        <span @click="$emit('unlockByAnswer')">忘记 PIN？</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.pin-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  width: 300px;
  text-align: center;
}
.pin-dialog h3 {
  margin: 0 0 20px;
  font-size: 18px;
}
.pin-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #1989fa;
}
.dot.filled {
  background: #1989fa;
}
.error-msg {
  color: #ee0a24;
  font-size: 12px;
  margin-bottom: 12px;
}
.pin-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.pin-key {
  height: 48px;
  border: none;
  border-radius: 8px;
  background: #f7f8fa;
  font-size: 20px;
  cursor: pointer;
}
.pin-key:active {
  background: #e8e8e8;
}
.pin-key-empty {
  background: transparent;
  cursor: default;
}
.pin-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.pin-forgot {
  margin-top: 16px;
  font-size: 12px;
  color: #999;
}
.pin-forgot span {
  cursor: pointer;
  color: #1989fa;
}
</style>