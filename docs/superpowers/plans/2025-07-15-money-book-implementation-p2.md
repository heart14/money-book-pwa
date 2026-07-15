# 《钱书》V1.0 实施计划 · Part 2（Task 5-9）

> 承接 Part 1 (Task 1-4：脚手架/数据库/Composables/防错引擎)

---

### Task 5: Pinia Stores

**Files:**
- Create: `src/stores/accountStore.ts`
- Create: `src/stores/categoryStore.ts`
- Create: `src/stores/transactionStore.ts`

**Interfaces:**
- Consumes: Task 3 的 composables
- Produces: 全局可用的 Pinia store

- [ ] **Step 1: 创建 accountStore.ts**

```typescript
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAccounts } from '@/composables/useAccounts'
import type { Account } from '@/types'

export const useAccountStore = defineStore('accounts', () => {
  const { accounts } = useAccounts()

  const groupedAccounts = computed(() => {
    const list = accounts.value ?? []
    const groupOrder = ['流动性资产', '限制性资产', '债权', '负债']
    return groupOrder
      .map(g => ({ groupName: g, accounts: list.filter(a => a.groupName === g) }))
      .filter(g => g.accounts.length > 0)
  })

  const netWorth = computed(() =>
    (accounts.value ?? []).reduce((sum, a) => sum + a.balance, 0)
  )

  const totalAssets = computed(() =>
    (accounts.value ?? []).filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0)
  )

  const totalLiabilities = computed(() =>
    Math.abs((accounts.value ?? []).filter(a => a.type === 'debt').reduce((sum, a) => sum + a.balance, 0))
  )

  return { accounts, groupedAccounts, netWorth, totalAssets, totalLiabilities }
})
```

- [ ] **Step 2: 创建 categoryStore.ts**

```typescript
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCategories } from '@/composables/useCategories'

export const useCategoryStore = defineStore('categories', () => {
  const { categories, expenseTree, incomeTree, toggleLatteFactor, toggleHidden } = useCategories()

  const latteFactorIds = computed(() =>
    (categories.value ?? []).filter(c => c.isLatteFactor && c.parentId !== null).map(c => c.id!)
  )

  const flatExpenseSubCategories = computed(() =>
    (categories.value ?? []).filter(c => c.type === 'expense' && c.parentId !== null)
  )

  return { categories, expenseTree, incomeTree, latteFactorIds, flatExpenseSubCategories, toggleLatteFactor, toggleHidden }
})
```

- [ ] **Step 3: 创建 transactionStore.ts**

```typescript
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useTransactions } from '@/composables/useTransactions'
import type { TransactionType } from '@/types'

export const useTransactionStore = defineStore('transactions', () => {
  const { transactions, addTransaction, deleteTransaction } = useTransactions()
  const currentFilterType = ref<TransactionType | 'all'>('all')
  const currentMonth = ref(new Date().toISOString().slice(0, 7))

  const filteredTransactions = computed(() =>
    (transactions.value ?? []).filter(t =>
      (currentFilterType.value === 'all' || t.type === currentFilterType.value) &&
      t.date.startsWith(currentMonth.value)
    )
  )

  const monthlyTransactions = computed(() =>
    (transactions.value ?? []).filter(t => t.date.startsWith(currentMonth.value))
  )

  return { transactions, filteredTransactions, monthlyTransactions, currentFilterType, currentMonth, addTransaction, deleteTransaction }
})
```

- [ ] **Step 4: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: add Pinia stores for accounts, categories, and transactions"
```

---

### Task 6: 路由与布局组件

**Files:**
- Create: `src/router/index.ts`
- Create: `src/App.vue`
- Create: `src/components/layout/MobileLayout.vue`
- Create: `src/components/layout/DesktopLayout.vue`
- Create: `src/pages/booking/BookingPage.vue` (占位)
- Create: `src/pages/accounts/AccountsPage.vue` (占位)
- Create: `src/pages/stats/StatsPage.vue` (占位)
- Create: `src/pages/settings/SettingsPage.vue` (占位)

- [ ] **Step 1: 创建 src/router/index.ts**

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'booking', component: () => import('@/pages/booking/BookingPage.vue'), meta: { title: '记账' } },
  { path: '/accounts', name: 'accounts', component: () => import('@/pages/accounts/AccountsPage.vue'), meta: { title: '账户' } },
  { path: '/accounts/:id', name: 'accountDetail', component: () => import('@/pages/accounts/AccountDetail.vue'), meta: { title: '账户详情' } },
  { path: '/stats', name: 'stats', component: () => import('@/pages/stats/StatsPage.vue'), meta: { title: '统计' } },
  { path: '/settings', name: 'settings', component: () => import('@/pages/settings/SettingsPage.vue'), meta: { title: '设置' } },
]

const router = createRouter({ history: createWebHistory(), routes })
export default router
```

- [ ] **Step 2: 创建 src/App.vue**

```vue
<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import DesktopLayout from '@/components/layout/DesktopLayout.vue'

const breakpoints = useBreakpoints({ mobile: 768 })
const isMobile = breakpoints.smaller('mobile')
</script>

<template>
  <MobileLayout v-if="isMobile" />
  <DesktopLayout v-else />
</template>
```

- [ ] **Step 3: 创建 MobileLayout.vue**

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
const tabs = [
  { name: 'booking', title: '记账', icon: 'notes-o' as const },
  { name: 'accounts', title: '账户', icon: 'balance-o' as const },
  { name: 'stats', title: '统计', icon: 'chart-trending-o' as const },
  { name: 'settings', title: '设置', icon: 'setting-o' as const },
]
function onTabChange(name: string) { router.push({ name }) }
</script>

<template>
  <div class="mobile-layout">
    <div class="mobile-content"><router-view /></div>
    <van-tabbar :value="route.name as string" @change="onTabChange" active-color="#1989fa">
      <van-tabbar-item v-for="tab in tabs" :key="tab.name" :name="tab.name" :icon="tab.icon">{{ tab.title }}</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.mobile-layout { display: flex; flex-direction: column; height: 100vh; }
.mobile-content { flex: 1; overflow-y: auto; padding-bottom: 50px; }
</style>
```

- [ ] **Step 4: 创建 DesktopLayout.vue**

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
const navItems = [
  { name: 'booking', title: '记账', icon: 'notes-o' },
  { name: 'accounts', title: '账户', icon: 'balance-o' },
  { name: 'stats', title: '统计', icon: 'chart-trending-o' },
  { name: 'settings', title: '设置', icon: 'setting-o' },
]
function navigate(name: string) { router.push({ name }) }
</script>

<template>
  <div class="desktop-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h2>💰 钱书</h2></div>
      <van-sidebar :value="navItems.findIndex(i => i.name === route.name)">
        <van-sidebar-item v-for="item in navItems" :key="item.name" @click="navigate(item.name)">
          <template #title><span>{{ item.title }}</span></template>
        </van-sidebar-item>
      </van-sidebar>
    </aside>
    <main class="main-content"><router-view /></main>
  </div>
</template>

<style scoped>
.desktop-layout { display: flex; height: 100vh; }
.sidebar { width: 240px; border-right: 1px solid #ebedf0; background: #f7f8fa; }
.sidebar-header { padding: 24px 16px 16px; border-bottom: 1px solid #ebedf0; }
.sidebar-header h2 { margin: 0; font-size: 20px; }
.main-content { flex: 1; overflow-y: auto; padding: 24px; background: #fff; }
</style>
```

- [ ] **Step 5: 创建 4 个占位页面**

```vue
<!-- src/pages/booking/BookingPage.vue -->
<template><div class="page-placeholder"><h2>记账</h2></div></template>
```

以同样方式（仅改标题）创建 AccountsPage.vue、StatsPage.vue、SettingsPage.vue。

- [ ] **Step 6: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: add router, layout components, and page placeholders"
```

---

### Task 7: 极速记账页

**Files:**
- Create: `src/components/booking/NumberKeyboard.vue`
- Create: `src/components/booking/ModeSwitch.vue`
- Create: `src/components/booking/CategoryPicker.vue`
- Create: `src/components/booking/TransferPanel.vue`
- Create: `src/utils/format.ts`
- Modify: `src/pages/booking/BookingPage.vue`

- [ ] **Step 1: 创建 src/utils/format.ts**

```typescript
export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}
export function formatDateDisplay(date: string): string {
  const d = new Date(date)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}
```

- [ ] **Step 2: 创建 NumberKeyboard.vue**

```vue
<script setup lang="ts">
const emit = defineEmits<{ input: [value: string]; delete: []; confirm: [] }>()
function onInput(k: string) { emit('input', k) }
</script>

<template>
  <div class="number-keyboard">
    <div class="keyboard-grid">
      <button v-for="n in 9" :key="n" class="key" @click="onInput(String(n))">{{ n }}</button>
      <button class="key" @click="onInput('.')">.</button>
      <button class="key" @click="onInput('0')">0</button>
      <button class="key key-delete" @click="$emit('delete')">⌫</button>
    </div>
    <button class="key-confirm" @click="$emit('confirm')">确认</button>
  </div>
</template>

<style scoped>
.number-keyboard { display: flex; background: #f7f8fa; user-select: none; }
.keyboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); flex: 1; gap: 1px; background: #e8e8e8; }
.key { height: 48px; background: #fff; border: none; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.key:active { background: #e8e8e8; }
.key-delete { font-size: 16px; }
.key-confirm { width: 80px; background: #1989fa; color: #fff; border: none; font-size: 16px; cursor: pointer; }
.key-confirm:active { background: #0570db; }
</style>
```

- [ ] **Step 3: 创建 ModeSwitch.vue**

```vue
<script setup lang="ts">
import type { TransactionType } from '@/types'
defineProps<{ modelValue: TransactionType; locked: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: TransactionType] }>()
const modes = [
  { value: 'expense', label: '支出' }, { value: 'income', label: '收入' }, { value: 'transfer', label: '转账' },
]
function onSelect(m: TransactionType) { if (!locked) emit('update:modelValue', m) }
</script>
<template>
  <div class="mode-switch">
    <div v-for="m in modes" :key="m.value" :class="['mode-tab', { active: modelValue === m.value, locked }]" @click="onSelect(m.value)">{{ m.label }}</div>
  </div>
</template>
<style scoped>
.mode-switch { display: flex; background: #f7f8fa; border-radius: 8px; padding: 2px; margin: 12px 16px; }
.mode-tab { flex: 1; text-align: center; padding: 8px 0; border-radius: 6px; font-size: 14px; color: #666; cursor: pointer; }
.mode-tab.active { background: #fff; color: #1989fa; font-weight: 600; }
.mode-tab.locked { opacity: 0.7; cursor: not-allowed; }
</style>
```

- [ ] **Step 4: 创建 CategoryPicker.vue**

```vue
<script setup lang="ts">
import { useCategoryStore } from '@/stores/categoryStore'
import type { Category } from '@/types'
defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const catStore = useCategoryStore()
function select(cat: Category) { if (cat.id) emit('update:modelValue', cat.id) }
</script>
<template>
  <div class="category-picker" v-if="modelValue !== undefined">
    <div v-for="parent in catStore.expenseTree" :key="parent.id" class="cat-group">
      <div class="cat-group-title">{{ parent.icon }} {{ parent.name }}</div>
      <div class="cat-grid">
        <div v-for="child in parent.children" :key="child.id" :class="['cat-item', { active: modelValue === child.id }]" @click="select(child)">
          <span class="cat-icon">{{ child.icon || parent.icon }}</span>
          <span class="cat-name">{{ child.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.category-picker { padding: 8px 16px; max-height: 300px; overflow-y: auto; }
.cat-group { margin-bottom: 12px; }
.cat-group-title { font-size: 13px; color: #999; margin-bottom: 8px; font-weight: 600; }
.cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.cat-item { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border-radius: 8px; background: #f7f8fa; cursor: pointer; }
.cat-item.active { background: #1989fa; color: #fff; }
.cat-icon { font-size: 20px; margin-bottom: 4px; }
.cat-name { font-size: 11px; }
</style>
```

- [ ] **Step 5: 创建 TransferPanel.vue**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account } from '@/types'
const emit = defineEmits<{ 'update:from': [value: number | null]; 'update:to': [value: number | null] }>()
defineProps<{ fromAccountId: number | null; toAccountId: number | null }>()
const accountStore = useAccountStore()
const showPicker = ref(false)
const picking = ref<'from' | 'to'>('from')
const allAccounts = computed(() => accountStore.accounts ?? [])
function open(target: 'from' | 'to') { picking.value = target; showPicker.value = true }
function select(acct: Account) {
  emit(picking.value === 'from' ? 'update:from' : 'update:to', acct.id ?? null)
  showPicker.value = false
}
</script>
<template>
  <div class="transfer-panel">
    <div class="account-row" @click="open('from')">
      <span class="label">转出</span>
      <span class="value">{{ allAccounts.find(a => a.id === fromAccountId)?.name || '选择账户' }}</span>
    </div>
    <div class="arrow">↓</div>
    <div class="account-row" @click="open('to')">
      <span class="label">转入</span>
      <span class="value">{{ allAccounts.find(a => a.id === toAccountId)?.name || '选择账户' }}</span>
    </div>
    <van-action-sheet v-model:show="showPicker" title="选择账户">
      <div class="account-list">
        <div v-for="acct in allAccounts" :key="acct.id" class="account-option" @click="select(acct)">
          {{ acct.icon }} {{ acct.name }}
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>
<style scoped>
.transfer-panel { padding: 16px; }
.account-row { display: flex; justify-content: space-between; padding: 12px 16px; background: #f7f8fa; border-radius: 8px; cursor: pointer; }
.arrow { text-align: center; padding: 4px; color: #999; font-size: 18px; }
.label { color: #666; } .value { color: #333; font-weight: 600; }
.account-list { padding: 16px; }
.account-option { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
</style>
```

- [ ] **Step 6: 实现完整的 BookingPage.vue**

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTransactionStore } from '@/stores/transactionStore'
import { useAccountStore } from '@/stores/accountStore'
import { useValidationEngine } from '@/composables/useValidationEngine'
import type { TransactionType, Account } from '@/types'
import ModeSwitch from '@/components/booking/ModeSwitch.vue'
import CategoryPicker from '@/components/booking/CategoryPicker.vue'
import NumberKeyboard from '@/components/booking/NumberKeyboard.vue'
import TransferPanel from '@/components/booking/TransferPanel.vue'

const tStore = useTransactionStore()
const aStore = useAccountStore()
const { validateTransferEligibility } = useValidationEngine()

const mode = ref<TransactionType>('expense')
const modeLocked = ref(false)
const amount = ref('')
const fromAccountId = ref<number | null>(null)
const toAccountId = ref<number | null>(null)
const categoryId = ref<number | null>(null)
const note = ref('')
const showCategoryPicker = ref(false)

const displayAmount = computed(() => amount.value ? (+amount.value).toFixed(2) : '0.00')

watch([fromAccountId, toAccountId], ([fId, tId]) => {
  const list = aStore.accounts ?? []
  const from = list.find((a: Account) => a.id === fId)
  const to = list.find((a: Account) => a.id === tId)
  if (from && to) {
    const r = validateTransferEligibility(from.type, to.type, mode.value)
    if (r.forceMode) { mode.value = r.forceMode; modeLocked.value = r.lockMode; categoryId.value = null }
  }
})

async function onConfirm() {
  if (!amount.value || +amount.value <= 0) return
  const date = new Date().toISOString().slice(0, 10)
  if (mode.value === 'transfer') {
    if (!fromAccountId.value || !toAccountId.value) return
    await tStore.addTransaction({ type: 'transfer', amount: +amount.value, fromAccountId: fromAccountId.value, toAccountId: toAccountId.value, categoryId: null, tags: [], note: note.value, date })
  } else if (mode.value === 'expense') {
    if (!fromAccountId.value || !categoryId.value) return
    await tStore.addTransaction({ type: 'expense', amount: +amount.value, fromAccountId: fromAccountId.value, toAccountId: null, categoryId: categoryId.value, tags: [], note: note.value, date })
  } else {
    if (!toAccountId.value || !categoryId.value) return
    await tStore.addTransaction({ type: 'income', amount: +amount.value, fromAccountId: null, toAccountId: toAccountId.value, categoryId: categoryId.value, tags: [], note: note.value, date })
  }
  amount.value = ''; categoryId.value = null; note.value = ''; modeLocked.value = false
}

function accountSheetKey() { } // placeholder for template ref
</script>

<template>
  <div class="booking-page">
    <ModeSwitch v-model="mode" :locked="modeLocked" />
    <div v-if="mode !== 'transfer'" class="input-area">
      <div v-if="mode === 'expense'" class="field-row" @click="accountSheetKey">
        <span class="field-label">从</span>
        <span class="field-value">{{ (aStore.accounts ?? []).find((a: Account) => a.id === fromAccountId)?.name || '选择账户' }}</span>
      </div>
      <div v-if="mode === 'income'" class="field-row" @click="accountSheetKey">
        <span class="field-label">到</span>
        <span class="field-value">{{ (aStore.accounts ?? []).find((a: Account) => a.id === toAccountId)?.name || '选择账户' }}</span>
      </div>
      <div class="field-row" @click="showCategoryPicker = !showCategoryPicker">
        <span class="field-label">分类</span>
        <span class="field-value">{{ categoryId ? '已选择' : '选择分类' }}</span>
      </div>
      <CategoryPicker v-if="showCategoryPicker" v-model="categoryId" />
    </div>
    <TransferPanel v-if="mode === 'transfer'" v-model:from="fromAccountId" v-model:to="toAccountId" />
    <div class="note-row"><van-field v-model="note" placeholder="添加备注" :border="false" /></div>
    <div class="amount-display">
      <span class="amount-symbol">{{ mode === 'expense' ? '-' : mode === 'income' ? '+' : '' }}</span>
      <span class="amount-value">¥ {{ displayAmount }}</span>
    </div>
    <NumberKeyboard @input="amount += $event" @delete="amount = amount.slice(0, -1)" @confirm="onConfirm" />
  </div>
</template>

<style scoped>
.booking-page { display: flex; flex-direction: column; height: 100%; }
.input-area { padding: 0 16px; }
.field-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.field-label { color: #666; font-size: 14px; }
.field-value { color: #333; font-size: 14px; }
.amount-display { text-align: center; padding: 20px; flex: 1; display: flex; align-items: center; justify-content: center; }
.amount-symbol { font-size: 20px; color: #333; margin-right: 4px; }
.amount-value { font-size: 36px; font-weight: 700; font-variant-numeric: tabular-nums; }
.note-row { padding: 0 16px; }
</style>
```

- [ ] **Step 7: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: implement booking page with keyboard, mode switch, and validation"
```

---

### Task 8: 账户中心页

**Files:**
- Create: `src/components/accounts/NetWorthCard.vue`
- Create: `src/components/accounts/AccountGroup.vue`
- Create: `src/components/common/EmptyState.vue`
- Create: `src/pages/accounts/AccountDetail.vue`
- Modify: `src/pages/accounts/AccountsPage.vue`

- [ ] **Step 1: 创建 NetWorthCard.vue**

```vue
<script setup lang="ts">
import { useAccountStore } from '@/stores/accountStore'
const acctStore = useAccountStore()
</script>
<template>
  <div class="net-worth-card">
    <div class="nw-header">
      <span class="label">净资产</span>
      <span class="amount">¥{{ acctStore.netWorth.toFixed(2) }}</span>
    </div>
    <div class="nw-detail">
      <div class="item"><span class="il">总资产</span><span class="iv positive">¥{{ acctStore.totalAssets.toFixed(2) }}</span></div>
      <div class="item"><span class="il">总负债</span><span class="iv negative">¥{{ acctStore.totalLiabilities.toFixed(2) }}</span></div>
    </div>
  </div>
</template>
<style scoped>
.net-worth-card { background: linear-gradient(135deg, #1989fa, #07c160); color: #fff; padding: 24px 20px; margin: 16px; border-radius: 12px; }
.nw-header { margin-bottom: 16px; }
.label { font-size: 13px; opacity: 0.9; }
.amount { display: block; font-size: 32px; font-weight: 700; margin-top: 4px; }
.nw-detail { display: flex; gap: 24px; }
.il { font-size: 12px; opacity: 0.8; }
.iv { display: block; font-size: 16px; font-weight: 600; margin-top: 2px; }
</style>
```

- [ ] **Step 2: 创建 AccountGroup.vue**

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Account } from '@/types'
defineProps<{ groupName: string; accounts: Account[] }>()
const router = useRouter()
function go(id?: number) { if (id) router.push({ name: 'accountDetail', params: { id } }) }
function balCls(a: Account) { return a.type === 'debt' ? 'debt' : a.balance >= 0 ? 'positive' : 'negative' }
</script>
<template>
  <div class="acc-group">
    <div class="group-title">{{ groupName }}</div>
    <div v-for="acct in accounts" :key="acct.id" class="acc-item" @click="go(acct.id)">
      <span class="ai-icon">{{ acct.icon }}</span>
      <span class="ai-name">{{ acct.name }}</span>
      <span :class="['ai-balance', balCls(acct)]">¥{{ acct.balance.toFixed(2) }}</span>
    </div>
  </div>
</template>
<style scoped>
.acc-group { margin: 0 16px 16px; }
.group-title { font-size: 13px; color: #999; margin-bottom: 8px; padding: 0 4px; }
.acc-item { display: flex; align-items: center; padding: 14px 12px; background: #fff; border-radius: 8px; margin-bottom: 2px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.acc-item:active { background: #f7f8fa; }
.ai-icon { font-size: 20px; margin-right: 12px; }
.ai-name { flex: 1; font-size: 15px; }
.ai-balance { font-size: 15px; font-weight: 600; }
.ai-balance.debt { color: #ee0a24; }
.ai-balance.positive { color: #333; }
</style>
```

- [ ] **Step 3: 实现 AccountsPage.vue**

```vue
<script setup lang="ts">
import { useAccountStore } from '@/stores/accountStore'
import NetWorthCard from '@/components/accounts/NetWorthCard.vue'
import AccountGroup from '@/components/accounts/AccountGroup.vue'

const acctStore = useAccountStore()
</script>

<template>
  <div class="accounts-page">
    <NetWorthCard />
    <div class="account-list">
      <AccountGroup v-for="g in acctStore.groupedAccounts" :key="g.groupName" :group-name="g.groupName" :accounts="g.accounts" />
    </div>
  </div>
</template>

<style scoped>
.accounts-page { background: #f7f8fa; min-height: 100%; }
.account-list { padding-bottom: 20px; }
</style>
```

- [ ] **Step 4: 创建 AccountDetail.vue**

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAccountStore } from '@/stores/accountStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { computed } from 'vue'
import type { Account } from '@/types'

const route = useRoute()
const acctStore = useAccountStore()
const tStore = useTransactionStore()

const account = computed(() =>
  (acctStore.accounts ?? []).find((a: Account) => a.id === Number(route.params.id))
)

const relatedTransactions = computed(() =>
  (tStore.transactions ?? []).filter(t => t.fromAccountId === account.value?.id || t.toAccountId === account.value?.id)
)
</script>

<template>
  <div class="account-detail" v-if="account">
    <van-nav-bar :title="account.name" left-arrow @click-left="$router.back()" />
    <div class="detail-balance">
      <span class="db-label">当前余额</span>
      <span :class="['db-amount', { debt: account.type === 'debt' }]">¥{{ account.balance.toFixed(2) }}</span>
    </div>
    <div class="detail-transactions">
      <div v-for="tx in relatedTransactions" :key="tx.id" class="tx-item">
        <span :class="['tx-type', tx.type]">{{ tx.type === 'expense' ? '支出' : tx.type === 'income' ? '收入' : '转账' }}</span>
        <span class="tx-amount">¥{{ tx.amount.toFixed(2) }}</span>
        <span class="tx-date">{{ tx.date }}</span>
      </div>
      <van-empty v-if="relatedTransactions.length === 0" description="暂无流水" />
    </div>
  </div>
</template>

<style scoped>
.detail-balance { text-align: center; padding: 32px 16px; background: linear-gradient(135deg, #1989fa, #07c160); color: #fff; }
.db-label { font-size: 13px; opacity: 0.8; }
.db-amount { display: block; font-size: 36px; font-weight: 700; margin-top: 8px; }
.db-amount.debt { color: #ffcccc; }
.detail-transactions { padding: 16px; }
.tx-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.tx-type { padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 12px; }
.tx-type.expense { background: #fee; color: #ee0a24; }
.tx-type.income { background: #efe; color: #07c160; }
.tx-type.transfer { background: #eef; color: #1989fa; }
.tx-amount { flex: 1; font-weight: 600; }
.tx-date { color: #999; font-size: 12px; }
</style>
```

- [ ] **Step 5: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: implement accounts page with net worth card and detail view"
```

---

### Task 9: 统计分析页

**Files:**
- Create: `src/composables/useStats.ts`
- Create: `src/components/stats/MonthlyChart.vue`
- Create: `src/components/stats/PieChart.vue`
- Create: `src/components/stats/LatteFactorCard.vue`
- Create: `src/components/stats/HousingCostCard.vue`
- Modify: `src/pages/stats/StatsPage.vue`

- [ ] **Step 1: 创建 src/composables/useStats.ts**

```typescript
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { computed } from 'vue'
import type { Category } from '@/types'

export function useStats() {
  const tStore = useTransactionStore()
  const catStore = useCategoryStore()

  const monthlyTotal = computed(() => {
    const txns = tStore.monthlyTransactions ?? []
    return {
      expense: txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      income: txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    }
  })

  const expenseByCategory = computed(() => {
    const txns = (tStore.monthlyTransactions ?? []).filter(t => t.type === 'expense')
    const cats = catStore.flatExpenseSubCategories ?? []
    const map = new Map<number, number>()
    txns.forEach(t => {
      if (t.categoryId) map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount)
    })
    return Array.from(map.entries()).map(([catId, amount]) => {
      const cat = cats.find((c: Category) => c.id === catId)
      return { categoryId: catId, name: cat?.name || '未知', icon: cat?.icon || '📦', amount }
    }).sort((a, b) => b.amount - a.amount)
  })

  const latteFactorTotal = computed(() => {
    const latteIds = catStore.latteFactorIds ?? []
    return (tStore.monthlyTransactions ?? [])
      .filter(t => t.type === 'expense' && t.categoryId && latteIds.includes(t.categoryId))
      .reduce((s, t) => s + t.amount, 0)
  })

  const yearlyLatteLoss = computed(() => {
    return latteFactorTotal.value * 12 * 1.05 // 5% 年化复利简化
  })

  return { monthlyTotal, expenseByCategory, latteFactorTotal, yearlyLatteLoss }
}
```

- [ ] **Step 2: 创建 MonthlyChart.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useStats } from '@/composables/useStats'

const stats = useStats()
</script>
<template>
  <div class="chart-card">
    <div class="card-title">月度收支</div>
    <div class="monthly-bars">
      <div class="bar-item">
        <span class="bar-label">支出</span>
        <div class="bar-bar"><div class="bar-fill expense" :style="{ width: '100%' }"></div></div>
        <span class="bar-value negative">-¥{{ stats.monthlyTotal.expense.toFixed(0) }}</span>
      </div>
      <div class="bar-item">
        <span class="bar-label">收入</span>
        <div class="bar-bar"><div class="bar-fill income" :style="{ width: Math.min(stats.monthlyTotal.income / (stats.monthlyTotal.expense || 1) * 100, 100) + '%' }"></div></div>
        <span class="bar-value positive">+¥{{ stats.monthlyTotal.income.toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>
<style scoped>
.chart-card { background: #fff; border-radius: 12px; padding: 16px; margin: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.bar-item { display: flex; align-items: center; margin-bottom: 8px; gap: 8px; }
.bar-label { width: 40px; font-size: 13px; color: #666; }
.bar-bar { flex: 1; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 10px; }
.bar-fill.expense { background: #ee0a24; }
.bar-fill.income { background: #07c160; }
.bar-value { width: 80px; text-align: right; font-size: 13px; font-weight: 600; }
.negative { color: #ee0a24; } .positive { color: #07c160; }
</style>
```

- [ ] **Step 3: 创建 PieChart.vue**

```vue
<script setup lang="ts">
import { useStats } from '@/composables/useStats'
const stats = useStats()
</script>
<template>
  <div class="chart-card">
    <div class="card-title">支出分类排行</div>
    <div class="pie-list">
      <div v-for="item in stats.expenseByCategory" :key="item.categoryId" class="pie-item">
        <span class="pi-icon">{{ item.icon }}</span>
        <span class="pi-name">{{ item.name }}</span>
        <span class="pi-bar"><span class="pi-fill" :style="{ width: (item.amount / (stats.monthlyTotal.expense || 1) * 100) + '%' }"></span></span>
        <span class="pi-amount">¥{{ item.amount.toFixed(0) }}</span>
      </div>
      <van-empty v-if="stats.expenseByCategory.length === 0" description="本月暂无支出" />
    </div>
  </div>
</template>
<style scoped>
.chart-card { background: #fff; border-radius: 12px; padding: 16px; margin: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.pie-item { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pi-icon { font-size: 16px; }
.pi-name { width: 60px; font-size: 13px; }
.pi-bar { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.pi-fill { height: 100%; background: #1989fa; border-radius: 4px; }
.pi-amount { width: 70px; text-align: right; font-size: 13px; font-weight: 600; }
</style>
```

- [ ] **Step 4: 创建 LatteFactorCard.vue**

```vue
<script setup lang="ts">
import { useStats } from '@/composables/useStats'
const stats = useStats()
</script>
<template>
  <div class="insight-card latte" v-if="stats.latteFactorTotal > 0">
    <div class="card-title">☕ 拿铁因子吞噬机</div>
    <div class="insight-body">
      <div class="big-number">¥{{ stats.latteFactorTotal.toFixed(0) }}</div>
      <div class="insight-desc">本月拿铁因子消费</div>
      <div class="insight-warn">若用来投资，1年复利可达 ¥{{ stats.yearlyLatteLoss.toFixed(0) }}</div>
    </div>
  </div>
</template>
<style scoped>
.insight-card { background: #fff; border-radius: 12px; padding: 16px; margin: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.insight-card.latte { border-left: 4px solid #ff976a; }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.insight-body { text-align: center; }
.big-number { font-size: 36px; font-weight: 700; color: #ff976a; }
.insight-desc { font-size: 13px; color: #666; margin: 8px 0; }
.insight-warn { font-size: 12px; color: #999; }
</style>
```

- [ ] **Step 5: 创建 HousingCostCard.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Category } from '@/types'

const tStore = useTransactionStore()
const catStore = useCategoryStore()

const housingCategories = computed(() =>
  (catStore.categories ?? []).filter((c: Category) => ['房租房贷', '生活缴费'].includes(c.name)).map((c: Category) => c.id!)
)

const housingTotal = computed(() =>
  (tStore.monthlyTransactions ?? [])
    .filter(t => t.type === 'expense' && t.categoryId && housingCategories.value.includes(t.categoryId))
    .reduce((s, t) => s + t.amount, 0)
)
</script>
<template>
  <div class="insight-card housing" v-if="housingTotal > 0">
    <div class="card-title">🏠 真实居住成本</div>
    <div class="insight-body">
      <div class="big-number">¥{{ housingTotal.toFixed(0) }}</div>
      <div class="insight-desc">本月居住支出</div>
    </div>
  </div>
</template>
<style scoped>
.insight-card { background: #fff; border-radius: 12px; padding: 16px; margin: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.insight-card.housing { border-left: 4px solid #1989fa; }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.insight-body { text-align: center; }
.big-number { font-size: 36px; font-weight: 700; color: #1989fa; }
.insight-desc { font-size: 13px; color: #666; margin-top: 8px; }
</style>
```

- [ ] **Step 6: 实现 StatsPage.vue**

```vue
<script setup lang="ts">
import MonthlyChart from '@/components/stats/MonthlyChart.vue'
import PieChart from '@/components/stats/PieChart.vue'
import LatteFactorCard from '@/components/stats/LatteFactorCard.vue'
import HousingCostCard from '@/components/stats/HousingCostCard.vue'
</script>

<template>
  <div class="stats-page">
    <MonthlyChart />
    <PieChart />
    <LatteFactorCard />
    <HousingCostCard />
  </div>
</template>

<style scoped>
.stats-page { background: #f7f8fa; min-height: 100%; padding-bottom: 20px; }
</style>
```

- [ ] **Step 7: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: implement stats page with charts and insight cards"
```