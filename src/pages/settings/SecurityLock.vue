<template>
  <div class="security-lock">
    <div class="page-header">
      <button class="back-btn" @click="$emit('back')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>设置</span>
      </button>
      <h3 class="page-title">PIN 码锁</h3>
    </div>

    <!-- ── No PIN: Setup flow ── -->
    <template v-if="!hasPin">
      <div class="section-card">
        <template v-if="setupStep === 1">
          <p class="pin-prompt">设置 6 位数字 PIN 码</p>
          <div class="pin-input-area">
            <div class="pin-dots">
              <span v-for="i in 6" :key="i" class="dot" :class="{ filled: i <= pinInput.length }"></span>
            </div>
            <input
              ref="pinInputRef"
              v-model="pinInput"
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              autocomplete="off"
              class="pin-hidden-input"
            />
          </div>
          <button class="btn-primary" :disabled="pinInput.length !== 6" @click="onSetupFirst">确认</button>
        </template>
        <template v-if="setupStep === 2">
          <p class="pin-prompt">再次输入 PIN 码确认</p>
          <div class="pin-input-area">
            <div class="pin-dots">
              <span v-for="i in 6" :key="i" class="dot" :class="{ filled: i <= pinConfirm.length }"></span>
            </div>
            <input
              ref="pinConfirmRef"
              v-model="pinConfirm"
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              autocomplete="off"
              class="pin-hidden-input"
            />
          </div>
          <p v-if="pinError" class="pin-error">{{ pinError }}</p>
          <button class="btn-primary" :disabled="pinConfirm.length !== 6" @click="onSetupSecond">确认</button>
          <button class="btn-link" @click="resetSetup">重新输入</button>
        </template>
      </div>
    </template>

    <!-- ── Has PIN ── -->
    <template v-else>
      <!-- Verify old PIN first -->
      <div v-if="!verified" class="section-card">
        <p class="pin-prompt">输入当前 PIN 码</p>
        <div class="pin-input-area">
          <div class="pin-dots">
            <span v-for="i in 6" :key="i" class="dot" :class="{ filled: i <= verifyInput.length }"></span>
          </div>
          <input
            ref="verifyInputRef"
            v-model="verifyInput"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            autocomplete="off"
            class="pin-hidden-input"
            @input="onVerifyAuto"
          />
        </div>
        <p v-if="pinError" class="pin-error">{{ pinError }}</p>
        <button class="btn-primary" :disabled="verifyInput.length !== 6" @click="onVerify">验证</button>
      </div>

      <!-- Verified: options -->
      <div v-else>
        <!-- Change flow -->
        <template v-if="changeStep > 0">
          <div class="section-card">
            <template v-if="changeStep === 1">
              <p class="pin-prompt">输入新 PIN 码</p>
              <div class="pin-input-area">
                <div class="pin-dots">
                  <span v-for="i in 6" :key="i" class="dot" :class="{ filled: i <= newPin.length }"></span>
                </div>
                <input
                  ref="newPinRef"
                  v-model="newPin"
                  type="password"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  autocomplete="off"
                  class="pin-hidden-input"
                />
              </div>
              <button class="btn-primary" :disabled="newPin.length !== 6" @click="onChangeFirst">下一步</button>
              <button class="btn-link" @click="cancelChange">取消</button>
            </template>
            <template v-if="changeStep === 2">
              <p class="pin-prompt">再次输入新 PIN 码确认</p>
              <div class="pin-input-area">
                <div class="pin-dots">
                  <span v-for="i in 6" :key="i" class="dot" :class="{ filled: i <= newPinConfirm.length }"></span>
                </div>
                <input
                  ref="newPinConfirmRef"
                  v-model="newPinConfirm"
                  type="password"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  autocomplete="off"
                  class="pin-hidden-input"
                />
              </div>
              <p v-if="pinError" class="pin-error">{{ pinError }}</p>
              <button class="btn-primary" :disabled="newPinConfirm.length !== 6" @click="onChangeSecond">确认</button>
              <button class="btn-link" @click="cancelChange">取消</button>
            </template>
          </div>
        </template>

        <!-- Action buttons -->
        <div v-else class="section-card">
          <button class="action-row" @click="changeStep = 1">
            <span>修改 PIN 码</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c7c7cc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div class="separator"></div>
          <button class="action-row action-row--danger" @click="showDisableConfirm = true">
            关闭 PIN 码
          </button>
        </div>
      </div>
    </template>

    <!-- Success / status messages -->
    <div v-if="successMsg" class="section-card success-card">
      <p class="success-text">{{ successMsg }}</p>
    </div>

    <!-- Disable confirmation dialog -->
    <ConfirmDialog
      :visible="showDisableConfirm"
      title="确认关闭 PIN 码？"
      message="关闭后，再次开启需要设置新的 PIN 码。"
      confirm-text="确认关闭"
      confirm-type="danger"
      @confirm="onDisable"
      @update:visible="showDisableConfirm = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { hashPIN, getStoredPINHash, setStoredPINHash, clearPIN } from '@/utils/crypto'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

defineEmits<{
  (e: 'back'): void
}>()

// ── State ──
const hasPin = ref(!!getStoredPINHash())
const verified = ref(false)
const setupStep = ref(0)
const changeStep = ref(0)
const pinError = ref('')
const successMsg = ref('')

// PIN inputs
const pinInput = ref('')
const pinConfirm = ref('')
const verifyInput = ref('')
const newPin = ref('')
const newPinConfirm = ref('')

// Modal state
const showDisableConfirm = ref(false)

// Refs for auto-focus
const pinInputRef = ref<HTMLInputElement | null>(null)
const pinConfirmRef = ref<HTMLInputElement | null>(null)
const verifyInputRef = ref<HTMLInputElement | null>(null)
const newPinRef = ref<HTMLInputElement | null>(null)
const newPinConfirmRef = ref<HTMLInputElement | null>(null)

// Auto-focus
watch(pinInputRef, (el) => el?.focus())
watch(pinConfirmRef, (el) => el?.focus())
watch(verifyInputRef, (el) => el?.focus())
watch(newPinRef, (el) => el?.focus())
watch(newPinConfirmRef, (el) => el?.focus())

// ── No PIN: Setup ──
function startSetup() {
  setupStep.value = 1
  pinInput.value = ''
  pinConfirm.value = ''
  pinError.value = ''
  nextTick(() => pinInputRef.value?.focus())
}

function onSetupFirst() {
  if (pinInput.value.length !== 6) return
  setupStep.value = 2
  pinError.value = ''
  nextTick(() => pinConfirmRef.value?.focus())
}

async function onSetupSecond() {
  if (pinConfirm.value.length !== 6) return
  if (pinInput.value !== pinConfirm.value) {
    pinError.value = '两次输入的 PIN 码不一致，请重新输入'
    pinConfirm.value = ''
    nextTick(() => pinConfirmRef.value?.focus())
    return
  }
  const hash = await hashPIN(pinConfirm.value)
  setStoredPINHash(hash)
  hasPin.value = true
  successMsg.value = 'PIN 码设置成功'
  resetSetup()
}

function resetSetup() {
  setupStep.value = 0
  pinInput.value = ''
  pinConfirm.value = ''
  pinError.value = ''
}

// ── Has PIN: Verify ──
async function onVerify() {
  if (verifyInput.value.length !== 6) return
  const hash = await hashPIN(verifyInput.value)
  if (hash === getStoredPINHash()) {
    verified.value = true
    pinError.value = ''
  } else {
    pinError.value = 'PIN 码错误'
    verifyInput.value = ''
    nextTick(() => verifyInputRef.value?.focus())
  }
}

function onVerifyAuto() {
  if (verifyInput.value.length === 6) {
    onVerify()
  }
}

// ── Has PIN: Change ──
function onChangeFirst() {
  if (newPin.value.length !== 6) return
  changeStep.value = 2
  pinError.value = ''
  nextTick(() => newPinConfirmRef.value?.focus())
}

async function onChangeSecond() {
  if (newPinConfirm.value.length !== 6) return
  if (newPin.value !== newPinConfirm.value) {
    pinError.value = '两次输入的 PIN 码不一致，请重新输入'
    newPinConfirm.value = ''
    nextTick(() => newPinConfirmRef.value?.focus())
    return
  }
  const hash = await hashPIN(newPinConfirm.value)
  setStoredPINHash(hash)
  successMsg.value = 'PIN 码已更新'
  cancelChange()
}

function cancelChange() {
  changeStep.value = 0
  newPin.value = ''
  newPinConfirm.value = ''
  pinError.value = ''
}

// ── Has PIN: Disable ──
async function onDisable() {
  clearPIN()
  hasPin.value = false
  verified.value = false
  showDisableConfirm.value = false
  successMsg.value = 'PIN 码已关闭'
}

// If no PIN initially, start setup immediately
if (!hasPin.value) {
  startSetup()
}
</script>

<style scoped>
.security-lock {
  padding: 16px;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: none;
  font-size: 16px;
  color: var(--color-primary);
  cursor: pointer;
  padding: 4px 0;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

/* ── Section Card ── */
.section-card {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

/* ── PIN Input ── */
.pin-prompt {
  text-align: center;
  font-size: 15px;
  color: var(--color-text);
  margin-bottom: 16px;
}

.pin-input-area {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.pin-hidden-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: text;
}

.pin-dots {
  display: flex;
  gap: 12px;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #c7c7cc;
  background: transparent;
  transition: all 0.2s;
}

.dot.filled {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.pin-error {
  text-align: center;
  font-size: 14px;
  color: var(--color-destructive);
  margin-bottom: 12px;
}

/* ── Buttons ── */
.btn-primary {
  display: block;
  width: 100%;
  height: 44px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.btn-primary:active {
  opacity: 0.7;
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-link {
  display: block;
  width: 100%;
  margin-top: 8px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--color-secondary-text);
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

/* ── Action Row ── */
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 0;
  border: none;
  background: none;
  font-size: 16px;
  color: var(--color-text);
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

.action-row:active {
  opacity: 0.5;
}

.action-row--danger {
  color: var(--color-destructive);
}

.separator {
  height: 1px;
  background: var(--color-separator);
  margin: 0;
}

/* ── Success ── */
.success-card {
  background: #e8f5e9;
}

.success-text {
  text-align: center;
  font-size: 15px;
  color: #2e7d32;
}

</style>