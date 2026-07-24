# 快捷记账气泡 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在记账页添加"快捷记账气泡"功能，允许用户将高频记账内容保存为模板，一键填充到记账表单，并通过设置页管理模板。

**Architecture:** 新增 `QuickTemplate` 类型 + Dexie v5 迁移 + `quickTemplateStore` (Pinia) 提供响应式 CRUD；记账页通过 `applyTemplate()` 函数填充表单；交易详情页星标按钮提取模板；设置页内联 `QuickTemplateManager.vue` 子组件管理列表。

**Tech Stack:** Vue 3 (script setup), TypeScript strict, Pinia, Dexie.js, UnoCSS, iOS design tokens

## Global Constraints

- 所有金额以分为单位（`amount: number`）
- 兼容现有 Dexie v4 → v5 迁移，`.upgrade()` 函数不可省略
- `liveQuery` 复用 `useLiveQuery` composable（`src/composables/useLiveQuery.ts`）
- Pinia Store 统一使用 `defineStore('name', () => { ... })` 函数式写法
- 样式沿用 iOS 设计语言（CSS 变量：`--color-primary`, `--color-bg`, `--color-card`, `--color-text`, `--color-secondary-text`, `--radius-md` 等）
- 路径别名 `@` → `./src`
- 所有异步操作必须有 `.catch()` 或 `try-catch` 处理

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/index.ts` | 追加 | `QuickTemplate` 接口定义 |
| `src/db/index.ts` | 修改 | 新增 v5 版本，添加 `quickTemplates` 表 |
| `src/utils/export.ts` | 修改 | export / import / destroy 同步处理新表 |
| `src/stores/quickTemplateStore.ts` | 新建 | Pinia Store，含 CRUD + reorder + 去重检查 |
| `src/components/common/PromptDialog.vue` | 新建 | 命名输入弹窗组件 |
| `src/pages/booking/BookingPage.vue` | 修改 | 追加气泡展示区域 + applyTemplate + "+" 新建 |
| `src/components/transactions/TransactionDetail.vue` | 修改 | 追加星标提取按钮 |
| `src/pages/settings/QuickTemplateManager.vue` | 新建 | 设置页内联管理子组件 |
| `src/pages/settings/SettingsPage.vue` | 修改 | 新增"快捷记账"板块引入管理组件 |

---

### Task 1: 数据模型 + DB 迁移 + 导出兼容

**Files:**
- Modify: `src/types/index.ts` — 追加 `QuickTemplate` 接口
- Modify: `src/db/index.ts` — v5 迁移，新建 `quickTemplates` 表
- Modify: `src/utils/export.ts` — 三处同步更新

**Interfaces:**
- Produces: `QuickTemplate` 类型（完整见下方代码）
- Produces: `db.quickTemplates` Dexie 表
- Produces: 导出/导入数据中包含 `quickTemplates` 数组

- [ ] **Step 1: 追加 QuickTemplate 类型**

编辑 `src/types/index.ts`，在文件末尾追加：

```ts
export interface QuickTemplate {
  id?: number
  /** 用户自定义名称，如"每日咖啡" */
  name: string
  /** 记账模式 */
  type: 'expense' | 'income' | 'transfer'
  /** 金额（分） */
  amount: number
  /** 分类 ID */
  categoryId: number
  /** 标题（可选） */
  title: string
  /** 标签列表（可选） */
  tags: string[]
  /** 备注（可选） */
  note: string
  /** 排序序号，用于拖动排序 */
  sort: number
}
```

- [ ] **Step 2: Dexie v5 迁移**

编辑 `src/db/index.ts`，在 `this.version(4)` 块之后添加 v5：

```ts
// v5: 快捷记账气泡模板
this.version(5).stores({
  accounts: '++id, name',
  categories: '++id, type, parentId',
  transactions: '++id, type, date, categoryId, [date+id]',
  recurringRules: '++id, enabled, dayOfMonth',
  tags: '++id, &name',
  quickTemplates: '++id, type, sort',
})
```

同时确保类中声明新属性：

```ts
export class MoneyBookDB extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  recurringRules!: Table<RecurringRule, number>
  tags!: Table<Tag, number>
  quickTemplates!: Table<QuickTemplate, number>  // ← 新增

  constructor() {
    ...
  }
}
```

确保已有 `import type { QuickTemplate } from '@/types'`（或在已有 import 语句中追加）。

- [ ] **Step 3: 导出同步**

编辑 `src/utils/export.ts`：

在 `exportData()` 中，`Promise.all` 数组增加 `db.quickTemplates.toArray()`，`data` 对象增加 `quickTemplates`：

```ts
const [accounts, categories, transactions, recurringRules, quickTemplates] = await Promise.all([
  db.accounts.toArray(),
  db.categories.toArray(),
  db.transactions.toArray(),
  db.recurringRules.toArray(),
  db.quickTemplates.toArray(),
])

const data = { accounts, categories, transactions, recurringRules, quickTemplates }
```

在 `importData()` 中，`data` 解构增加 `quickTemplates`，transaction 的表格列表和 clear/bulkAdd 均增加对应操作：

```ts
const quickTemplates = data.quickTemplates ?? []

await db.transaction('rw', db.accounts, db.categories, db.transactions, db.recurringRules, db.quickTemplates, async () => {
  await Promise.all([
    db.accounts.clear(),
    db.categories.clear(),
    db.transactions.clear(),
    db.recurringRules.clear(),
    db.quickTemplates.clear(),
  ])

  await Promise.all([
    db.accounts.bulkAdd(accounts),
    db.categories.bulkAdd(categories),
    db.transactions.bulkAdd(transactions),
    db.recurringRules.bulkAdd(recurringRules),
    db.quickTemplates.bulkAdd(quickTemplates),
  ])
})
```

在 `destroyAllData()` 中，`db.transaction` 的表格列表增加 `db.quickTemplates`，`Promise.all` 的 clear 数组增加 `db.quickTemplates.clear()`：

```ts
await db.transaction('rw', db.accounts, db.categories, db.transactions, db.recurringRules, db.quickTemplates, async () => {
  await Promise.all([
    db.accounts.clear(),
    db.categories.clear(),
    db.transactions.clear(),
    db.recurringRules.clear(),
    db.quickTemplates.clear(),
  ])
})
```

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/db/index.ts src/utils/export.ts
git commit -m "feat: add QuickTemplate type, Dexie v5 migration, export compat"
```

---

### Task 2: QuickTemplate Store

**Files:**
- Create: `src/stores/quickTemplateStore.ts`

**Interfaces:**
- Consumes: `QuickTemplate` (from Task 1), `db.quickTemplates` (from Task 1), `useLiveQuery` composable
- Produces: `useQuickTemplateStore()` with `{ templates, add, update, remove, reorder }`

- [ ] **Step 1: 创建 Store**

`src/stores/quickTemplateStore.ts`：

```ts
import { defineStore } from 'pinia'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import type { QuickTemplate } from '@/types'

export const useQuickTemplateStore = defineStore('quickTemplates', () => {
  const templates = useLiveQuery(
    () => db.quickTemplates.orderBy('sort').toArray(),
    [] as QuickTemplate[],
  )

  /**
   * 添加模板。先检查 type + amount + categoryId 是否已存在，
   * 若存在则返回 false 并设置 duplicateMsg，否则添加并返回 true。
   */
  async function add(tpl: Omit<QuickTemplate, 'id'>): Promise<{ success: boolean; duplicateMsg?: string }> {
    // 检查 type + amount + categoryId 是否已存在
    const all = await db.quickTemplates.toArray()
    const dup = all.find(t => t.type === tpl.type && t.amount === tpl.amount && t.categoryId === tpl.categoryId)
    if (dup) {
      return { success: false, duplicateMsg: '该模板已存在' }
    }

    // 分配 sort = maxSort + 1
    const maxSort = all.reduce((max, t) => Math.max(max, t.sort), 0)
    tpl.sort = maxSort + 1

    await db.quickTemplates.add(tpl as QuickTemplate)
    return { success: true }
  }

  async function update(id: number, changes: Partial<QuickTemplate>): Promise<void> {
    await db.quickTemplates.update(id, changes)
  }

  async function remove(id: number): Promise<void> {
    await db.quickTemplates.delete(id)
  }

  /**
   * 批量更新排序：接收排序后的 ID 数组，按数组顺序分配 sort 1..N
   */
  async function reorder(ids: number[]): Promise<void> {
    await db.transaction('rw', db.quickTemplates, async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.quickTemplates.update(ids[i], { sort: i + 1 })
      }
    })
  }

  /**
   * 检查 type + amount + categoryId 是否已存在
   */
  async function isDuplicate(tpl: { type: string; amount: number; categoryId: number }): Promise<boolean> {
    const all = await db.quickTemplates.toArray()
    return all.some(t => t.type === tpl.type && t.amount === tpl.amount && t.categoryId === tpl.categoryId)
  }

  return { templates, add, update, remove, reorder, isDuplicate }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/quickTemplateStore.ts
git commit -m "feat: add quickTemplateStore with CRUD + dedup"
```

---

### Task 3: PromptDialog 命名弹窗

**Files:**
- Create: `src/components/common/PromptDialog.vue`

**Interfaces:**
- Consumes: `visible: boolean`, `title: string`, `initialValue: string`, `placeholder: string`, `confirmText: string`
- Produces: `@confirm(value: string)`, `@cancel()`, `@update:visible`

- [ ] **Step 1: 创建 PromptDialog 组件**

`src/components/common/PromptDialog.vue`：

```vue
<template>
  <Teleport to="body">
    <div v-if="visible" class="prompt-overlay" @click.self="onCancel">
      <div class="prompt-dialog">
        <h3 class="prompt-title">{{ title }}</h3>
        <input
          ref="inputRef"
          v-model="inputValue"
          class="prompt-input"
          :placeholder="placeholder"
          maxlength="50"
          @keydown.enter.prevent="onConfirm"
        />
        <div class="prompt-actions">
          <button class="prompt-btn prompt-btn--cancel" @click="onCancel">取消</button>
          <button class="prompt-btn prompt-btn--confirm" @click="onConfirm">{{ confirmText || '确认' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title: string
  initialValue?: string
  placeholder?: string
  confirmText?: string
}>(), {
  initialValue: '',
  placeholder: '请输入名称',
  confirmText: '确认',
})

const emit = defineEmits<{
  (e: 'confirm', value: string): void
  (e: 'cancel'): void
  (e: 'update:visible', v: boolean): void
}>()

const inputRef = ref<HTMLInputElement>()
const inputValue = ref(props.initialValue)

watch(() => props.visible, (v) => {
  if (v) {
    inputValue.value = props.initialValue
    nextTick(() => inputRef.value?.focus())
  }
})

function onConfirm() {
  const val = inputValue.value.trim()
  if (!val) return
  emit('confirm', val)
  emit('update:visible', false)
}

function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.prompt-dialog {
  width: 280px;
  background: var(--color-card, rgba(255,255,255,0.95));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-lg, 14px);
  padding: 24px;
  animation: fadeIn 0.2s ease;
}

.prompt-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text, #1c1c1e);
  text-align: center;
  margin-bottom: 16px;
}

.prompt-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-separator, rgba(60,60,67,0.08));
  border-radius: var(--radius-sm, 8px);
  background: #f2f2f6;
  font-size: 15px;
  color: var(--color-text, #1c1c1e);
  outline: none;
  font-family: inherit;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.prompt-input:focus {
  border-color: var(--color-primary, #007aff);
  background: #fff;
}

.prompt-actions {
  display: flex;
  gap: 12px;
}

.prompt-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: var(--radius-sm, 8px);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}

.prompt-btn:active {
  opacity: 0.7;
}

.prompt-btn--cancel {
  background: #f2f2f6;
  color: var(--color-text, #1c1c1e);
}

.prompt-btn--confirm {
  background: var(--color-primary, #007aff);
  color: #fff;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/PromptDialog.vue
git commit -m "feat: add PromptDialog naming component"
```

---

### Task 4: 记账页气泡展示

**Files:**
- Modify: `src/pages/booking/BookingPage.vue`

**Interfaces:**
- Consumes: `useQuickTemplateStore` (Task 2), `useCategoryStore` (existing), `PromptDialog` (Task 3)

- [ ] **Step 1: 修改 BookingPage — 引入 Store 和 computed**

在 `<script setup lang="ts">` 中已有 import 区块追加：

```ts
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import PromptDialog from '@/components/common/PromptDialog.vue'
```

在 `const categoryStore = useCategoryStore()` 之后追加：

```ts
const quickTemplateStore = useQuickTemplateStore()
```

追加 computed：

```ts
const displayBubbles = computed(() => {
  return quickTemplateStore.templates
    .filter(t => t.type === bookingMode.value)
    .map(t => {
      const cat = categoryStore.categories.find(c => c.id === t.categoryId)
      return { ...t, categoryIcon: cat?.icon || '📋' }
    })
    .slice(0, 6) // 最多 6 个
})

const bubbleExpanded = ref(false)
const showBubbleLimit = computed(() => bubbleExpanded.value ? displayBubbles.value.length : 4)
const visibleBubbles = computed(() => displayBubbles.value.slice(0, showBubbleLimit.value))
const hasMoreBubbles = computed(() => displayBubbles.value.length > 4)
```

- [ ] **Step 2: 追加 applyTemplate 函数和 "+" 新建逻辑**

在 `resetState()` 函数前追加：

```ts
function applyTemplate(tpl: QuickTemplate) {
  // 校验分类是否存在
  const cat = categoryStore.categories.find(c => c.id === tpl.categoryId)
  if (!cat) {
    showToast('该分类已不存在')
    return
  }

  bookingMode.value = tpl.type
  uiStore.setMode(tpl.type)

  // 金额：从分反算回元显示
  const yuan = tpl.amount / 100
  inputValue.value = yuan.toFixed(2).replace(/\.?0+$/, '') || '0'

  selectedCategoryId.value = tpl.categoryId
  title.value = tpl.title
  tags.value = [...tpl.tags]
  note.value = tpl.note
  keyboardVisible.value = false
}
```

在 applyTemplate 之后追加：

```ts
const promptVisible = ref(false)
const promptTitle = ref('')
const promptInitialValue = ref('')

async function saveAsTemplate() {
  const amount = Math.round(parseFloat(inputValue.value) * 100)
  if (isNaN(amount) || amount <= 0 || !selectedCategoryId.value) {
    showToast('请先输入有效金额并选择分类')
    return
  }

  // 检查内容重复
  const dup = await quickTemplateStore.isDuplicate({
    type: bookingMode.value,
    amount,
    categoryId: selectedCategoryId.value,
  })
  if (dup) {
    showToast('该模板已存在')
    return
  }

  promptTitle.value = '命名快记模板'
  promptInitialValue.value = title.value || ''
  promptVisible.value = true
}

async function onPromptConfirm(name: string) {
  const amount = Math.round(parseFloat(inputValue.value) * 100)
  const result = await quickTemplateStore.add({
    name: name,
    type: bookingMode.value,
    amount,
    categoryId: selectedCategoryId.value!,
    title: title.value,
    tags: [...tags.value],
    note: note.value,
    sort: 0, // add() 会自动分配
  })
  if (result.success) {
    showToast('已添加快记模板')
  } else if (result.duplicateMsg) {
    showToast(result.duplicateMsg)
  }
}

function onBubbleExpandToggle() {
  bubbleExpanded.value = !bubbleExpanded.value
}
```

- [ ] **Step 3: 追加气泡 template 区域**

在 `<template>` 中的 `</Transition>` 之后、`</div>` (booking-content) 之前插入：

```html
<!-- Quick Template Bubbles -->
<div v-if="displayBubbles.length > 0" class="quick-tpl-section">
  <div class="quick-tpl-label">快记</div>
  <div class="quick-tpl-bubbles">
    <button
      v-for="tpl in visibleBubbles"
      :key="tpl.id"
      class="quick-tpl-bubble"
      @click="applyTemplate(tpl)"
    >
      <span class="tpl-icon">{{ tpl.categoryIcon }}</span>
      <span class="tpl-name">{{ tpl.name }}</span>
      <span class="tpl-amount">{{ formatShortCurrency(tpl.amount) }}</span>
    </button>
    <button
      v-if="hasMoreBubbles"
      class="quick-tpl-bubble quick-tpl-more"
      @click="onBubbleExpandToggle"
    >
      <span class="tpl-more-text">{{ bubbleExpanded ? '收起' : `+${displayBubbles.length - 4}` }}</span>
    </button>
    <button class="quick-tpl-bubble quick-tpl-add" @click="saveAsTemplate" title="保存当前为模板">
      <span class="tpl-add-icon">+</span>
    </button>
  </div>
</div>
<div v-else class="quick-tpl-section quick-tpl-empty">
  <button class="quick-tpl-bubble quick-tpl-add" @click="saveAsTemplate" title="保存当前为模板">
    <span class="tpl-add-icon">+</span>
  </button>
</div>
```

在 `</Transition>` 注释替代之后/之前，需要仔细定位。应该在 `<Transition name="mode-fade" mode="out-in">...` 块之后、`<!-- Number Keyboard -->` 注释之前。

找到 `</Transition>` 结束标签，在其后插入气泡模板代码，但要注意需在 `</div>` (booking-content 结束) 之前。

观察原始模板结构：
```html
<div class="booking-content" @touchstart ... @touchend ...>
  ...
  <Transition name="mode-fade" mode="out-in">
    ...
  </Transition>
  <!-- 气泡区域插入 HERE -->

</div>  <!-- booking-content end -->

<!-- Number Keyboard -->
...
```

所以在 `</Transition>` 之后、`</div>` 之前插入气泡代码。

还需要在 `<script>` 顶部加上 `formatShortCurrency` 的导入，但 `formatCurrency` 已经在导入... 实际上需要先确认 format.ts 是否有 `formatShortCurrency` 导出 — 从之前的文件阅读已知，`format.ts` 导出了 `formatShortCurrency`。但 BookingPage.vue 目前没有 import format。

需要追加 import：
```ts
import { formatShortCurrency } from '@/utils/format'
```

同时 QuickTemplate 类型的 import：
```ts
import type { QuickTemplate } from '@/types'
```

- [ ] **Step 4: 追加气泡样式**

在 `<style scoped>` 末尾追加：

```css
/* ── Quick Template Bubbles ── */
.quick-tpl-section {
  padding: 12px 0 4px;
}

.quick-tpl-label {
  font-size: 12px;
  color: var(--color-secondary-text, #8e8e93);
  margin-bottom: 8px;
}

.quick-tpl-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.quick-tpl-bubble {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 13px;
  color: var(--color-text, #1c1c1e);
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  white-space: nowrap;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
}

.quick-tpl-bubble:active {
  background: #e5e5ea;
}

.tpl-icon {
  font-size: 14px;
  line-height: 1;
}

.tpl-name {
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-amount {
  font-weight: 600;
  color: var(--color-primary, #007aff);
  font-variant-numeric: tabular-nums;
}

.quick-tpl-more {
  background: transparent;
  box-shadow: none;
  font-weight: 500;
  color: var(--color-secondary-text, #8e8e93);
}

.quick-tpl-add {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
}

.tpl-add-icon {
  font-size: 18px;
  font-weight: 300;
  color: var(--color-secondary-text, #8e8e93);
  line-height: 1;
}

.quick-tpl-empty {
  padding: 8px 0;
  display: flex;
  justify-content: flex-end;
}
```

- [ ] **Step 5: 确认 import 完整**

BookingPage.vue 脚本区的 import 应追加以下内容（最终确认）：

```ts
import { formatShortCurrency } from '@/utils/format'
import type { QuickTemplate } from '@/types'
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import PromptDialog from '@/components/common/PromptDialog.vue'
```

同时在 `<template>` 底部追加 PromptDialog 标签（在 booking-page 结束前）：

```html
<!-- Quick Template Prompt -->
<PromptDialog
  :visible="promptVisible"
  :title="promptTitle"
  :initial-value="promptInitialValue"
  placeholder="请输入模板名称"
  confirm-text="保存"
  @confirm="onPromptConfirm"
  @cancel="promptVisible = false"
  @update:visible="promptVisible = $event"
/>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/booking/BookingPage.vue
git commit -m "feat: add quick template bubbles to booking page"
```

---

### Task 5: 交易详情提取

**Files:**
- Modify: `src/components/transactions/TransactionDetail.vue`

**Interfaces:**
- Consumes: `useQuickTemplateStore` (Task 2), `PromptDialog` (Task 3)

- [ ] **Step 1: 追加提取按钮和逻辑**

在 `<script setup lang="ts">` 中追加 import：

```ts
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import { ref } from 'vue'

const quickTemplateStore = useQuickTemplateStore()

// ── Extract to template ──
const extractDialogVisible = ref(false)

async function onExtract() {
  // 检查内容重复
  const dup = await quickTemplateStore.isDuplicate({
    type: props.transaction.type,
    amount: props.transaction.amount,
    categoryId: props.transaction.categoryId ?? 0,
  })
  if (dup) {
    // toast? need a toast mechanism
    return
  }
  extractDialogVisible.value = true
}

async function onExtractConfirm(name: string) {
  const result = await quickTemplateStore.add({
    name,
    type: props.transaction.type,
    amount: props.transaction.amount,
    categoryId: props.transaction.categoryId ?? 0,
    title: props.transaction.title || '',
    tags: [...(props.transaction.tags || [])],
    note: props.transaction.note || '',
    sort: 0,
  })
  if (result.success) {
    // Show toast — but TransactionDetail doesn't have toast.
    // We'll notify via console and emit a custom event
  }
}
```

不过 `TransactionDetail.vue` 目前没有 Toast 机制。需要追加一个简单的 Toast + 现有 emit 方式。

实际上，用 `ref` 来显示一个 inline toast 最简单：

追加 ref：
```ts
const extractMsg = ref('')
```

追加方法：
```ts
async function onExtractClick() {
  const dup = await quickTemplateStore.isDuplicate({
    type: props.transaction.type,
    amount: props.transaction.amount,
    categoryId: props.transaction.categoryId ?? 0,
  })
  if (dup) {
    extractMsg.value = '该模板已存在'
    setTimeout(() => { extractMsg.value = '' }, 2000)
    return
  }
  // 自动生成推荐名称
  const suggested = props.transaction.title || ''
  extractValue.value = suggested
  extractDialogVisible.value = true
}

const extractValue = ref('')

async function onExtractConfirm(name: string) {
  const result = await quickTemplateStore.add({
    name,
    type: props.transaction.type,
    amount: props.transaction.amount,
    categoryId: props.transaction.categoryId ?? 0,
    title: props.transaction.title || '',
    tags: [...(props.transaction.tags || [])],
    note: props.transaction.note || '',
    sort: 0,
  })
  if (result.success) {
    extractMsg.value = '已添加快记模板'
    setTimeout(() => { extractMsg.value = '' }, 2000)
  }
}
```

- [ ] **Step 2: 修改 template — 追加星标按钮**

在 sheet-header 区域，sheet-title 旁边追加星标按钮：

找到 `sheet-header` 区域：
```html
<div class="sheet-header">
  <div class="sheet-icon-wrap">
    <span class="sheet-icon">{{ displayIcon }}</span>
  </div>
  <div class="sheet-title">{{ transaction.title || categoryName }}</div>
  ...
</div>
```

在 `sheet-title` 所在 div 旁边或同一行追加星标按钮：

```html
<div class="sheet-header">
  <div class="sheet-icon-wrap">
    <span class="sheet-icon">{{ displayIcon }}</span>
  </div>
  <div class="sheet-title-row">
    <div class="sheet-title">{{ transaction.title || categoryName }}</div>
    <button class="sheet-extract-btn" @click="onExtractClick" title="保存为快记模板">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  </div>
  ...
</div>
```

同时在 sheet 底部追加 PromptDialog 和 Toast（在 `sheet-actions` 下面）：

```html
<!-- Toast message -->
<div v-if="extractMsg" class="sheet-toast">{{ extractMsg }}</div>

<PromptDialog
  :visible="extractDialogVisible"
  title="命名快记模板"
  :initial-value="extractValue"
  placeholder="输入模板名称"
  confirm-text="保存"
  @confirm="onExtractConfirm"
  @cancel="extractDialogVisible = false"
  @update:visible="extractDialogVisible = $event"
/>
```

- [ ] **Step 3: 修正样式**

为 `sheet-title-row` 和星标按钮追加样式：

```css
.sheet-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sheet-extract-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f2f2f6;
  color: #ff9500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.sheet-extract-btn:active {
  background: #e5e5ea;
}

.sheet-toast {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 24px;
  border-radius: 20px;
  white-space: nowrap;
  z-index: 2000;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
```

注意：`<style scoped>` 中 `.sheet-toast` 因为用了 `position: fixed` 和 `z-index`，需要在 scoped 范围内确保正确工作。对于 `PromptDialog` 的 `Teleport to="body"`，它会渲染到 body 下，因此 scoped styles 中的 `PromptDialog` 样式可能会丢失。但 PromptDialog 自带 scoped 样式，所以 OK。

- [ ] **Step 4: 处理现有 template 的修改—修改 sheet-header**

原始 `sheet-header` 代码需要调整 title-row。查看完整的 TransactionDetail.vue template，需要找到并替换 header 部分。

当前的 sheet-header 结构：
```html
<div class="sheet-header">
  <div class="sheet-icon-wrap">
    <span class="sheet-icon">{{ displayIcon }}</span>
  </div>
  <div class="sheet-title">{{ transaction.title || categoryName }}</div>
  <div class="sheet-type-badge" :class="`badge-${transaction.type}`">
    {{ typeLabel }}
  </div>
</div>
```

需要改为：
```html
<div class="sheet-header">
  <div class="sheet-icon-wrap">
    <span class="sheet-icon">{{ displayIcon }}</span>
  </div>
  <div class="sheet-title-row">
    <div class="sheet-title">{{ transaction.title || categoryName }}</div>
    <button class="sheet-extract-btn" @click="onExtractClick" title="保存为快记模板">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  </div>
  <div class="sheet-type-badge" :class="`badge-${transaction.type}`">
    {{ typeLabel }}
  </div>
</div>
```

- [ ] **Step 5: 追加 import**

在 script 最顶部追加：

```ts
import { ref } from 'vue'
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import PromptDialog from '@/components/common/PromptDialog.vue'
```

注意：TransactionDetail.vue 目前 script 的 `import { computed } from 'vue'` 需要改为 `import { computed, ref } from 'vue'`。

- [ ] **Step 6: Commit**

```bash
git add src/components/transactions/TransactionDetail.vue
git commit -m "feat: add extract quick template from transaction detail"
```

---

### Task 6: 设置页管理

**Files:**
- Create: `src/pages/settings/QuickTemplateManager.vue`
- Modify: `src/pages/settings/SettingsPage.vue`

**Interfaces:**
- Consumes: `useQuickTemplateStore` (Task 2), `useCategoryStore` (existing), `CommonBottomSheet`, `ConfirmDialog`, `PromptDialog`

- [ ] **Step 1: 创建 QuickTemplateManager 子组件**

`src/pages/settings/QuickTemplateManager.vue`：

> 注意：这是一个复杂的组件。它包含：模板列表展示、编辑/新建弹窗、删除、移动排序按钮（上/下）。

```vue
<template>
  <div class="qt-manager">
    <template v-if="store.templates.length === 0">
      <div class="qt-empty">
        <p class="qt-empty-text">暂无快记模板</p>
        <p class="qt-empty-hint">在交易详情中提取或在此添加</p>
      </div>
    </template>

    <div v-else class="qt-list">
      <div
        v-for="tpl in store.templates"
        :key="tpl.id"
        class="qt-row"
      >
        <button class="qt-move-btn" @click="moveUp(tpl)" :disabled="isFirst(tpl)">
          <span class="qt-move-arrow">↑</span>
        </button>
        <button class="qt-move-btn" @click="moveDown(tpl)" :disabled="isLast(tpl)">
          <span class="qt-move-arrow">↓</span>
        </button>
        <div class="qt-row-content" @click="startEdit(tpl)">
          <span class="qt-row-icon">{{ getCategoryIcon(tpl) }}</span>
          <span class="qt-row-name">{{ tpl.name }}</span>
          <span class="qt-row-amount">{{ formatShortCurrency(tpl.amount) }}</span>
        </div>
        <button class="qt-edit-btn" @click="startEdit(tpl)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8e8e93" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </div>

    <button class="qt-add-btn" @click="startAdd">
      <span class="qt-add-icon">+</span>
      <span>添加新模板</span>
    </button>

    <!-- Edit / Add Dialog (CommonBottomSheet style) -->
    <Teleport to="body">
      <div v-if="dialogVisible" class="qt-dialog-overlay" @click.self="cancelDialog">
        <div class="qt-dialog">
          <h3 class="qt-dialog-title">{{ isEditing ? '编辑模板' : '新建模板' }}</h3>

          <label class="qt-field-label">名称</label>
          <input v-model="editForm.name" class="qt-input" placeholder="必填" maxlength="30" />

          <label class="qt-field-label">类型</label>
          <div class="qt-mode-group">
            <button v-for="opt in modeOptions" :key="opt.value"
              class="qt-mode-btn" :class="{ active: editForm.type === opt.value }"
              @click="editForm.type = opt.value"
            >{{ opt.label }}</button>
          </div>

          <label class="qt-field-label">金额（元）</label>
          <input v-model.number="editForm.amountYuan" type="number" min="0" step="0.01" class="qt-input" placeholder="0.00" />

          <label class="qt-field-label">分类</label>
          <select v-model="editForm.categoryId" class="qt-select">
            <option :value="0" disabled>请选择</option>
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>

          <label class="qt-field-label">标题（可选）</label>
          <input v-model="editForm.title" class="qt-input" placeholder="" maxlength="100" />

          <label class="qt-field-label">标签（逗号分隔，可选）</label>
          <input v-model="editForm.tagsText" class="qt-input" placeholder="如: 日常,消费" />

          <label class="qt-field-label">备注（可选）</label>
          <input v-model="editForm.note" class="qt-input" placeholder="" maxlength="200" />

          <div class="qt-dialog-actions">
            <button v-if="isEditing" class="qt-btn qt-btn--danger" @click="confirmDelete">删除</button>
            <button class="qt-btn qt-btn--cancel" @click="cancelDialog">取消</button>
            <button class="qt-btn qt-btn--confirm" :disabled="!dialogValid" @click="confirmDialog">保存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm -->
    <ConfirmDialog
      :visible="deleteConfirmVisible"
      title="确认删除"
      message="删除后无法恢复，确定继续？"
      confirm-text="删除"
      confirm-type="danger"
      @confirm="doDelete"
      @update:visible="deleteConfirmVisible = $event"
    />

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toastMsg" class="qt-toast">{{ toastMsg }}</div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useQuickTemplateStore } from '@/stores/quickTemplateStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { formatShortCurrency } from '@/utils/format'
import type { QuickTemplate } from '@/types'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const store = useQuickTemplateStore()
const categoryStore = useCategoryStore()

const modeOptions = [
  { label: '收入', value: 'income' as const },
  { label: '支出', value: 'expense' as const },
  { label: '转账', value: 'transfer' as const },
]

// ── Dialog state ──
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)

const dialogValid = computed(() => {
  return editForm.name.trim().length > 0
    && editForm.amountYuan > 0
    && editForm.categoryId > 0
})

const editForm = reactive({
  name: '',
  type: 'expense' as 'expense' | 'income' | 'transfer',
  amountYuan: 0,
  categoryId: 0,
  title: '',
  tagsText: '',
  note: '',
})

const availableCategories = computed(() => {
  return categoryStore.categories.filter(c => c.parentId !== null && c.type === editForm.type)
})

// ── Sort ──
function isFirst(tpl: QuickTemplate) {
  const list = store.templates
  return list.length > 0 && list[0].id === tpl.id
}

function isLast(tpl: QuickTemplate) {
  const list = store.templates
  return list.length > 0 && list[list.length - 1].id === tpl.id
}

async function moveUp(tpl: QuickTemplate) {
  const list = store.templates
  const idx = list.findIndex(t => t.id === tpl.id)
  if (idx <= 0) return
  // Swap sort values
  const prev = list[idx - 1]
  await store.update(tpl.id!, { sort: prev.sort })
  await store.update(prev.id!, { sort: tpl.sort })
}

async function moveDown(tpl: QuickTemplate) {
  const list = store.templates
  const idx = list.findIndex(t => t.id === tpl.id)
  if (idx < 0 || idx >= list.length - 1) return
  const next = list[idx + 1]
  await store.update(tpl.id!, { sort: next.sort })
  await store.update(next.id!, { sort: tpl.sort })
}

// ── Icon helper ──
function getCategoryIcon(tpl: QuickTemplate): string {
  const cat = categoryStore.categories.find(c => c.id === tpl.categoryId)
  return cat?.icon || '📋'
}

// ── Dialog ──
function startAdd() {
  isEditing.value = false
  editingId.value = null
  editForm.name = ''
  editForm.type = 'expense'
  editForm.amountYuan = 0
  editForm.categoryId = 0
  editForm.title = ''
  editForm.tagsText = ''
  editForm.note = ''
  dialogVisible.value = true
}

function startEdit(tpl: QuickTemplate) {
  isEditing.value = true
  editingId.value = tpl.id!
  editForm.name = tpl.name
  editForm.type = tpl.type
  editForm.amountYuan = tpl.amount / 100
  editForm.categoryId = tpl.categoryId
  editForm.title = tpl.title
  editForm.tagsText = tpl.tags.join(', ')
  editForm.note = tpl.note
  dialogVisible.value = true
}

function cancelDialog() {
  dialogVisible.value = false
}

async function confirmDialog() {
  if (!dialogValid.value) return

  const name = editForm.name.trim()
  const type = editForm.type
  const amount = Math.round(editForm.amountYuan * 100)
  const categoryId = editForm.categoryId
  const title = editForm.title
  const tags = editForm.tagsText.split(',').map(s => s.trim()).filter(Boolean)
  const note = editForm.note

  if (isEditing.value && editingId.value) {
    await store.update(editingId.value, { name, type, amount, categoryId, title, tags, note })
    showToast('已更新')
  } else {
    const result = await store.add({ name, type, amount, categoryId, title, tags, note, sort: 0 })
    if (result.success) {
      showToast('已添加')
    } else if (result.duplicateMsg) {
      showToast(result.duplicateMsg)
    }
  }
  dialogVisible.value = false
}

// ── Delete ──
const deleteConfirmVisible = ref(false)
const deleteTargetId = ref<number | null>(null)

function confirmDelete() {
  deleteTargetId.value = editingId.value
  deleteConfirmVisible.value = true
  dialogVisible.value = false
}

async function doDelete() {
  if (deleteTargetId.value) {
    await store.remove(deleteTargetId.value)
    showToast('已删除')
  }
  deleteConfirmVisible.value = false
  deleteTargetId.value = null
}

// ── Toast ──
const toastMsg = ref('')
let toastTimer = 0

function showToast(msg: string) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMsg.value = '' }, 2000)
}
</script>

<style scoped>
.qt-empty {
  padding: 12px 0;
  text-align: center;
}

.qt-empty-text {
  font-size: 14px;
  color: var(--color-text, #1c1c1e);
  margin-bottom: 4px;
}

.qt-empty-hint {
  font-size: 12px;
  color: var(--color-secondary-text, #8e8e93);
}

.qt-list {
  /* container */
}

.qt-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-separator, rgba(60,60,67,0.08));
}

.qt-row:last-child {
  border-bottom: none;
}

.qt-move-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c7c7cc;
  -webkit-tap-highlight-color: transparent;
  padding: 0;
}

.qt-move-btn:disabled {
  opacity: 0.3;
}

.qt-move-arrow {
  font-size: 14px;
  line-height: 1;
}

.qt-row-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  min-width: 0;
}

.qt-row-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.qt-row-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #1c1c1e);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qt-row-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-secondary-text, #8e8e93);
  margin-left: auto;
  margin-right: 4px;
  flex-shrink: 0;
}

.qt-edit-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}

.qt-edit-btn:active {
  background: #f2f2f6;
}

.qt-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px 0;
  border: 1px dashed var(--color-separator, rgba(60,60,67,0.16));
  border-radius: var(--radius-sm, 8px);
  background: transparent;
  font-size: 14px;
  color: var(--color-secondary-text, #8e8e93);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  margin-top: 8px;
}

.qt-add-btn:active {
  background: #f2f2f6;
}

.qt-add-icon {
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
}

/* ── Dialog ── */
.qt-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.qt-dialog {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-card, rgba(255,255,255,0.95));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
  padding: 24px 20px 32px;
}

.qt-dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text, #1c1c1e);
  text-align: center;
  margin-bottom: 20px;
}

.qt-field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-secondary-text, #8e8e93);
  margin-bottom: 6px;
  margin-top: 14px;
}

.qt-field-label:first-child {
  margin-top: 0;
}

.qt-input, .qt-select {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-sm, 8px);
  background: #f2f2f6;
  font-size: 15px;
  color: var(--color-text, #1c1c1e);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

.qt-input:focus, .qt-select:focus {
  background: #fff;
  box-shadow: 0 0 0 1px var(--color-primary, #007aff);
}

.qt-mode-group {
  display: flex;
  gap: 8px;
}

.qt-mode-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: var(--radius-sm, 8px);
  background: #f2f2f6;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-secondary-text, #8e8e93);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.qt-mode-btn.active {
  background: var(--color-primary, #007aff);
  color: #fff;
}

.qt-dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.qt-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: var(--radius-sm, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.qt-btn:active { opacity: 0.7; }
.qt-btn:disabled { opacity: 0.4; }

.qt-btn--cancel {
  background: #f2f2f6;
  color: var(--color-text, #1c1c1e);
  flex: 0.5;
}

.qt-btn--confirm {
  background: var(--color-primary, #007aff);
  color: #fff;
  flex: 0.5;
}

.qt-btn--danger {
  background: #ff3b30;
  color: #fff;
  flex: 0.5;
}

/* ── Toast ── */
.qt-toast {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 24px;
  border-radius: 20px;
  white-space: nowrap;
  z-index: 2000;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
```

> **注意**：`qt-dialog` 中使用 CommonBottomSheet 风格的底部弹出设计。对于分类选择，只显示子分类（叶子分类），与记账页的 CategoryPicker 一致。

- [ ] **Step 2: 修改 SettingsPage — 引入 QuickTemplateManager**

编辑 `src/pages/settings/SettingsPage.vue`：

在 `<script setup lang="ts">` 的 import 区块追加：

```ts
import QuickTemplateManager from './QuickTemplateManager.vue'
```

在 `<template>` 中找到 "周期记账" section 之后的 "关于" section 之前，插入：

```html
<!-- ── 6. Quick Templates ── -->
<div class="section">
  <div class="section-header">快捷记账</div>
  <div class="section-card">
    <div class="section-card-body">
      <QuickTemplateManager />
    </div>
  </div>
</div>
```

关于部分原来的 header 是 `<!-- ── 6. About ── -->`，需要改为 `<!-- ── 7. About ── -->` 以保持编号连续（纯注释，不改也没关系）。

同时需要在 section-card 中为 `section-card-body` 增加样式（确保 QuickTemplateManager 有适当的内边距）。检查 SettingsPage.vue 中其他内联子组件（如 AccountManager / CategoryManager / TagManager / RuleManager）是否直接放在 section-card 内而没有 section-card-body 包裹。

看一下现有模式——`AccountManager` 的直接是 `<div class="section-card"><AccountManager /></div>`，`CategoryManager` 和 `TagManager` 也是类似。所以直接用 `<QuickTemplateManager />` 替换 section-card 内容即可。

- [ ] **Step 3: 更新 SettingsPage 的关于 section 编号**

确认 SettingsPage 中关于部分的注释是 `<!-- ── 6. About ── -->`。将其改为 `<!-- ── 7. About ── -->`（纯注释一致性）。

- [ ] **Step 4: Commit**

```bash
git add src/pages/settings/QuickTemplateManager.vue src/pages/settings/SettingsPage.vue
git commit -m "feat: add quick template management in settings page"
```

---

## 构建验证

全部任务完成执行后：

- [ ] **运行 `npm run build` 确认无类型错误**
- [ ] **确认无运行时 errors 可以正常交互**