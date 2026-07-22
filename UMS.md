---
description: >-
  钱书 (Money Book) — 本地优先、零后端依赖的个人记账 PWA。
  本文档由 UMS Code 在 2026-07-22 自动分析生成，用作未来交互的项目上下文。
---

# 钱书 (Money Book) — 项目上下文

---

## 项目概述

**钱书** — 本地优先、零后端依赖的个人记账 PWA，目标日均 1–5 笔流水。

| 属性 | 值 |
|------|-----|
| 技术栈 | Vue 3 + TypeScript (Composition API + `<script setup>`) |
| 构建工具 | Vite 5 |
| 样式方案 | UnoCSS (已安装+插件注册) + 手写 CSS 变量 (iOS 设计语言) |
| 数据库 | Dexie.js 3 (IndexedDB 封装) — 5 张表, v4 |
| 状态管理 | Pinia 2 — 4 个 Store |
| 路由 | Vue Router 4 (HTML5 History 模式) — 7 条路由, 全部懒加载 |
| PWA | vite-plugin-pwa (autoUpdate) — SW + manifest + 离线缓存 |
| 图表 | ECharts 5 + vue-echarts (按需注册 bar/pie/grid/tooltip/legend) |
| 工具库 | @vueuse/core (useBreakpoints 做响应式适配) |
| 安全 | Web Crypto API (SHA-256) PIN 码本地哈希, 存 localStorage |
| 金额精度 | 分 (cents) 为整数单位存储, 避免浮点误差 |
| 类型检查 | vue-tsc — `npm run build` 强制 `--noEmit` |
| 目标平台 | 移动端 (≤768px) + 桌面端 (>768px) |

---

## 快速命令

```bash
npm install          # 安装依赖
npm run dev          # 启动 Vite 开发服务器 (默认 :5173)
npm run build        # vue-tsc --noEmit && vite build (PWA + 代码分割)
npm run preview      # 本地预览构建产物
```

---

## 目录结构 (src)

```
src/
├── main.ts                     # 入口: mount App、Pinia、Router
│                               #   import 'uno.css' + main.css
│                               #   seedData (幂等植入预设)
│                               #   navigator.storage.persist()
├── App.vue                     # 根组件:
│   ├── PIN 锁定层 (PinDialog, visibilitychange 监听)
│   ├── useBreakpoints(768) → isMobile
│   └── v-if="unlocked" → MobileLayout / DesktopLayout
│
├── env.d.ts                    # 环境类型声明 (.vue 模块)
├── types/index.ts              # 5 个 TypeScript 接口
│
├── db/
│   ├── index.ts                # Dexie DB (moneybook, v4, 5 表)
│   └── seed.ts                 # 首次启动植入 4 账户 + 14 父分类
│
├── router/index.ts             # 7 条路由, 全部懒加载
│
├── stores/
│   ├── uiStore.ts              # UI 状态 + PIN unlock 标志
│   ├── accountStore.ts         # 账户列表 (useLiveQuery) + CRUD + totalBalance
│   ├── categoryStore.ts        # 分类列表 (useLiveQuery) + CRUD + 筛选
│   └── transactionStore.ts     # 交易 CRUD + 标签同步 + data version
│
├── composables/
│   └── useLiveQuery.ts         # Dexie liveQuery → Vue ref 封装
│
├── utils/
│   ├── format.ts               # 金额(分→¥) / 日期(智能标签) / 格式化
│   ├── export.ts               # JSON 导入/导出/数据彻底销毁
│   ├── crypto.ts               # SHA-256 PIN 哈希 + localStorage 存取
│   └── echarts-setup.ts        # ECharts 按需注册
│
├── styles/main.css             # CSS 变量 (iOS Tokens) + reset + 通用动画
│
├── scripts/seedMockData.ts     # 开发辅助: 生成随机测试数据
│
├── pages/
│   ├── booking/
│   │   └── BookingPage.vue        # 记账页 (~440 行)
│   ├── transactions/
│   │   └── TransactionsPage.vue   # 明细页 (~1190 行, 最复杂)
│   ├── accounts/
│   │   └── AccountsPage.vue       # 账户总览 (~150 行)
│   │   └── AccountDetailPage.vue  # 单账户流水 (~180 行, standalone)
│   ├── stats/
│   │   └── StatsPage.vue          # 统计页 (~860 行)
│   └── settings/
│       ├── SettingsPage.vue       # 设置主页 (~320 行, 子视图导航)
│       ├── SecurityLock.vue       # PIN 码设置/修改/关闭 (~485 行)
│       ├── AccountManager.vue     # 账户 CRUD + 拖拽排序 (~270 行)
│       ├── CategoryManager.vue    # 分类树形展示 (~90 行)
│       ├── TagManager.vue         # 标签 CRUD + 联动删除 (~195 行)
│       └── RuleManager.vue        # 周期规则 CRUD + 开关 (~240 行)
│
├── components/
│   ├── layout/
│   │   ├── MobileLayout.vue    # TabBar + router-view
│   │   ├── DesktopLayout.vue   # Sidebar + router-view
│   │   ├── TabBar.vue          # 5 项 Tab, 记账👻突出 + ✓保存
│   │   └── Sidebar.vue         # 160px 固定, 5 项 emoji
│   ├── booking/
│   │   ├── ModeSwitch.vue      # 3 模式 tab + 滑动手势
│   │   ├── NumberKeyboard.vue  # 自定义数字键盘
│   │   └── CategoryPicker.vue  # 两级分类选择
│   ├── transactions/
│   │   ├── TransactionItem.vue # 列表行
│   │   ├── TransactionDetail.vue # 详情 Sheet (~230 行)
│   │   ├── TransactionEdit.vue   # 编辑 Sheet (~280 行)
│   │   └── FilterChips.vue     # 分类筛选 chips
│   ├── accounts/
│   │   ├── NetWorthCard.vue    # 净资产渐变卡片
│   │   └── AccountGroup.vue    # 账户分组 (可折叠)
│   ├── stats/
│   │   └── ExpenseChart.vue    # ECharts 封装
│   └── common/
│       ├── EmptyState.vue      # 空状态占位
│       ├── PinDialog.vue       # PIN 验证弹窗 (6 位, 自含数字键盘)
│       ├── CommonBottomSheet.vue # 通用底部弹出面板 (~85 行)
│       ├── ConfirmDialog.vue   # 通用确认弹窗 (~140 行)
│       └── PullToRefresh.vue   # 下拉刷新 (~160 行)
```

---

## 数据库设计 (Dexie.js / IndexedDB)

数据库: `moneybook` (当前 v4), 5 张表。

### Schema 演进

| 版本 | 新增 | 说明 |
|------|------|------|
| v2 | 4 张基础表 | accounts, categories, transactions, recurringRules |
| v3 | tags 表 + 升级迁移 | `tags: '++id, &name'`; 从已有交易 tag 数组抽取 |
| v4 | transactions 复合索引 | `[date+id]` — 为游标分页 |

### v4 Schema

```typescript
class MoneyBookDB extends Dexie {
  accounts!:       Table<Account, number>       // ++id, name
  categories!:     Table<Category, number>      // ++id, type, parentId
  transactions!:   Table<Transaction, number>   // ++id, type, date, categoryId, [date+id]
  recurringRules!: Table<RecurringRule, number> // ++id, enabled, dayOfMonth
  tags!:           Table<Tag, number>           // ++id, &name (唯一索引)
}
```

### 各表主键/索引

| 表 | 索引 |
|----|------|
| `accounts` | `++id, name` |
| `categories` | `++id, type, parentId` |
| `transactions` | `++id, type, date, categoryId, [date+id]` |
| `recurringRules` | `++id, enabled, dayOfMonth` |
| `tags` | `++id, &name` |

### 种子数据 (src/db/seed.ts)

- 4 个预设账户: 银行卡 💳, 支付宝 💳, 微信 💳, 现金 💵
- 14 个父分类:
  | 类型 | 父分类 |
  |------|--------|
  | expense (8) | 居住🏠/餐饮🍽️/交通🚗/购物🛍️/休闲🎭/家庭👨‍👩‍👧/人情🤝/特别🧮 |
  | income (3) | 主动收入💼/被动收入💰/其它收入🎁 |
  | transfer (3) | 借入借出🤝/存钱账户🏦/理财账户📈 |

---

## 核心类型 (src/types/index.ts)

```typescript
interface Account {
  id?: number; name: string; balance: number; icon: string; sort: number
}
interface Category {
  id?: number; type: 'expense' | 'income' | 'transfer';
  parentId: number | null; name: string; icon: string; sort: number
}
interface Transaction {
  id?: number; type: 'expense' | 'income' | 'transfer';
  title: string; amount: number; categoryId: number | null;
  tags: string[]; note: string; date: string; time: string
}
interface Tag { id?: number; name: string }
interface RecurringRule {
  id?: number; type: 'expense' | 'income'; title: string; amount: number;
  categoryId: number | null; tags: string[]; note: string;
  dayOfMonth: number; enabled: boolean; lastExecuted: string | null
}
```

---

## 路由表

| 路径 | 名称 | 页面 | 说明 |
|------|------|------|------|
| `/` | — | 重定向 → `/booking` | |
| `/booking` | `booking` | BookingPage | 核心记账 |
| `/transactions` | `transactions` | TransactionsPage | 流水 + 筛选 + 详情/编辑 |
| `/accounts` | `accounts` | AccountsPage | 净资产 + 所有账户 |
| `/accounts/:id` | `account-detail` | AccountDetailPage | 单账户流水 |
| `/stats` | `stats` | StatsPage | 统计 |
| `/settings` | `settings` | SettingsPage | 安全/数据/账户/分类/标签/规则 |

### Query Params (明细页)

| 参数 | 类型 | 来源 | 用途 |
|------|------|------|------|
| `tag` | string | 统计页"标签聚合" → | 搜索框内容, `searchOpen=true` |
| `searchField` | `'all'\|'title'\|'note'\|'tag'` | 统计页标签跳转 | 设置搜索字段 |
| `categoryId` | string (number) | 统计页"支出排行" (月模式) | `selectedCategoryId` |
| `yearMonth` | `'YYYY-MM'` | 统计页"支出排行" (月模式) | `filterYear/filterMonth`, `dateFilterActive=true` |

---

## PIN 锁机制

### 核心流程

```
App mounted
  ├── getStoredPINHash()
  ├── hasPin = true → showPinLock=true, unlocked=false
  ├── hasPin = false → showPinLock=false, unlocked=true
  │
  ├── 用户输入 6 位 PIN
  │   └── hashPIN(pin) → 比对 getStoredPINHash()
  │       ├── 匹配: unlockApp() → unlocked=true, showPinLock=false
  │       └── 不匹配: pinError="PIN 码错误，请重试"
  │
  ├── visibilitychange
  │   ├── hidden → unlocked=false
  │   └── visible + hasPin → showPinLock=true (重新锁定)
  │
  └── 无 PIN → 直接渲染 App, 永不弹窗
```

### 涉及文件

| 文件 | 职责 |
|------|------|
| `App.vue` | PinDialog 条件渲染 + onPinSubmit + onVisibilityChange |
| `stores/uiStore.ts` | `unlocked: ref(true)` — 控制 App.vue 内容渲染 |
| `components/common/PinDialog.vue` | 6 位数字键盘弹窗, `visible`/`errorMsg` props, `submit` emit |
| `pages/settings/SecurityLock.vue` | 设置/修改/关闭 PIN (独立子页面) |
| `pages/settings/SettingsPage.vue` | `hasPin` 为 `ref`, `onSecurityBack()` 重新读取 localStorage |
| `utils/crypto.ts` | `hashPIN`/`getStoredPINHash`/`setStoredPINHash`/`clearPIN` |

### 验证时机

| 场景 | 行为 |
|------|------|
| App 首次加载 (有 PIN) | 全屏 PinDialog 覆盖, 模板条件 `v-if="unlocked"` 阻止内容 |
| 输入正确 PIN | `unlocked=true`, `showPinLock=false` |
| 输入错误 PIN | 红色 "PIN 码错误，请重试", 可继续输入 |
| 点击蒙层 | 无反应 (不可穿透) |
| 切到后台 | `visibilitychange → hidden`: `unlocked=false` |
| 后台切回 (有 PIN) | `visibilitychange → visible`: `showPinLock=true` |
| 无 PIN | `unlocked=true`, 直接进入 App |

---

## Pinia Stores

| Store | 职责 | 数据来源 |
|-------|------|---------|
| `uiStore` | PIN unlocked, 记账模式/金额/最近分类,  TabBar↔BookingPage 桥接 | 纯 JS, 不涉及 DB |
| `accountStore` | 账户列表 + 总余额 computed + CRUD | `useLiveQuery(() => db.accounts.toArray())` |
| `categoryStore` | 分类列表 + 按 type/parent/children 筛选 + CRUD | `useLiveQuery(() => db.categories.toArray())` |
| `transactionStore` | 交易 CRUD + 标签同步 + data version | 无状态, 不缓存全部数据 |

### uiStore 状态

| 状态 | 类型 | 用途 |
|------|------|------|
| `unlocked` | `Ref<boolean>` | PIN 是否已验证通过 |
| `bookingMode` | `BookingMode` | 记账模式 (expense/income/transfer) |
| `bookingAmount` | `number` | 当前输入金额 (分) |
| `lastCategoryId` | `number\|null` | 最近使用的分类 |
| `bookingSaveTrigger` | `number` | 递增计数器, TabBar watch 后触发保存 |
| `bookingCanSave` | `boolean` | 保存按钮可点击状态 |
| `bookingHintVisible` | `boolean` | 保存提示气泡 (3s 自动消失) |

---

## 数据流模式

```
IndexedDB (Dexie)
  → liveQuery() Observable
    → watchEffect + subscribe (useLiveQuery)
      → ref 响应式更新
        → Vue Template 自动重新渲染
```

**`useLiveQuery<T>(queryFn, initialValue): Ref<T>`** — 泛型封装, 组件卸载时 `onCleanup(() => sub.unsubscribe())` 自动清理。

---

## 统计页详情 (StatsPage ~860 行)

| 模块 | 实现 | 说明 |
|------|------|------|
| Header | `timeMode` toggle (月/年/自选) | |
| 概览 | `overview-card income/expense` | 纯数字, 红/绿底色 |
| 月度趋势 | ECharts bar | `valueFormatter` 保留 2 位小数 |
| 支出构成 | ECharts pie (环形) | Top6 + "其他" |
| 支出排行 | CSS 排名列表 | **Toggle**: 一级/二级; **8 条**; **月模式点击跳转** → `/transactions?categoryId=X&yearMonth=YYYY-MM` |
| 标签聚合 | CSS chips | **点击跳转** → `/transactions?tag=X&searchField=tag`, 汇总按钮跳无 params |
| 大额支出 | CSS 列表 | >1000 元, 按金额降序, Top10, 无点击, 与时间范围联动 |

---

## TransactionsPage 关键逻辑 (~1190 行)

| 功能 | 实现 |
|------|------|
| **数据获取** | 游标分页 (`[date+id]` 复合索引), 每页 20 条, IntersectionObserver 无限滚动 |
| **日期筛选** | 月份选择器 (←→), `dateFilterActive` activate, `clearDateFilter` reset |
| **搜索** | `SearchField` 选择器 (全部/标题/备注/标签), 全文搜索 (title/note/tags) |
| **分类筛选** | `FilterChips`, 选父分类时自动匹配所有子分类 |
| **Query params** | `tag` / `searchField` / `categoryId` / `yearMonth` — 均在初始化 + watch 中处理 |
| **详情 Detail** | 底部 Sheet (分类/金额/日期/备注/标签) |
| **编辑 Edit** | 底部 Sheet (标题/金额/日期/时间/备注/标签) |
| **分页 reset** | 任何筛选变更 → 防抖 100ms → `resetPagination()` |

---

## 金额约定

- **所有金额以"分"存储**: DB, store, 内部传递均使用整数分
- **输入**: `Math.round(parseFloat(v) * 100)` 元→分
- **显示**: `formatCurrency(n)` → `¥1,234.00`; `formatShortCurrency(n)` → `¥1,280`
- **编辑**: `input` 显示 `amountYuan = amount / 100`; 保存 `Math.round(amountYuan * 100)`

---

## 响应式适配

- 移动端 (≤768px): 底部 TabBar, 单列, safe-area-inset-bottom
- 桌面端 (>768px): 左侧 160px Sidebar, ECharts 全宽
- `useBreakpoints({ mobile: 768 }).smaller('mobile')` → `isMobile`

---

## 视觉约定

| 元素 | 值 |
|------|-----|
| 支出 | `#34c759` (iOS 绿) |
| 收入 | `#ff3b30` (iOS 红) |
| 转账 | `#007aff` (iOS 蓝) |
| 背景 | `#f2f2f6` |
| 卡片 | `rgba(255,255,255,0.8)` + `backdrop-filter: blur(10px)` |
| 字体 | `-apple-system, BlinkMacSystemFont, 'Segoe UI', ...` |
| 圆角 | 8/12/14/16px |
| 阴影 | sm/md/lg 三级 |

---

## 开发约定

- **Composition API + `<script setup>`**: 全项目统一
- **命名**: camelCase 变量/函数, PascalCase 组件/类型, kebab-case CSS class
- **导入顺序**: Vue API → 第三方 → 内部 (`@/` 别名)
- **v-for key**: 必须
- **Teleport**: 弹窗/Sheet 使用 `<Teleport to="body">`
- **标签同步**: `transactionStore` 的 `addTransaction`/`updateTransaction` 自动 `ensureTagsExist`

---

## 已知问题 / 待改进

| 优先级 | 问题 | 说明 |
|--------|------|------|
| P0 | 周期记账自动执行 | UI 已完成 (RuleManager + DB), 无 `setInterval` 每日检测 |
| P0 | 零测试覆盖 | 建议为 transactionStore + format.ts 添加单元测试 |
| P1 | TransactionsPage ~1190 行 | Detail/Edit 已拆分, 但仍偏大 |
| P1 | UnoCSS 未生效 | 已装 + `vite.config.ts` 注册, 缺 `uno.config.ts` |
| P2 | 大交易量 | 虽有 `[date+id]` 索引 + 游标分页, 但搜索需全表扫描 |
| P2 | 余额手动编辑 | 只能通过交易间接修改 |
| P2 | AccountDetailPage 未接入路由 | router 中无 `account-detail` 条目 |
| P2 | 批量操作 | 仅单条删除 |
| P3 | CI + Linter | 无 CI, 无 ESLint/Prettier |

---

## 重要财务规则

### 借贷记账 (必须用"转账"模式)
- 借入: from=借入人 → to=我的现金
- 还钱: from=我的现金 → to=借入人

### 房贷记账 (月供必须拆两条)
- 利息 → 支出 (银行卡)
- 本金 → 转账 (from=银行卡 → to=房贷本金)

---
<!-- END UMS.md -->