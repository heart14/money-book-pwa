<template>
  <Teleport to="body">
    <div v-if="visible" class="dt-mask" @click.self="onCancel">
      <div class="dt-box">
        <div class="dt-head">
          <span class="dt-title">日期</span>
        </div>

        <!-- 日期 -->
        <div class="dt-field">
          <input ref="dateInputRef" v-model="localDate" type="date" class="dt-native" />
        </div>

        <div class="dt-head dt-head--2">
          <span class="dt-title">时间</span>
          <button class="dt-now" @click="setNowTime">现在</button>
        </div>

        <!-- 时间 -->
        <div class="dt-field">
          <input ref="timeInputRef" v-model="localTime" type="time" class="dt-native" />
        </div>

        <div class="dt-acts">
          <button class="dt-btn dt-btn--x" @click="onCancel">取消</button>
          <button class="dt-btn dt-btn--ok" @click="onConfirm">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ date: string; time: string; visible: boolean }>()
const emit = defineEmits<{ (e:'update:date',v:string):void; (e:'update:time',v:string):void; (e:'close'):void }>()

const localDate = ref(props.date)
const localTime = ref(props.time?.slice(0,5) || '')
const dateInputRef = ref<HTMLInputElement>()
const timeInputRef = ref<HTMLInputElement>()

function init() {
  localDate.value = props.date
  localTime.value = props.time?.slice(0,5) || ''
  nextTick(() => {
    // 打开时自动弹出日期选择器
    dateInputRef.value?.showPicker?.()
  })
}

function setNowTime() {
  const n = new Date()
  localTime.value = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
}

function onConfirm() {
  emit('update:date', localDate.value)
  emit('update:time', localTime.value)
  emit('close')
}

function onCancel() { emit('close') }

watch(() => props.visible, v => { if (v) init() }, { immediate: true })
watch(() => props.date, v => { if (!props.visible) localDate.value = v })
watch(() => props.time, v => { if (!props.visible) localTime.value = v?.slice(0,5) || '' })
</script>

<style scoped>
.dt-mask{position:fixed;inset:0;background:var(--color-overlay);z-index:1000;display:flex;align-items:center;justify-content:center}
.dt-box{width:280px;background:var(--color-surface);border-radius:14px;padding:16px 16px 12px;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.dt-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.dt-head--2{margin-top:14px}
.dt-title{font-size:13px;font-weight:600;color:var(--color-text)}
.dt-now{border:none;background:none;color:var(--color-primary);font-size:12px;font-weight:500;cursor:pointer;padding:2px 6px;font-family:inherit;border-radius:4px}
.dt-now:active{background:var(--color-separator)}
.dt-field{display:flex;align-items:center;border:1px solid var(--color-separator-heavy);border-radius:8px;overflow:hidden}
.dt-native{width:100%;height:40px;border:none;background:var(--color-card);font-size:16px;font-weight:600;color:var(--color-text);padding:0 12px;font-family:inherit;font-variant-numeric:tabular-nums;outline:none}
.dt-native::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer;padding:6px}
.dt-acts{display:flex;gap:8px;margin-top:16px}
.dt-btn{flex:1;height:38px;border:none;border-radius:8px;font-size:15px;cursor:pointer;font-family:inherit;font-weight:500}
.dt-btn:active{opacity:.7}
.dt-btn--x{background:var(--color-separator);color:var(--color-secondary-text)}
.dt-btn--ok{background:var(--color-primary);color:#fff;font-weight:600}
</style>