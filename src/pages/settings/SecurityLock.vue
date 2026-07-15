<script setup lang="ts">
import { ref } from 'vue'
import { usePinLock } from '@/composables/usePinLock'
import { showSuccessToast, showConfirmDialog } from 'vant'

const { pinSet, setPin, removePin } = usePinLock()
const showSetup = ref(false)
const pinInput = ref('')
const confirmPin = ref('')
const question = ref('')
const answer = ref('')
const confirmAnswer = ref('')
const step = ref<'question' | 'pin' | 'confirm'>('question')

async function savePin() {
  if (!question.value || !answer.value) return
  if (pinInput.value.length < 4) {
    showSuccessToast('PIN 码至少 4 位')
    return
  }
  if (pinInput.value !== confirmPin.value) {
    showSuccessToast('两次输入的 PIN 不一致')
    return
  }
  await setPin(pinInput.value, question.value, answer.value)
  showSetup.value = false
  pinInput.value = ''
  confirmPin.value = ''
  question.value = ''
  answer.value = ''
  step.value = 'question'
  showSuccessToast('安全锁已开启')
}

async function handleRemove() {
  await showConfirmDialog({ message: '确定要关闭安全锁吗？' })
  removePin()
  showSuccessToast('安全锁已关闭')
}

function nextStep() {
  if (step.value === 'question' && question.value && answer.value) {
    step.value = 'pin'
  } else if (step.value === 'pin' && pinInput.value.length >= 4) {
    step.value = 'confirm'
  }
}
</script>

<template>
  <div class="security-lock">
    <van-cell-group title="安全锁">
      <van-cell center title="状态">
        <template #right-icon>
          <span :style="{ color: pinSet ? '#07c160' : '#999' }">
            {{ pinSet ? '已开启' : '未开启' }}
          </span>
        </template>
      </van-cell>
      <van-cell
        :title="pinSet ? '关闭安全锁' : '开启安全锁'"
        is-link
        @click="pinSet ? handleRemove() : showSetup = true"
      />
    </van-cell-group>

    <!-- Setup Dialog -->
    <van-dialog
      v-model:show="showSetup"
      title="设置安全锁"
      show-cancel-button
      @confirm="savePin"
      :confirm-button-disabled="step !== 'confirm' || confirmPin.length < 4"
    >
      <div class="setup-form">
        <template v-if="step === 'question'">
          <van-field v-model="question" label="密保问题" placeholder="如：我的第一只宠物名字" />
          <van-field v-model="answer" label="密保答案" placeholder="请输入答案" />
          <van-button size="small" type="primary" class="step-btn" @click="nextStep" :disabled="!question || !answer">
            下一步
          </van-button>
        </template>
        <template v-if="step === 'pin'">
          <van-field v-model="pinInput" label="PIN 码" type="password" placeholder="4-6 位数字" maxlength="6" />
          <van-button size="small" type="primary" class="step-btn" @click="nextStep" :disabled="pinInput.length < 4">
            下一步
          </van-button>
        </template>
        <template v-if="step === 'confirm'">
          <van-field v-model="confirmPin" label="确认 PIN" type="password" placeholder="再次输入" maxlength="6" />
        </template>
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.setup-form {
  padding: 16px;
}
.step-btn {
  margin: 12px auto 0;
  display: block;
}
</style>