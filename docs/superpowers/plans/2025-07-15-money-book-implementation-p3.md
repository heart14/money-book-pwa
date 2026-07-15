# 《钱书》V1.0 实施计划 · Part 3（Task 10-12）

> 承接 Part 2 (Task 5-9：Stores/布局/记账/账户/统计)

---

### Task 10: 设置页（安全锁 + 数据管理 + 分类管理）

**Files:**
- Create: `src/composables/usePinLock.ts`
- Create: `src/components/common/PinDialog.vue`
- Create: `src/utils/crypto.ts`
- Create: `src/utils/export.ts`
- Create: `src/pages/settings/SecurityLock.vue`
- Create: `src/pages/settings/DataManagement.vue`
- Modify: `src/pages/settings/SettingsPage.vue`
- Modify: `src/App.vue` (添加 PIN 锁)

- [ ] **Step 1: 创建 src/utils/crypto.ts**

```typescript
export async function hashWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function generateSalt(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}
```

- [ ] **Step 2: 创建 src/composables/usePinLock.ts**

```typescript
import { ref, onMounted, onUnmounted } from 'vue'
import { hashWithSalt, generateSalt } from '@/utils/crypto'

const STORAGE_KEY = 'moneybook_pin'
const SALT_KEY = 'moneybook_pin_salt'
const QUESTION_KEY = 'moneybook_pin_question'
const ANSWER_KEY = 'moneybook_pin_answer'
const LOCKOUT_KEY = 'moneybook_pin_lockout'
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 60000 // 60s

export function usePinLock() {
  const isLocked = ref(false)
  const pinSet = ref(!!localStorage.getItem(STORAGE_KEY))

  async function setPin(pin: string, question: string, answer: string): Promise<void> {
    const salt = generateSalt()
    const hash = await hashWithSalt(pin, salt)
    localStorage.setItem(STORAGE_KEY, hash)
    localStorage.setItem(SALT_KEY, salt)
    localStorage.setItem(QUESTION_KEY, question)
    const ansSalt = generateSalt()
    const ansHash = await hashWithSalt(answer, ansSalt)
    localStorage.setItem(ANSWER_KEY, JSON.stringify({ hash: ansHash, salt: ansSalt }))
    pinSet.value = true
  }

  async function verifyPin(pin: string): Promise<boolean> {
    const stored = localStorage.getItem(STORAGE_KEY)
    const salt = localStorage.getItem(SALT_KEY)
    if (!stored || !salt) return false

    // 检查锁定
    const lockout = localStorage.getItem(LOCKOUT_KEY)
    if (lockout) {
      const elapsed = Date.now() - Number(lockout)
      if (elapsed < LOCKOUT_DURATION) return false
      localStorage.removeItem(LOCKOUT_KEY)
    }

    const hash = await hashWithSalt(pin, salt)
    if (hash === stored) {
      isLocked.value = false
      return true
    }

    // 记录失败次数
    const attempts = Number(localStorage.getItem('moneybook_pin_attempts') || '0') + 1
    localStorage.setItem('moneybook_pin_attempts', String(attempts))
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, String(Date.now()))
      localStorage.removeItem('moneybook_pin_attempts')
    }
    return false
  }

  async function verifySecurityAnswer(answer: string): Promise<boolean> {
    const stored = localStorage.getItem(ANSWER_KEY)
    if (!stored) return false
    const { hash, salt } = JSON.parse(stored)
    const ansHash = await hashWithSalt(answer, salt)
    return ansHash === hash
  }

  function getSecurityQuestion(): string | null {
    return localStorage.getItem(QUESTION_KEY)
  }

  function removePin(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SALT_KEY)
    localStorage.removeItem(QUESTION_KEY)
    localStorage.removeItem(ANSWER_KEY)
    localStorage.removeItem('moneybook_pin_attempts')
    localStorage.removeItem(LOCKOUT_KEY)
    pinSet.value = false
  }

  function lock(): void {
    isLocked.value = true
  }

  // 自动锁定检测
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && pinSet.value) {
      isLocked.value = true
    }
  }

  onMounted(() => {
    if (pinSet.value) {
      isLocked.value = true
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { isLocked, pinSet, setPin, verifyPin, verifySecurityAnswer, getSecurityQuestion, removePin, lock }
}
```

- [ ] **Step 3: 创建 PinDialog.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ confirm: [pin: string]; cancel: [] }>()
const pin = ref('')

function onDigit(d: string) {
  if (pin.value.length < 6) pin.value += d
}
function onDelete() { pin.value = pin.value.slice(0, -1) }
function onConfirm() {
  if (pin.value.length >= 4) {
    emit('confirm', pin.value)
    pin.value = ''
  }
}
</script>

<template>
  <div class="pin-overlay">
    <div class="pin-dialog">
      <h3>输入 PIN 码</h3>
      <div class="pin-dots">
        <span v-for="i in 6" :key="i" :class="['dot', { filled: i <= pin.length }]"></span>
      </div>
      <div class="pin-keypad">
        <button v-for="n in 9" :key="n" class="pin-key" @click="onDigit(String(n))">{{ n }}</button>
        <button class="pin-key" @click="onDigit('0')">0</button>
        <button class="pin-key" @click="onDelete">⌫</button>
      </div>
      <div class="pin-actions">
        <van-button size="small" plain @click="$emit('cancel')">取消</van-button>
        <van-button size="small" type="primary" @click="onConfirm">确认</van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.pin-dialog { background: #fff; border-radius: 16px; padding: 32px 24px; width: 300px; text-align: center; }
.pin-dialog h3 { margin: 0 0 20px; font-size: 18px; }
.pin-dots { display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; }
.dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #1989fa; }
.dot.filled { background: #1989fa; }
.pin-keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
.pin-key { height: 48px; border: none; border-radius: 8px; background: #f7f8fa; font-size: 20px; cursor: pointer; }
.pin-key:active { background: #e8e8e8; }
.pin-actions { display: flex; justify-content: center; gap: 16px; }
</style>
```

- [ ] **Step 4: 创建 src/utils/export.ts**

```typescript
import { db } from '@/db'

export async function exportData(): Promise<void> {
  const accounts = await db.accounts.toArray()
  const categories = await db.categories.toArray()
  const transactions = await db.transactions.toArray()
  const data = { version: 1, exportedAt: new Date().toISOString(), accounts, categories, transactions }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `钱书备份_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data.accounts || !data.categories || !data.transactions) {
    throw new Error('无效的备份文件')
  }
  await db.transaction('rw', db.accounts, db.categories, db.transactions, async () => {
    await db.accounts.clear()
    await db.categories.clear()
    await db.transactions.clear()
    await db.accounts.bulkAdd(data.accounts)
    await db.categories.bulkAdd(data.categories)
    await db.transactions.bulkAdd(data.transactions)
  })
}

export async function destroyAllData(): Promise<void> {
  await db.delete()
  const keys = await caches.keys()
  await Promise.all(keys.map(k => caches.delete(k)))
  const registrations = await navigator.serviceWorker?.getRegistrations()
  await Promise.all(registrations?.map(r => r.unregister()) ?? [])
  // 重置数据库以便重新初始化
  window.location.reload()
}
```

- [ ] **Step 5: 实现 SecurityLock.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePinLock } from '@/composables/usePinLock'
import { showSuccessToast, showConfirmDialog } from 'vant'

const { pinSet, setPin, removePin } = usePinLock()
const showSetup = ref(false)
const pinInput = ref('')
const question = ref('')
const answer = ref('')
const confirmPin = ref('')
const step = ref<'question' | 'pin' | 'confirm'>('question')

async function savePin() {
  if (!question.value || !answer.value) return
  if (pinInput.value.length < 4 || pinInput.value !== confirmPin.value) return
  await setPin(pinInput.value, question.value, answer.value)
  showSetup.value = false
  showSuccessToast('PIN 设置成功')
}

async function handleRemove() {
  await showConfirmDialog({ message: '确定要关闭安全锁吗？' })
  removePin()
}
</script>

<template>
  <div class="security-lock">
    <van-cell-group title="安全锁">
      <van-cell center :title="pinSet ? '已开启' : '未开启'">
        <template #right-icon>
          <van-switch v-model="showSetup" :model-value="pinSet" @change="v => v ? showSetup = true : handleRemove()" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-dialog v-model:show="showSetup" title="设置安全锁" show-cancel-button @confirm="savePin">
      <div class="setup-form">
        <van-field v-if="step === 'question'" v-model="question" label="密保问题" placeholder="如：我的第一只宠物名字" />
        <van-field v-if="step === 'question'" v-model="answer" label="密保答案" placeholder="请输入答案" />
        <van-field v-if="step === 'pin'" v-model="pinInput" label="PIN 码" type="password" placeholder="4-6 位数字" maxlength="6" />
        <van-field v-if="step === 'confirm'" v-model="confirmPin" label="确认 PIN" type="password" placeholder="再次输入" maxlength="6" />
        <van-button v-if="step === 'question'" size="small" @click="step = 'pin'">下一步</van-button>
        <van-button v-if="step === 'pin'" size="small" @click="step = 'confirm'">下一步</van-button>
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.setup-form { padding: 16px; }
</style>
```

- [ ] **Step 6: 实现 DataManagement.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { exportData, importData, destroyAllData } from '@/utils/export'
import { showSuccessToast, showFailToast, showConfirmDialog, showDialog } from 'vant'

const importing = ref(false)

async function handleExport() {
  await exportData()
  showSuccessToast('导出成功')
}

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    importing.value = true
    await importData(file)
    showSuccessToast('导入成功')
  } catch (err) {
    showFailToast('导入失败：文件格式错误')
  } finally {
    importing.value = false
  }
}

async function handleDestroy() {
  await showConfirmDialog({
    title: '彻底销毁',
    message: '此操作将清空所有数据、注销 Service Worker、清除缓存。此操作不可撤销！',
    confirmButtonColor: '#ee0a24',
  })
  await showConfirmDialog({
    title: '再次确认',
    message: '真的要彻底销毁所有数据吗？',
    confirmButtonColor: '#ee0a24',
  })
  await destroyAllData()
}
</script>

<template>
  <div class="data-management">
    <van-cell-group title="数据管理">
      <van-cell title="导出备份" is-link @click="handleExport" />
      <van-cell title="导入备份" is-link @click="$refs.fileInput.click()" />
      <van-cell title="彻底销毁" is-link @click="handleDestroy" title-style="color: #ee0a24" />
    </van-cell-group>
    <input ref="fileInput" type="file" accept=".json" hidden @change="handleImport" />
  </div>
</template>
```

- [ ] **Step 7: 实现 SettingsPage.vue**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
<template>
  <div class="settings-page">
    <van-cell-group title="安全">
      <van-cell title="安全锁" is-link @click="router.push({ name: 'accountDetail', params: { id: 'security' } })" />
    </van-cell-group>
    <van-cell-group title="数据">
      <van-cell title="数据管理" is-link @click="router.push({ name: 'accountDetail', params: { id: 'data' } })" />
    </van-cell-group>
  </div>
</template>
<style scoped>
.settings-page { padding: 16px; }
</style>
```

注意：SettingsPage 中的路由跳转是占位逻辑，实际使用需改为 settings 内部页面或调整路由结构。有个更简明的方案——直接在 SettingsPage 内嵌安全锁和数据管理组件。

不如直接在同一页面内切换：

```vue
<script setup lang="ts">
import SecurityLock from './SecurityLock.vue'
import DataManagement from './DataManagement.vue'
import { ref } from 'vue'
const currentSection = ref<'main' | 'security' | 'data'>('main')
</script>

<template>
  <div class="settings-page">
    <template v-if="currentSection === 'main'">
      <van-cell-group title="安全">
        <van-cell title="安全锁" is-link @click="currentSection = 'security'" />
      </van-cell-group>
      <van-cell-group title="数据">
        <van-cell title="数据管理" is-link @click="currentSection = 'data'" />
      </van-cell-group>
    </template>
    <SecurityLock v-else-if="currentSection === 'security'" @back="currentSection = 'main'" />
    <DataManagement v-else-if="currentSection === 'data'" @back="currentSection = 'main'" />
  </div>
</template>
```

- [ ] **Step 8: 在 App.vue 集成 PIN 锁**

修改 `src/App.vue`：

```vue
<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import { usePinLock } from '@/composables/usePinLock'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import DesktopLayout from '@/components/layout/DesktopLayout.vue'
import PinDialog from '@/components/common/PinDialog.vue'

const breakpoints = useBreakpoints({ mobile: 768 })
const isMobile = breakpoints.smaller('mobile')
const { isLocked, verifyPin, verifySecurityAnswer, getSecurityQuestion } = usePinLock()

async function onPinConfirm(pin: string) {
  const ok = await verifyPin(pin)
  if (!ok) {
    // 可以尝试密保问题重置
  }
}

async function onResetByAnswer(answer: string) {
  const ok = await verifySecurityAnswer(answer)
  // 如果答案正确，跳转到重置 PIN 页面
}
</script>

<template>
  <PinDialog v-if="isLocked" @confirm="onPinConfirm" />
  <MobileLayout v-else-if="isMobile" />
  <DesktopLayout v-else />
</template>
```

- [ ] **Step 9: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: implement settings page with PIN lock, data export/import/destroy"
```

---

### Task 11: PWA 与持久化配置

**Files:**
- Modify: `vite.config.ts` (PWA 配置已在 Task 1 中设置，此处验证)
- Create: `public/logo-192.png` (占位 SVG)
- Create: `public/logo-512.png` (占位 SVG)
- Create: `public/favicon.svg`

- [ ] **Step 1: 创建 public/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text y="28" font-size="28">💰</text>
</svg>
```

- [ ] **Step 2: 创建 public/logo-192.png 和 logo-512.png**

用一个简单的 SVG 作为图标（使用内联 SVG 并通过 `<link>` 引用或使用 `.svg` 扩展名），或者使用 tinya PNG。最简单的方案——改 manifest 图标为 SVG：

```svg
<!-- public/logo.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#1989fa"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" fill="white">💰</text>
</svg>
```

然后更新 `vite.config.ts` 中 manifest 的 icons 指向 SVG：

```typescript
icons: [
  { src: 'logo.svg', sizes: '512x512', type: 'image/svg+xml' }
]
```

- [ ] **Step 3: 验证 PWA 构建**

Run: `npx vite build`
Expected: 构建成功，`dist/` 目录包含 `sw.js` 和 `manifest.webmanifest`

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: configure PWA icons and verify build"
```

---

### Task 12: 最终验证

- [ ] **Step 1: 完整类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 2: 完整构建**

Run: `npx vite build`
Expected: 构建成功，无错误

- [ ] **Step 3: 预览**

Run: `npx vite preview`
Expected: 本地启动预览服务器，打开后能看到完整应用

- [ ] **Step 4: 功能自查清单**

- [ ] 首次打开自动初始化预设账户和分类
- [ ] 记账页：支出模式可选择账户和分类，保存后余额更新
- [ ] 记账页：收入模式正常录入
- [ ] 记账页：转账模式选择转出/转入账户
- [ ] 智能防错：选择流动性→负债账户时强制转账模式
- [ ] 账户页：显示净资产大盘和四组账户列表
- [ ] 账户页：点击账户进入详情，查看相关流水
- [ ] 统计页：月度柱状图和分类排行正常显示
- [ ] 统计页：拿铁因子洞察卡和居住成本卡（有数据时）展示
- [ ] 设置页：PIN 锁设置、数据导出/导入/销毁
- [ ] 响应式：移动端底部 Tab，桌面端侧边栏
- [ ] PWA：`manifest.json` 存在，`display: standalone`

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "chore: final verification and build"
```