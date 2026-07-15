# 钱书 V2 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个本地优先、零后端依赖的个人记账 PWA 应用"钱书"

**Architecture:** Vue 3 + TypeScript 前端 SPA，Dexie.js 作为 IndexedDB 持久化层，Pinia 管理全局状态，UnoCSS 提供 iOS 风格样式。移动端底部 5 Tab 导航（记账居中突出），桌面端左侧侧边栏导航。

**Tech Stack:** Vue 3 (Composition API) + TypeScript · Vite · UnoCSS · Dexie.js · Pinia · ECharts · @vueuse/core · vite-plugin-pwa

## 全局约束

- 所有金额使用 `number` 类型
- 负债账户余额存负数
- 转账流水 `categoryId = null`
- 所有流水变更必须包裹在 `db.transaction` 中保证原子性
- 移动端 ≤768px，桌面端 >768px
- 图标使用内联 SVG（不引入图标库）
- 无后端依赖，纯前端本地存储
- 无需用户注册/登录

---

## 文件结构

```
money-book-pwa/
├── index.html
├── package.json
├── tsconfig.json / tsconfig.node.json
├── vite.config.ts
├── src/
│   ├── main.ts / App.vue
│   ├── env.d.ts / styles/main.css
│   ├── db/index.ts + seed.ts
│   ├── types/index.ts
│   ├── router/index.ts
│   ├── stores/ (accountStore, categoryStore, transactionStore, uiStore)
│   ├── composables/ (useBookkeeping, useTransactions, useAccounts, useCategories, useRecurringRules, usePinLock)
│   ├── utils/ (format, crypto, export)
│   ├── components/
│   │   ├── layout/ (MobileLayout, DesktopLayout, TabBar, Sidebar)
│   │   ├── booking/ (NumberKeyboard, CategoryPicker, ModeSwitch)
│   │   ├── accounts/ (NetWorthCard, AccountGroup)
│   │   ├── transactions/ (TransactionItem, FilterChips)
│   │   ├── stats/ (ExpenseChart)
│   │   └── common/ (PinDialog, EmptyState)
│   └── pages/ (Booking, Transactions, Accounts, AccountDetail, Stats, Settings)
```

---

## 任务分解

| # | 任务 | 依赖 | 主要产出 |
|---|------|------|----------|
| 1 | 项目脚手架 | - | Vite+Vue3 空项目可运行 |
| 2 | 类型、DB、种子数据 | 1 | Dexie DB + types + seed |
| 3 | 路由、布局、通用组件 | 1, 2 | Router + Layout + Tab/Sidebar + Common |
| 4 | Pinia Stores + Utils | 2 | 4 stores + 3 utils |
| 5 | 记账页 | 3, 4 | Booking page + NumberKeyboard + CategoryPicker + ModeSwitch |
| 6 | 明细页 | 3, 4 | Transactions page + TransactionItem + FilterChips |
| 7 | 账户页 | 3, 4 | Accounts page + AccountDetail + NetWorthCard + AccountGroup |
| 8 | 统计页 | 3, 4 | Stats page + ExpenseChart |
| 9 | 设置页 | 3, 4, 6 | Settings page + PinDialog + 全部功能子页面 |
| 10 | PWA 构建验证 | 全部 | build 通过 |

---

## 详细任务计划

### Task 1: 项目脚手架

**文件:**
- Create: `package.json`
- Create: `tsconfig.json` / `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/env.d.ts`
- Create: `src/main.ts`
- Create: `src/App.vue`（骨架）
- Create: `src/styles/main.css`

**产出:** 可运行的空 Vue 3 应用

- [ ] **Step 1: 创建 package.json**

依赖：vue@^3.4, vue-router@^4.3, pinia@^2.1, dexie@^3.2, @vueuse/core@^10.7, echarts@^5.5, vue-echarts@^7.0
devDeps：@vitejs/plugin-vue@^5, vite@^5, unocss@^0.58, vite-plugin-pwa@^0.19, vue-tsc@^2, typescript@^5.3

- [ ] **Step 2: 创建 tsconfig.json**（标准 Vue 3 配置，paths: `@/*` → `./src/*`）
- [ ] **Step 3: 创建 tsconfig.node.json**
- [ ] **Step 4: 创建 vite.config.ts**（Vue + UnoCSS + VitePWA + @ 别名）
- [ ] **Step 5: 创建 index.html**（viewport user-scalable=no, 主题色 #007aff, apple-mobile-web-app）
- [ ] **Step 6: 创建 src/env.d.ts**（声明 .vue 模块）
- [ ] **Step 7: 创建 src/styles/main.css**（iOS Design Tokens: --color-primary #007aff 等 + 全局样式）
- [ ] **Step 8: 创建 src/main.ts**（createApp + Pinia + Router + import 'uno.css' + 持久化申请）
- [ ] **Step 9: 创建 src/App.vue**（仅 `<router-view />`）
- [ ] **Step 10: 安装依赖** `npm install`
- [ ] **Step 11: 提交** `git commit -m "chore: scaffold project"`

---

### Task 2: 类型定义、数据库模式与种子数据

**文件:**
- Create: `src/types/index.ts`
- Create: `src/db/index.ts`
- Create: `src/db/seed.ts`

**产出:** 完整的 Dexie 数据库、类型定义和初始化种子数据

**关键接口:**
- `Account`: id, name, groupId('liquid'|'restricted'|'claim'|'debt'), balance, icon, sort
- `Category`: id, type('expense'|'income'), parentId(number|null), name, icon, sort
- `Transaction`: id, type('expense'|'income'|'transfer'), amount, fromAccountId, toAccountId, categoryId, tags(string[]), note, date, time
- `RecurringRule`: id, type, amount, fromAccountId, toAccountId, categoryId, tags, note, dayOfMonth(1-28), enabled, lastExecuted

**DB Schema:** `accounts: '++id, groupId, name'` | `categories: '++id, type, parentId'` | `transactions: '++id, type, date, fromAccountId, toAccountId, categoryId'` | `recurringRules: '++id, enabled, dayOfMonth'`

**seed.ts** 初始化预设账户（10个）和分类（8个一级支出 + 3个一级收入 + 对应二级）。函数 `seedData()` 检查 `accounts.count()`，为空才写入。

---

### Task 3: 路由、布局组件与通用组件

**文件:**
- Create: `src/router/index.ts`
- Overwrite: `src/App.vue`
- Create: `src/components/layout/{MobileLayout,DesktopLayout,TabBar,Sidebar}.vue`
- Create: `src/components/common/{EmptyState,PinDialog}.vue`
- Create: 所有 `src/pages/*.vue` 页面占位符

**关键设计:**

**路由结构:** 两套 layout（/mobile/* 和 /desktop/*），/ 重定向到 /booking，在 App.vue 中用 `useBreakpoints` 检测屏幕宽度自动切换。

**TabBar.vue:** 5 个 Tab（明细·统计·记账·账户·设置），记账按钮用蓝色渐变圆形凸起 + SVG ⊕ 加号图标，其余用三线/柱状/钱包/齿轮 SVG 图标。

**Sidebar.vue:** 桌面端 160px 宽侧边栏，5 个导航项竖排，当前页高亮。

**MobileLayout/DesktopLayout:** 容器组件，包含 TabBar/Sidebar 和 `<router-view />`。

**EmptyState:** 通用空状态组件，props: icon, message。

**PinDialog:** PIN 码输入弹窗（留到 Task 9 实现完整逻辑，本次仅创建占位）。

所有 6 个页面先创建占位符（简单文本"XXX页（待实现）"），避免路由报错。

---

### Task 4: Pinia Stores + Utils

详见子计划文件 `docs/superpowers/plans/2026-07-15-money-book-plan-task4.md`

**Store 职责:**
- `accountStore`: 账户列表(liveQuery)、净资产计算、按组查询、CRUD（delete 检查流水）
- `categoryStore`: 分类列表、按类型/父子查询、CRUD
- `transactionStore`: 流水列表、CRUD（事务中同步余额）、反向还原、按日期查询
- `uiStore`: 记账模式、金额、上次选择的账户/分类

**Utils:**
- `format.ts`: formatCurrency, formatDate, toDateString, formatTimeLabel
- `crypto.ts`: hashPIN(SHA-256), getStoredPINHash, setStoredPINHash, clearPIN
- `export.ts`: exportData(JSON下载), importData(覆盖恢复), destroyAllData(清空+注销SW+清Cache)

---

### Task 5: 记账页

详见子计划文件 `docs/superpowers/plans/2026-07-15-money-book-plan-task5.md`

**组件:**
- `ModeSwitch.vue`: 收入/支出/转账三段式切换器
- `NumberKeyboard.vue`: iOS 风格 3×4 数字键盘，支持小数点、退格、确认
- `CategoryPicker.vue`: 4列一级宫格 + 二级 Chip 标签
- `BookingPage.vue`: 组合所有子组件

**工作流:** 输入金额 → 选分类 → 确认记账（自动记录时间和账户）。

**转账模式:** 隐藏分类，显示"从→到"双账户选择器。

---

### Task 6: 明细页

**文件:**
- Create: `src/components/transactions/TransactionItem.vue`
- Create: `src/components/transactions/FilterChips.vue`
- Create: `src/pages/TransactionsPage.vue`

**功能:**
- 按日期分组（今天/昨天/日期），每组日汇总
- 每条显示：图标 + 分类 + 账户 + 时间 + 标签 + 金额（红/绿）
- 顶部分类筛选 Chip 横向滚动
- 点击记录 → 底部弹窗详情（可编辑/删除）
- 搜索框（按备注/标签搜索）

---

### Task 7: 账户页

**文件:**
- Create: `src/components/accounts/NetWorthCard.vue`
- Create: `src/components/accounts/AccountGroup.vue`
- Create: `src/pages/AccountsPage.vue`
- Create: `src/pages/AccountDetailPage.vue`

**功能:**
- 顶部深色净资产卡（大字 + 总资产/总负债）
- 4 个可折叠分组（流动性/限制性/债权/负债），负债红色
- 每组组合计
- 点击账户进入详情（该账户流水列表）

---

### Task 8: 统计页

详见子计划文件 `docs/superpowers/plans/2026-07-15-money-book-plan-task8.md`

**文件:**
- Create: `src/components/stats/ExpenseChart.vue`
- Create: `src/pages/StatsPage.vue`

**功能:** 月/年/自定义时间切换，月度柱状图，环形图，支出排行，标签聚合。桌面端多列看板。

---

### Task 9: 设置页

**文件:**
- Create: `src/pages/SettingsPage.vue`

**功能分组:**
- 安全：PIN 码设置（设置/修改/关闭）
- 数据管理：导出JSON、导入JSON、彻底销毁（二次确认弹窗）
- 账户管理：列表 → 新增/编辑/删除（有流水禁止删）
- 分类管理：显示/隐藏二级分类
- 标签管理：新增/删除标签
- 周期记账：管理规则列表
- 关于：版本号

---

### Task 10: PWA 构建验证

- [ ] 配置 PWA 图标（public/favicon.svg）
- [ ] 验证 `vite-plugin-pwa` manifest 配置
- [ ] 运行 `npm run build` 确认无错误
- [ ] 检查构建产物 dist/ 包含 service worker
- [ ] 提交：`git commit -m "chore: configure PWA and verify build"`