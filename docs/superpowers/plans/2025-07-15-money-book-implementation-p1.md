# 《钱书》V1.0 实施计划 · Part 1（Task 1-4）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建完整的本地优先 PWA 个人记账应用，包含极速记账、账户中心、统计分析、设置管理四大模块。

**架构:** Vue 3 + Vite + Vant 4 前端，Dexie.js 操作 IndexedDB 作为唯一数据源，Pinia 做内存态缓存，ECharts 做图表，vite-plugin-pwa 实现 PWA 能力。

**Tech Stack:** Vue 3 (Composition API + TypeScript), Vite, Vant 4, Dexie.js, Pinia, Vue Router 4, ECharts, vite-plugin-pwa, @vueuse/core

## 全局约束

- 所有金额以 `number` 类型存储（单位：元），不引入 Decimal 库
- 流水金额必须 > 0（正数），负号由 `type` 字段决定方向
- 分类表 `isLatteFactor` 默认值见 PRD 4.2 表
- 账户表 `balance`：负债类型（debt）余额为负数存储
- 时间字段统一使用 `YYYY-MM-DD` 格式字符串
- 文件名使用 PascalCase 命名组件，camelCase 命名 composables/utils
- TypeScript 严格模式 (`strict: true`)

---

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`

**Interfaces:**
- Consumes: 无
- Produces: 可运行的项目骨架，`npm run dev` 能启动空白页面

- [ ] **Step 1: 初始化 package.json**

```json
{
  "name": "money-book-pwa",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.5.0",
    "pinia": "^2.3.0",
    "vant": "^4.9.0",
    "@vant/use": "^1.6.0",
    "dexie": "^4.0.0",
    "echarts": "^5.6.0",
    "vue-echarts": "^7.0.0",
    "@vueuse/core": "^11.0.0",
    "vite-plugin-pwa": "^0.21.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "typescript": "^5.7.0",
    "vue-tsc": "^2.2.0",
    "vite": "^6.0.0",
    "unplugin-auto-import": "^0.19.0",
    "unplugin-vue-components": "^0.28.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '钱书',
        short_name: '钱书',
        description: '防微杜渐的财务逻辑、真实全览的资产负债',
        theme_color: '#1989fa',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}']
      }
    }),
    AutoImport({
      resolvers: [VantResolver()]
    }),
    Components({
      resolvers: [VantResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="description" content="钱书 - 极简个人记账" />
    <meta name="theme-color" content="#1989fa" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/logo-192.png" />
    <title>钱书</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 src/main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'vant/lib/index.css'
import './db'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(() => {
    console.log('Persistent storage granted')
  })
}
```

- [ ] **Step 7: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 8: 创建 .gitignore**

```
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 9: 安装依赖并验证**

Run: `npm install`
Expected: 所有依赖安装成功，无错误

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "chore: scaffold project with Vue 3 + Vite + Vant 4 + Dexie"
```

---

### Task 2: 数据库层 + 类型定义 + 预设数据

**Files:**
- Create: `src/types/index.ts`
- Create: `src/db/index.ts`
- Create: `src/db/seed.ts`

**Interfaces:**
- Consumes: Task 1 的项目骨架
- Produces: `db` 实例（可导入使用），`seedData` 函数，`Account`/`Category`/`Transaction` 类型

- [ ] **Step 1: 创建 src/types/index.ts**

```typescript
// ========== 账户 ==========
export type AccountType = 'liquid' | 'restricted' | 'claim' | 'debt'
export type AccountGroupName = '流动性资产' | '限制性资产' | '债权' | '负债'

export interface Account {
  id?: number
  groupId: number
  groupName: AccountGroupName
  name: string
  type: AccountType
  icon: string
  balance: number
  isCommon: boolean
  sort: number
}

// ========== 分类 ==========
export type CategoryType = 'expense' | 'income'

export interface Category {
  id?: number
  type: CategoryType
  parentId: number | null
  name: string
  icon: string
  attribute?: string
  isLatteFactor: boolean
  isHidden: boolean
  sort: number
}

// ========== 流水 ==========
export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Transaction {
  id?: number
  type: TransactionType
  amount: number
  fromAccountId: number | null
  toAccountId: number | null
  categoryId: number | null
  tags: string[]
  note: string
  date: string
  createdAt: string
}
```

- [ ] **Step 2: 创建 src/db/index.ts**

```typescript
import Dexie, { type Table } from 'dexie'
import type { Account, Category, Transaction } from '@/types'

export class MoneyBookDB extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>

  constructor() {
    super('MoneyBookDB')
    this.version(1).stores({
      accounts: '++id, groupId, name, type, balance, isCommon, sort',
      categories: '++id, type, parentId, name, isLatteFactor, isHidden, sort',
      transactions: '++id, type, amount, fromAccountId, toAccountId, categoryId, date, createdAt',
    })
  }
}

export const db = new MoneyBookDB()
```

- [ ] **Step 3: 创建 src/db/seed.ts — 预设账户**

```typescript
import { db } from './index'
import type { Account, Category } from '@/types'

const presetAccounts: Account[] = [
  { groupId: 0, groupName: '流动性资产', name: '微信零钱', type: 'liquid', icon: '💬', balance: 0, isCommon: false, sort: 0 },
  { groupId: 0, groupName: '流动性资产', name: '支付宝余额', type: 'liquid', icon: '🔵', balance: 0, isCommon: false, sort: 1 },
  { groupId: 0, groupName: '流动性资产', name: '银行卡账户', type: 'liquid', icon: '💳', balance: 0, isCommon: false, sort: 2 },
  { groupId: 0, groupName: '流动性资产', name: '支付宝小荷包', type: 'liquid', icon: '🐷', balance: 0, isCommon: true, sort: 3 },
  { groupId: 1, groupName: '限制性资产', name: '公积金账户', type: 'restricted', icon: '🏛️', balance: 0, isCommon: false, sort: 0 },
  { groupId: 1, groupName: '限制性资产', name: '投资理财账户', type: 'restricted', icon: '📈', balance: 0, isCommon: false, sort: 1 },
  { groupId: 2, groupName: '债权', name: '借出款项', type: 'claim', icon: '🤝', balance: 0, isCommon: false, sort: 0 },
  { groupId: 3, groupName: '负债', name: '信用卡', type: 'debt', icon: '💳', balance: 0, isCommon: false, sort: 0 },
  { groupId: 3, groupName: '负债', name: '借入款项', type: 'debt', icon: '📋', balance: 0, isCommon: false, sort: 1 },
  { groupId: 3, groupName: '负债', name: '房贷本金', type: 'debt', icon: '🏠', balance: 0, isCommon: false, sort: 2 },
]
```

- [ ] **Step 4: 创建 src/db/seed.ts — 预设分类 + seed 函数**

```typescript
const presetCategories: Category[] = [
  // ===== 支出分类 =====
  { type: 'expense', parentId: null, name: '🏠 居住', icon: 'home', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 1, name: '房租房贷', icon: 'home', attribute: '固定', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 1, name: '生活缴费', icon: 'light', attribute: '波动', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 1, name: '家居家装', icon: 'furniture', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: null, name: '🍽️ 餐饮', icon: 'food', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 5, name: '餐饮美食', icon: 'food', attribute: '必需', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 5, name: '生鲜食材', icon: 'vegetables', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 5, name: '休闲食品', icon: 'snacks', attribute: '社交', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: null, name: '🚗 交通', icon: 'transport', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 9, name: '公共交通', icon: 'bus', attribute: '必需', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 9, name: '汽车消费', icon: 'car', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 9, name: '停车通行', icon: 'parking', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 9, name: '汽车加油', icon: 'gas', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 9, name: '汽车充电', icon: 'charge', isLatteFactor: false, isHidden: false, sort: 4 },
  { type: 'expense', parentId: null, name: '🛍️ 购物', icon: 'shopping', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 15, name: '日用百货', icon: 'daily', attribute: '必需', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 15, name: '服饰装扮', icon: 'clothes', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 15, name: '美妆护理', icon: 'beauty', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 15, name: '数码家电', icon: 'digital', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: null, name: '🎭 休闲', icon: 'leisure', isLatteFactor: false, isHidden: false, sort: 4 },
  { type: 'expense', parentId: 20, name: '虚拟消费', icon: 'game', attribute: '弹性', isLatteFactor: true, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 20, name: '文娱休闲', icon: 'movie', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 20, name: '兴趣潮玩', icon: 'toy', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 20, name: '运动健身', icon: 'sport', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 20, name: '旅游出行', icon: 'travel', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 4 },
  { type: 'expense', parentId: null, name: '👨‍👩‍👧 家庭', icon: 'family', isLatteFactor: false, isHidden: false, sort: 5 },
  { type: 'expense', parentId: 26, name: '文化教育', icon: 'education', attribute: '义务', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 26, name: '医疗保健', icon: 'medical', attribute: '固定', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 26, name: '宠物消费', icon: 'pet', attribute: '固定', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: null, name: '🤝 人情', icon: 'gift', isLatteFactor: false, isHidden: false, sort: 6 },
  { type: 'expense', parentId: 30, name: '红包转账', icon: 'redpacket', attribute: '突发', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 30, name: '节日礼物', icon: 'gift', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: null, name: '🧮 特别分类', icon: 'special', isLatteFactor: false, isHidden: false, sort: 7 },
  { type: 'expense', parentId: 33, name: '订婚', icon: 'ring', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 33, name: '婚礼', icon: 'wedding', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 33, name: '购车', icon: 'car', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 33, name: '购房', icon: 'house', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 33, name: '其它', icon: 'other', attribute: '兜底', isLatteFactor: false, isHidden: false, sort: 4 },
  // ===== 收入分类 =====
  { type: 'income', parentId: null, name: '💼 主动收入', icon: 'work', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 39, name: '税后薪酬', icon: 'salary', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 39, name: '绩效奖金', icon: 'bonus', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'income', parentId: 39, name: '兼职外包', icon: 'freelance', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'income', parentId: 39, name: '公积金入账', icon: 'fund', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'income', parentId: null, name: '💰 被动收入', icon: 'passive', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'income', parentId: 44, name: '利息分红', icon: 'interest', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 44, name: '资本利得', icon: 'profit', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'income', parentId: null, name: '🎁 其它收入', icon: 'other', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'income', parentId: 47, name: '转卖返现', icon: 'cashback', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 47, name: '红包转账', icon: 'redpacket', isLatteFactor: false, isHidden: false, sort: 1 },
]

export async function seedDatabase() {
  const accountCount = await db.accounts.count()
  const categoryCount = await db.categories.count()
  if (accountCount > 0 || categoryCount > 0) return

  await db.transaction('rw', db.accounts, db.categories, async () => {
    await db.accounts.bulkAdd(presetAccounts)
    await db.categories.bulkAdd(presetCategories)
  })
}
```

- [ ] **Step 5: 修改 src/main.ts 调用 seed**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { seedDatabase } from './db/seed'
import 'vant/lib/index.css'
import './db'

seedDatabase()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(() => {
    console.log('Persistent storage granted')
  })
}
```

- [ ] **Step 6: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: add database schema, type definitions and seed data"
```

---

### Task 3: 核心 Composables

**Files:**
- Create: `src/composables/useAccounts.ts`
- Create: `src/composables/useCategories.ts`
- Create: `src/composables/useTransactions.ts`

**Interfaces:**
- Consumes: Task 2 的 `db` 实例和类型
- Produces: `useAccounts()`, `useCategories()`, `useTransactions()` 组合式函数

- [ ] **Step 1: 创建 src/composables/useAccounts.ts**

```typescript
import { liveQuery } from 'dexie'
import { useObservable } from '@vueuse/core'
import { db } from '@/db'
import type { Account } from '@/types'

export function useAccounts() {
  const accounts = useObservable(
    liveQuery(() => db.accounts.orderBy('sort').toArray())
  )

  async function addAccount(account: Omit<Account, 'id'>) {
    return db.accounts.add(account as Account)
  }

  async function updateBalance(id: number, newBalance: number) {
    return db.accounts.update(id, { balance: newBalance })
  }

  async function deleteAccount(id: number) {
    return db.accounts.delete(id)
  }

  return {
    accounts: accounts as unknown as import('vue').Ref<Account[]>,
    addAccount,
    updateBalance,
    deleteAccount,
  }
}
```

- [ ] **Step 2: 创建 src/composables/useCategories.ts**

```typescript
import { liveQuery } from 'dexie'
import { useObservable } from '@vueuse/core'
import { computed } from 'vue'
import { db } from '@/db'
import type { Category } from '@/types'

export function useCategories() {
  const categories = useObservable(
    liveQuery(() => db.categories.orderBy('sort').toArray())
  )

  const expenseTree = computed(() => {
    const list = (categories.value ?? []) as Category[]
    return buildTree(list.filter(c => c.type === 'expense' && !c.isHidden))
  })

  const incomeTree = computed(() => {
    const list = (categories.value ?? []) as Category[]
    return buildTree(list.filter(c => c.type === 'income' && !c.isHidden))
  })

  function buildTree(flat: Category[]) {
    const parents = flat.filter(c => c.parentId === null)
    return parents.map(p => ({
      ...p,
      children: flat.filter(c => c.parentId === p.id)
    }))
  }

  async function toggleLatteFactor(id: number) {
    const cat = (categories.value as Category[])?.find(c => c.id === id)
    if (cat) await db.categories.update(id, { isLatteFactor: !cat.isLatteFactor })
  }

  async function toggleHidden(id: number) {
    const cat = (categories.value as Category[])?.find(c => c.id === id)
    if (cat) await db.categories.update(id, { isHidden: !cat.isHidden })
  }

  return {
    categories: categories as unknown as import('vue').Ref<Category[]>,
    expenseTree, incomeTree, toggleLatteFactor, toggleHidden,
  }
}
```

- [ ] **Step 3: 创建 src/composables/useTransactions.ts**

```typescript
import { liveQuery } from 'dexie'
import { useObservable } from '@vueuse/core'
import { db } from '@/db'
import type { Transaction } from '@/types'

export function useTransactions() {
  const transactions = useObservable(
    liveQuery(() => db.transactions.orderBy('date').reverse().toArray())
  )

  async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.transactions, db.accounts, async () => {
      const id = await db.transactions.add({ ...tx, createdAt: now } as Transaction)
      if (tx.fromAccountId) {
        const from = await db.accounts.get(tx.fromAccountId)
        if (from) await db.accounts.update(tx.fromAccountId, { balance: +(from.balance - tx.amount).toFixed(2) })
      }
      if (tx.toAccountId) {
        const to = await db.accounts.get(tx.toAccountId)
        if (to) await db.accounts.update(tx.toAccountId, { balance: +(to.balance + tx.amount).toFixed(2) })
      }
      return id
    })
  }

  async function deleteTransaction(id: number) {
    await db.transaction('rw', db.transactions, db.accounts, async () => {
      const tx = await db.transactions.get(id)
      if (!tx) return
      if (tx.fromAccountId) {
        const a = await db.accounts.get(tx.fromAccountId)
        if (a) await db.accounts.update(tx.fromAccountId, { balance: +(a.balance + tx.amount).toFixed(2) })
      }
      if (tx.toAccountId) {
        const a = await db.accounts.get(tx.toAccountId)
        if (a) await db.accounts.update(tx.toAccountId, { balance: +(a.balance - tx.amount).toFixed(2) })
      }
      await db.transactions.delete(id)
    })
  }

  return {
    transactions: transactions as unknown as import('vue').Ref<Transaction[]>,
    addTransaction, deleteTransaction,
  }
}
```

- [ ] **Step 4: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: add core composables for accounts, categories, and transactions"
```

---

### Task 4: 智能防错引擎

**Files:**
- Create: `src/composables/useValidationEngine.ts`

**Interfaces:**
- Consumes: Task 2 的 `AccountType`/`TransactionType` 类型
- Produces: `validateTransferEligibility(fromType, toType, currentMode)` → `ValidationResult`

- [ ] **Step 1: 创建 useValidationEngine.ts**

```typescript
import type { AccountType, TransactionType } from '@/types'

export interface ValidationResult {
  forceMode: TransactionType | null
  lockMode: boolean
  showMemberPicker: boolean
  message: string | null
}

export function useValidationEngine() {
  function validateTransferEligibility(
    fromType: AccountType | null,
    toType: AccountType | null,
    _currentMode: TransactionType
  ): ValidationResult {
    const result: ValidationResult = {
      forceMode: null, lockMode: false, showMemberPicker: false, message: null,
    }
    if (fromType === 'liquid' && toType === 'debt') {
      result.forceMode = 'transfer'; result.lockMode = true
      result.message = '还信用卡/借款请使用转账模式'
      return result
    }
    if (fromType === 'debt' && toType === 'liquid') {
      result.forceMode = 'transfer'; result.lockMode = true
      result.message = '借款收回请使用转账模式'
      return result
    }
    if (fromType === 'debt' && toType === 'debt') {
      result.forceMode = 'transfer'; result.lockMode = true
      result.message = '负债间流转请使用转账模式'
      return result
    }
    return result
  }

  function isCreditCardExpenseValid(fromType: AccountType | null, mode: TransactionType): boolean {
    return mode === 'expense' && fromType === 'debt'
  }

  return { validateTransferEligibility, isCreditCardExpenseValid }
}
```

- [ ] **Step 2: 验证 + 提交**

Run: `npx vue-tsc --noEmit`
Expected: 无类型错误

```bash
git add -A
git commit -m "feat: add validation engine for transfer isolation rules"
```