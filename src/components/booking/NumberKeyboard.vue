<script setup lang="ts">
const emit = defineEmits<{
  input: [value: string]
  delete: []
  confirm: []
}>()

function onInput(k: string) {
  emit('input', k)
}
</script>

<template>
  <div class="number-keyboard">
    <div class="keyboard-grid">
      <button
        v-for="n in 9"
        :key="n"
        class="key"
        @click="onInput(String(n))"
      >
        {{ n }}
      </button>
      <button class="key" @click="onInput('.')">.</button>
      <button class="key" @click="onInput('0')">0</button>
      <button class="key key-delete" @click="$emit('delete')">⌫</button>
    </div>
    <button class="key-confirm" @click="$emit('confirm')">确认</button>
  </div>
</template>

<style scoped>
.number-keyboard {
  display: flex;
  background: #f7f8fa;
  user-select: none;
}
.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  flex: 1;
  gap: 1px;
  background: #e8e8e8;
}
.key {
  height: 48px;
  background: #fff;
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.key:active {
  background: #e8e8e8;
}
.key-delete {
  font-size: 16px;
}
.key-confirm {
  width: 80px;
  background: #1989fa;
  color: #fff;
  border: none;
  font-size: 16px;
  cursor: pointer;
}
.key-confirm:active {
  background: #0570db;
}
</style>