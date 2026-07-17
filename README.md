# 钱书 (Money Book)

**钱书** — 本地优先、零后端依赖的个人记账 PWA。

---

## 一、项目概览与定位

| 项目 | 内容 |
|------|------|
| 产品名称 | 钱书 |
| 定位 | 本地优先、零后端依赖的个人记账 PWA |
| 核心理念 | 记账简单快速 · 分类清晰全面 · 财务逻辑严谨 · 数据安全可靠 |
| 目标用户 | 个人日常记账，日均 1-5 笔流水 |
| 适配平台 | 移动端 (≤768px) + 桌面端 (>768px) |
| 版本 | v1.0.0 |

所有数据存储在浏览器 IndexedDB 中，通过 PWA 能力可实现离线使用和类原生体验。

---

## 二、技术栈与架构

| 维度 | 选型 | 说明 |
|------|------|------|
| **框架** | Vue 3 + TypeScript (Composition API + `<script setup>`) | 全套组合式 API，无 Options API |
| **构建工具** | Vite 5 | 开发服务器即时启动，生产构建快速 |
| **样式方案** | UnoCSS (已安装依赖) + 手写 CSS 变量 + iOS 设计语言 | 毛玻璃效果 · 灵动圆角 · 柔和阴影 |
| **数据库** | Dexie.js 3 (IndexedDB 封装) | 支持 `liveQuery` 响应式查询，无需后端 |
| **状态管理** | Pinia 2 | 4 个 Store 分别管理不同领域 |
| **路由** | Vue Router 4 (HTML5 History 模式) | 7 个路由，所有页面组件懒加载 |
| **PWA** | vite-plugin-pwa (autoUpdate) | Service Worker + manifest + 离线缓存 |
| **图表** | ECharts 5 + vue-echarts | Tree-shakable 按需加载配置 |
| **工具库** | @vueuse/core | `useBreakpoints` 做响应式适配 |
| **安全** | Web Crypto API (SHA-256) | PIN 码本地哈希存储，不传输不持久化原文 |
| **金额精度** | 分 (cents) 为整数单位 | 所有金额以 `分` 存储，避免浮点运算误差 |
| **类型检查** | vue-tsc (构建时严格执行) | `npm run build` 包含 `vue-tsc --noEmit` |

### 2.1 架构分层

```
┌─────────────────────────────────────────┐
│            PWA Shell                     │
│  (Manifest + Service Worker + Cache)    │
├─────────────────────────────────────────┤
│              App.vue                     │
│     useBreakpoints (768px 断点)          │
│        ┌────────┴────────┐              │
│   MobileLayout      DesktopLayout       │
│   (TabBar 底部)     (Sidebar 侧栏)       │
│        └────────┬────────┘              │
│           <router-view />                │
├─────────────────────────────────────────┤
│  Pages: 记账 / 明细 / 账户 / 统计 / 设置 │
├─────────────────────────────────────────┤
│     Pinia Stores  (account / category   │
│     / transaction / uiStore)            │
├─────────────────────────────────────────┤
│  Dexie.js - liveQuery Observable → ref  │
├─────────────────────────────────────────┤
│        IndexedDB (moneybook)            │
│  accounts / categories / transactions   │
│              / recurringRules           │
└─────────────────────────────────────────┘
```

### 2.2 响应式适配策略

- **移动端 (≤768px)**：底部 5 项 Tab 导航（记账居中突出），全屏键盘录入，单列布局，safe-area-inset-bottom 适配刘海屏
- **桌面端 (>768px)**：左侧 160px 固定侧边栏导航，统计页 ECharts 全宽渲染
- 响应式判断使用 `@vueuse/core` 的 `useBreakpoints({ mobile: 768 }).smaller('mobile')`

---

## 三、目录结构与模块职责

```
src/
├── main.ts                     # 入口：mount App、Pinia、Router、seed 种子数据、
│                               #   navigator.storage.persist()
├── App.vue                     # 根组件：根据屏幕宽度渲染 MobileLayout / DesktopLayout
│
├── env.d.ts                    # 环境类型声明 (.vue 模块声明)
│
├── types/index.ts              # 4 个核心 TypeScript 类型定义
│
├── db/
│   ├── index.ts                # Dexie 数据库定义 (moneybook, 4 张表, v1)
│   └── seed.ts                 # 首次启动时幂等植入预设账户(10个)和分类(8支出+3收入类)
│
├── router/index.ts             # 7 条路由 (根路径→/booking)，全部懒加载
│
├── stores/
│   ├── accountStore.ts         # 账户列表 (liveQuery) + CRUD + 净资产计算
│   ├── categoryStore.ts        # 分类列表 (liveQuery) + CRUD + 父子层级查询
│   ├── transactionStore.ts     # 交易 CRUD + 余额冲正 (Dexie rw 事务)
│   └── uiStore.ts              # UI 状态 (记账模式/金额/最近账户分类/保存触发)
│
├── composables/
│   └── useLiveQuery.ts         # Dexie liveQuery → Vue ref 封装 (watchEffect 自动管理)
│
├── utils/
│   ├── format.ts               # 金额(分→¥千分位) / 日期(智能标签)格式化
│   ├── export.ts               # JSON 导入/导出/数据彻底销毁
│   ├── crypto.ts               # SHA-256 PIN 哈希 + localStorage 存取
│   └── echarts-setup.ts        # ECharts 按需注册 (Bar/Pie/Tooltip/Legend/Grid)
│
├── styles/main.css             # 全局 CSS 变量 (iOS 设计 Tokens) + reset
│
├── pages/
│   ├── booking/
│   │   └── BookingPage.vue     # 记账页 (核心交互页面，~370 行)
│   ├── transactions/
│   │   └── TransactionsPage.vue # 明细页 (列表+筛选+详情Sheet+编辑Sheet，~850 行)
│   ├── accounts/
│   │   ├── AccountsPage.vue    # 账户总览 (净资产卡片+4分组)
│   │   └── AccountDetailPage.vue # 单账户流水详情
│   ├── stats/
│   │   └── StatsPage.vue       # 统计页 (ECharts Bar/Pie + 排行 + 标签聚合)
│   └── settings/
│       ├── SettingsPage.vue    # 设置主页 (PIN/数据/账户/分类/周期/关于)
│       └── SecurityLock.vue    # PIN 码设置/验证/修改/关闭子页
│       └── DataManagement.vue  # 数据管理子页 (可独立调用的浅页面)
│
├── components/
│   ├── layout/
│   │   ├── MobileLayout.vue    # 移动端布局 (TabBar + router-view)
│   │   ├── DesktopLayout.vue   # 桌面端布局 (Sidebar + router-view)
│   │   ├── TabBar.vue          # 底部 Tab (5 项, 记账👻突出 + ✓保存联动)
│   │   └── Sidebar.vue         # 桌面侧栏 (160px 固定, 5 项 emoji 导航)
│   ├── booking/
│   │   ├── ModeSwitch.vue      # 收入/支出/转账模式切换 (3 tab + 滑动手势)
│   │   ├── NumberKeyboard.vue  # 自定义数字键盘 (0-9 + 退格 + ↵, 最大2位小数)
│   │   └── CategoryPicker.vue  # 两级分类 (4列grid父 → 水平滚动子chips)
│   ├── transactions/
│   │   ├── TransactionItem.vue # 交易列表行 (title + 金额 + 分类 + 图标)
│   │   └── FilterChips.vue     # 分类筛选标签 (水平滚动, 多选)
│   ├── accounts/
│   │   ├── NetWorthCard.vue    # 净资产渐变卡片 (总资产绿/总负债红)
│   │   └── AccountGroup.vue    # 账户分组 (可折叠, 显示分组汇总)
│   ├── stats/
│   │   └── ExpenseChart.vue    # ECharts 图表封装
│   └── common/
│       ├── EmptyState.vue      # 空状态占位 (emoji + 文字)
│       └── PinDialog.vue       # PIN 验证弹窗 (模态, 6位输入)
```

### 3.1 文件规模统计

| 文件 | 行数 | 说明 |
|------|------|------|
| TransactionsPage.vue | ~850 | 最复杂的页面（列表 + 详情Sheet + 编辑Sheet） |
| SettingsPage.vue | ~720 | 功能聚合的设置面板 |
| BookingPage.vue | ~370 | 核心记账交互 |
| StatsPage.vue | ~360 | ECharts 统计 |
| AccountDetailPage.vue | ~180 | 单账户流水 |
| AccountsPage.vue | ~150 | 账户总览 |
| 其余组件/工具 | 50-200 | 各司其职 |

---

## 四、核心数据模型与数据库设计

### 4.1 TypeScript 类型定义 (`src/types/index.ts`)

```typescript
/** 账户 */
interface Account {
  id?: number
  name: string
  groupId: 'liquid' | 'restricted' | 'claim' | 'debt'  // 分组
  balance: number          // 余额，单位：分 (cents)
  icon: string             // emoji
  sort: number
}

/** 分类 (两级) */
interface Category {
  id?: number
  type: 'expense' | 'income'
  parentId: number | null  // null=父分类, number=子分类
  name: string
  icon: string             // 仅父分类有 icon
  sort: number
}

/** 交易记录 */
interface Transaction {
  id?: number
  type: 'expense' | 'income' | 'transfer'
  title: string            // 标题 (自定义)
  amount: number           // 金额，单位：分
  fromAccountId: number | null
  toAccountId: number | null
  categoryId: number | null
  tags: string[]           // 标签数组
  note: string
  date: string             // YYYY-MM-DD
  time: string             // HH:mm
}

/** 周期记账规则 */
interface RecurringRule {
  id?: number
  type: 'expense' | 'income' | 'transfer'
  title: string
  amount: number           // 分
  fromAccountId: number
  toAccountId: number | null
  categoryId: number | null
  tags: string[]
  note: string
  dayOfMonth: number       // 每月第几日
  enabled: boolean
  lastExecuted: string | null  // 上次执行日期
}
```

### 4.2 Dexie Schema (`src/db/index.ts`)

```
moneybook DB (v1):
├── accounts:       ++id, groupId, name
├── categories:     ++id, type, parentId
├── transactions:   ++id, type, date, fromAccountId, toAccountId, categoryId
└── recurringRules: ++id, enabled, dayOfMonth
```

- `++id` = 自增主键
- 二级索引用于按类型、日期、账户、分类的高效查询，无需复杂 JOIN

### 4.3 预设种子数据 (`src/db/seed.ts`)

**10 个预设账户**，分布在 4 个分组：

| 分组 | 账记户 |
|------|--------|
| `liquid` 流动性 | 微信零钱、支付宝余额、银行卡 |
| `restricted` 限制性 | 支付宝小荷包、公积金、投资理财 |
| `claim` 债权 | 借出款项 |
| `debt` 负债 | 信用卡、借入款项、房贷本金 |

**分类体系**：支出 8 大类（居住/餐饮/交通/购物/休闲/家庭/人情/特别）、收入 3 大类（主动收入/被动收入/其他收入），每类下含 3-8 个子分类。

种子数据通过 `db.categories.count()` / `db.accounts.count()` 检查幂等性。

### 4.4 金额精度策略

- **存储**: 所有金额以 `分` (cents) 为整数单位存储在 IndexedDB 中
- **输入**: 用户输入以 `元` 为单位，通过 `Math.round(parseFloat(v) * 100)` 转换为分
- **显示**: 通过 `formatCurrency(n)` 将分 ÷ 100 后格式化显示（`¥1,234.00`）
- **编辑**: 分 ÷ 100 转为元显示在输入框，保存时 `Math.round(yuan * 100)` 转回分
- **优势**: 从根本上规避 JavaScript 浮点精度问题（如 `0.1 + 0.2 !== 0.3`）

---

## 五、数据流与状态管理

### 5.1 核心响应式模式

```
IndexedDB (Dexie)
    │ liveQuery() → Observable (RxJS 风格)
    ▼
  Pinia Store (watchEffect + subscribe)
    │ ref / computed 响应式更新
    ▼
  Vue Template 自动重新渲染
```

**`useLiveQuery` composable (`src/composables/useLiveQuery.ts`)**：
- 接收查询函数和默认初始值
- 在 `watchEffect` 中创建并订阅 `liveQuery` Observable
- 组件卸载时自动取消订阅
- 提供类型安全的泛型包装

**accountStore / categoryStore**：在 `watchEffect` 中直接订阅 `liveQuery`，数据库变更后自动更新 `ref`

**transactionStore**：不缓存全部数据，只提供无状态的 CRUD 方法（页面通过 `useLiveQuery` 独立查询）

**uiStore**：纯 UI 状态（记账模式、金额、最近使用的账户/分类、保存触发信号），不涉及 DB 操作

### 5.2 交易与余额一致性

所有写操作均使用 **Dexie 读写事务 (`db.transaction('rw', [tables], callback)`)**：

| 操作 | 事务内容 |
|------|----------|
| **addTransaction** | 写流水 → 更新 fromAccount 余额 (支出/转账减) / toAccount 余额 (收入/转账加) |
| **updateTransaction** | 撤销旧余额影响 → 应用新余额影响 (仅金额变动时) → 更新流水字段 |
| **deleteTransaction** | 反向冲正余额 → 删除流水 |

同一事务内完成，保证原子性 —— 任一步失败则全部回滚。

### 5.3 净资产计算

```
totalAssets     = Σ(非 debt 分组账户余额)
totalLiabilities = Σ(|debt 分组账户余额|)
netWorth        = totalAssets - totalLiabilities
```

`NetWorthCard.vue` 通过 `accountStore.netWorth` computed 实时响应更新。

### 5.4 UI 状态桥接

`uiStore` 提供记账页与 TabBar 之间的通信桥梁：

| 状态 | 用途 |
|------|------|
| `bookingMode` | 当前记账模式 (expense/income/transfer) |
| `bookingAmount` | 当前输入金额 (分) |
| `bookingCanSave` | 保存按钮是否可点击 |
| `bookingSaveTrigger` | 递增计数器触发保存操作 |
| `bookingHintVisible` | 控制保存提示气泡显示 |
| `lastAccountId` / `lastCategoryId` | 记住上次选择的账户/分类 |

---

## 六、路由设计与页面结构

### 6.1 路由表

| 路径 | 名称 | 页面组件 | 懒加载 | 说明 |
|------|------|----------|--------|------|
| `/` | — | 重定向 → `/booking` | — | 默认首页 |
| `/booking` | `booking` | BookingPage | ✅ | 核心 - 快速记账 |
| `/transactions` | `transactions` | TransactionsPage | ✅ | 流水列表/筛选/详情 |
| `/accounts` | `accounts` | AccountsPage | ✅ | 净资产 + 所有账户 |
| `/accounts/:id` | `account-detail` | AccountDetailPage | ✅ | 单个账户流水 |
| `/stats` | `stats` | StatsPage | ✅ | 收入/支出/趋势/构成 |
| `/settings` | `settings` | SettingsPage | ✅ | PIN/数据管理/账户/分类/周期规则 |

所有页面组件使用 `() => import(...)` 动态导入，支持代码分割。

### 6.2 页面数据依赖关系

```
┌─ BookingPage ─────────────────────────────────┐
│  uiStore (模式/金额/记忆)                       │
│  accountStore (流动性账户列表)                   │
│  categoryStore (按类型筛选分类)                  │
│  transactionStore.addTransaction (保存)         │
└────────────────────────────────────────────────┘

┌─ TransactionsPage ────────────────────────────┐
│  useLiveQuery (全部交易)                        │
│  accountStore (账户名映射)                      │
│  categoryStore (分类名映射 + 筛选 chips)         │
│  transactionStore (删除/更新)                   │
└────────────────────────────────────────────────┘

┌─ StatsPage ───────────────────────────────────┐
│  useLiveQuery (按日期范围查询交易)               │
│  categoryStore (分类聚合)                       │
│  ECharts (Bar + Pie 图表)                      │
└────────────────────────────────────────────────┘

┌─ AccountsPage ────────────────────────────────┐
│  accountStore (全部账户 + 净资产 computed)       │
└────────────────────────────────────────────────┘

┌─ AccountDetailPage ───────────────────────────┐
│  useLiveQuery (匹配该账户全部交易)               │
│  accountStore (账户详情 + 更新)                  │
└────────────────────────────────────────────────┘

┌─ SettingsPage ────────────────────────────────┐
│  accountStore (账户 CRUD)                       │
│  categoryStore (分类 CRUD + 树形展示)            │
│  db.recurringRules (周期规则 CRUD)               │
│  db.transactions (标签聚合)                     │
│  export.ts (数据导入/导出/销毁)                   │
└────────────────────────────────────────────────┘
```

---

## 七、关键业务逻辑

### 7.1 记账流程 (BookingPage)

```
用户操作                          UI 响应
─────────                      ─────────
1. 选择模式                     ModeSwitch 滑动切换 (expense/income/transfer)
2. 选择账户                     ↓ 下拉覆盖层 (转账需选 from→to 两个账户)
3. 选择分类                     CategoryPicker (父 grid → 子 chips)
4. 点击金额占位                  NumberKeyboard 弹出
5. 输入金额 (数字键盘)           displayAmount 实时千分位格式化
6. 点击 ↵ 完成键盘               keyboardVisible = false, 保存提示气泡 3s
7. 填写标题 / 标签 / 备注        自由输入区
8. 点击 TabBar ✓ 保存           构建 Transaction → addTransaction → 重置表单
```

**防呆校验 (canSave computed)**：
- 金额 > 0
- 转账模式：fromAccountId ≠ toAccountId, 且两者均选中
- 非转账模式：账户已选且分类已选

**最近使用的记忆**：保存成功后，`uiStore` 记下 `lastAccountId` 和 `lastCategoryId`，下次记账时自动选中。

### 7.2 明细与筛选 (TransactionsPage)

- **数据获取**：`useLiveQuery` 查询全部交易，按 ID 倒序
- **日期筛选**：月份选择器（←→ 翻月），"清除"按钮重置
- **搜索**：按 `title` / `note` / `tags` 全文搜索（大小写不敏感）
- **分类筛选**：`FilterChips` 水平滚动组件，选中父分类时自动匹配所有子分类
- **日期分组**：智能标签 "今天" / "昨天" / "N月N日 周X"，每日显示收入和支出小计
- **详情 Sheet**：底部弹出完整信息（标题、分类、账户、日期、备注、标签），支持编辑和删除
- **编辑 Sheet**：可编辑标题、金额(元)、日期、时间、备注、标签；分类和账户只读

### 7.3 统计 (StatsPage)

| 视图区域 | 图表类型 | 数据逻辑 |
|----------|----------|----------|
| 概览卡片 | 纯数字 | 红色收入金额、绿色支出金额 |
| 月度趋势 | ECharts Bar | 月模式 → 每日柱状；年模式 → 12 月柱状 |
| 支出构成 | ECharts Pie (环形) | 按父分类聚合，取 Top 6，剩余归为"其他" |
| 支出排行 | CSS 排名列表 | Top 5 分类（金色/银色/铜色/灰 4 色排名徽标） |
| 标签聚合 | CSS 列表 | 按标签名聚合支出，显示金额和占比 |

时间范围支持：月 / 年 / 自选时间段

### 7.4 安全机制 (SecurityLock + PinDialog + crypto.ts)

| 场景 | 流程 |
|------|------|
| **首次设置** | 输入 6 位数字 → 再次输入确认 → SHA-256 哈希 → `localStorage.setItem` |
| **验证** | PinDialog 弹出 → 输入 → 哈希比对 |
| **修改** | 验证旧 PIN → 输入新 PIN(2次) → 新哈希覆盖旧哈希 |
| **关闭** | 验证旧 PIN → `localStorage.removeItem` |
| **技术要点** | 原文永不入 DB、不入日志、不传输；仅 hex 哈希持久化 |

### 7.5 数据管理 (export.ts)

| 功能 | 流程 | 事务性 |
|------|------|--------|
| **导出备份** | 读取 4 张表全部数据 → JSON 序列化 → `<a>.download()` | 无 |
| **导入恢复** | 读取 JSON → 用户确认 → clear 4 表 → `bulkAdd` | ✅ Dexie 'rw' 事务 |
| **彻底销毁** | 3 次确认输入 "9" → clear 4 表 → CacheStorage.delete → ServiceWorker 注销 | 多步不可逆 |

### 7.6 周期记账 (RecurringRule)

- 在 SettingsPage 管理规则（新增/编辑/启用/禁用/删除）
- **当前状态**：规则已建立存储层和 UI 管理层，但**自动执行功能尚未实现**（需要定时检测当日规则并自动创建交易）

### 7.7 账户删除保护

`accountStore.deleteAccount` 在删除前检查：
```
db.transactions.where('fromAccountId').equals(id)
               .or('toAccountId').equals(id)
               .count()
```
已有流水的账户禁止删除，防止数据孤岛。需用户手动转移或删除该账户所有流水。

### 7.8 账户余额管理策略 ⚠️ 重要约定

**余额的两个来源：**

| 来源 | 方式 | 有无对应交易记录 |
|------|------|----------------|
| 新增/编辑账户时直接写入 | 创建弹窗填「初始余额」或编辑弹窗改「余额」 | ❌ 无 |
| 记账产生 | 创建收入/支出/转账交易 | ✅ 有对应流水 |

**约定：**
1. **直接写入的余额视为"期初快照"**，不从交易记录推导。用户在首次使用时，编辑预设账户的余额来匹配真实资产。
2. **导出备份时，`accounts` 表携带当前 `balance` 值。**
3. **导入恢复时，全量覆盖 4 张表**（清空 → bulkAdd），不会尝试按交易重算余额。导入后各账户余额 = 导出时的余额快照。
4. **导入后如果余额不准确，用户可手动编辑调整。** 这是预期行为，不是 Bug。

**为什么不自劢按交易重算余额？** 因为余额可能通过直接编辑被修正过（比如修正浮点误差、补录历史调平），重算会丢失这些手动修正。保持手动余额优先级高于计算值是刻意的设计选择。

### 7.9 借入/借出款项记账规则 ⚠️ 重要约定

借入款项（`debt` 负债分组）和借出款项（`claim` 债权分组）在记账时有别于普通的收入和支出，**必须使用「转账」模式**，否则无法同时更新两个账户的余额。

| 场景 | 操作 | 转账方向 | 效果 | 常见误区 |
|------|------|---------|------|---------|
| **向别人借钱** | 借入 ¥1,000 到微信零钱 | from=**借入款项** → to=**微信零钱** | 零钱 +¥1,000 ✅ 负债 +¥1,000 ✅ | ❌ 选"收入"——只加了零钱，没记负债 |
| **还钱给朋友** | 微信零钱还款 ¥1,000 | from=**微信零钱** → to=**借入款项** | 零钱 -¥1,000 ✅ 负债 -¥1,000 ✅ | ❌ 选"支出"——只减了零钱，没消除负债 |
| **借给别人钱** | 微信零钱借出 ¥500 | from=**微信零钱** → to=**借出款项** | 零钱 -¥500 ✅ 债权 +¥500 ✅ | ❌ 选"支出"——债权不会被记录 |
| **别人还钱** | 朋友还款 ¥500 到零钱 | from=**借出款项** → to=**微信零钱** | 零钱 +¥500 ✅ 债权 -¥500 ✅ | ❌ 选"收入"——债权不会被清除 |

**核心原则：** 凡是涉及借贷的金钱往来，都要问自己"这笔钱同时影响哪两个账户？"如果答案是"一个是我的现金/银行卡，另一个是我的借款账户"，那就必须用**转账**。

### 7.10 房贷本金记账规则 ⚠️ 重要约定

"房贷本金"账户（`debt` 负债分组）记录你**欠银行的剩余房贷本金**。余额为负值（例如 -1,000,000 表示欠款 100 万）。

**首次拿到房贷（银行放贷 ¥1,000,000）：**
| 操作 | 转账方向 | 效果 |
|------|---------|------|
| 银行放贷到银行卡 | from=**房贷本金** → to=**银行卡** | 房贷本金 0→**-1,000,000** ✅ 负债增加 · 银行卡 0→**+1,000,000** ✅ 资金到账 |
| 买房付款（从银行卡支出） | 记一笔**支出**，分类="特别→购房" | 银行卡 -1,000,000 ✅ |

此时净资产卡片：总资产 0 · 总负债 100 万 · 净资产 -100 万。

**每月还月供（假设 ¥5,000 = ¥3,000 本金 + ¥2,000 利息）：**
月供必须**拆成两条独立记录**：

| 部分 | 记账方式 | 金额 | 效果 |
|------|---------|------|------|
| **利息 ¥2,000** | **支出** from=银行卡, 分类="居住" | 银行卡 **-2,000** ✅ | 费用已记录，不影响负债 |
| **本金 ¥3,000** | **转账** from=银行卡 → to=**房贷本金** | 银行卡 **-3,000** ✅ · 房贷本金 -1,000,000→**-997,000** ✅ | 负债减少 |

**为什么必须拆？** 利息是"费用"（钱真的花掉了），本金是"还债"（净资产在恢复）。合在一起记一笔支出的话，房贷本金永远不会更新，负债始终显示 100 万。

**核心原则：** 本金相关的资金流动（放贷、还本金）用**转账**关联到"房贷本金"账户；利息及相关费用用**支出**记入分类。

---

## 八、代码质量评估

### 8.1 优势 ✅

| 维度 | 评价 |
|------|------|
| **架构设计** | 关注点清晰分离：types/db/stores/pages/components/utils 层级明确，职责单一 |
| **TypeScript 覆盖** | 100% — 所有 .vue 和 .ts 文件均有完整类型定义，无 `any` 滥用 |
| **状态管理** | liveQuery + Pinia 的组合实现了 DB→UI 的实时推模式，无需手动刷新 |
| **金额安全** | 全应用统一以"分"存储，彻底规避 JS 浮点精度问题 |
| **事务完整性** | 所有写操作在 Dexie rw 事务内完成，余额和流水保持强一致 |
| **PWA 能力** | SW 自动更新 + manifest + navigator.storage.persist() 请求持久存储 |
| **组件内聚** | 8 个布局/业务/通用组件各司其职，无跨组件耦合 |
| **用户体验** | 保存提示气泡、最近使用记忆、智能日期标签、毛玻璃 UI 等细节到位 |
| **构建流程** | `npm run build` 强制 `vue-tsc --noEmit` 类型检查，构建即验证 |

### 8.2 已修复的问题

| 问题 | 修复方式 |
|------|----------|
| `DataCloneError` (tags 为 reactive) | IndexedDB 写入前 `[...tags.value]` 解包为普通数组 |
| `tx.title` 为 undefined 报错 | 搜索/渲染时 `(tx.title || '')` 安全回退 |
| 分/元转换不进位 | 统一使用 `Math.round(parseFloat(v) * 100)` |
| 键盘关闭后不提示保存 | 从 `@close` 事件改为 `watch(keyboardVisible)` |

### 8.3 可改进点 ⚠️

| 优先级 | 改进项 | 现状 | 建议 |
|--------|--------|------|------|
| **P0** | 周期记账自动执行 | 规则 UI 已完成，无自动执行逻辑 | 注册 `setInterval` 每日检查 `dayOfMonth`，匹配日自动创建交易 |
| **P0** | 测试覆盖度 | 零测试 | 至少为 transactionStore（余额冲正逻辑）和 format.ts 添加单元测试 |
| **P1** | Segment 页过大 | TransactionsPage ~850 行 | 拆分：详情 Sheet → `TransactionDetail.vue`，编辑 Sheet → `TransactionEdit.vue` |
| **P1** | SettingsPage 过重 | ~720 行，8 个功能区 | 每个功能区提取为独立组件 |
| **P1** | UnoCSS 未生效 | 已安装依赖且 `vite.config.ts` 注册了插件，但无 `uno.config.ts` | 添加 UnoCSS 配置以利用原子化 CSS |
| **P2** | 大交易量场景 | 全部交易一次性查询，无分页 | 考虑按月分批查询 + 虚拟滚动 |
| **P2** | 余额手动调整 | 只能通过交易记录间接修改 | 添加直接调整余额的功能 |
| **P2** | 分类/账户可编辑 | 无 UI 入口修改已有分类或账户 | 在设置页添加编辑功能 |
| **P2** | 交易批量操作 | 仅支持单条删除 | 无批量删除/移动账户 |
| **P3** | CI 配置 | 无 CI pipeline | 添加 GitHub Actions 自动构建+类型检查 |
| **P3** | Linter | 无 lint 配置 | 添加 ESLint + Prettier |
| **P3** | Import path 规范 | 混合 `@/` 别名和 `.vue` 后缀 | 统一使用 `@/` 路径别名 |

---

## 九、构建与部署

### 9.1 本地开发

```bash
npm install          # 安装依赖
npm run dev          # 启动 Vite 开发服务器 (默认 :5173)
```

### 9.2 生产构建

```bash
npm run build        # vue-tsc 类型检查 → vite build (PWA + 代码分割)
```

构建产物在 `dist/` 目录：
- 24 个 precache 条目 (~808 KiB)
- SW 自动注册 (`registerSW.js`)
- 代码分割为 23 个异步 chunk

### 9.3 预览构建产物

```bash
npm run preview      # 本地预览构建结果
```

### 9.4 PWA 配置

- **registerType**: `'autoUpdate'` — SW 检测到更新后自动接管
- **manifest**: 名称 "钱书"，standalone 模式，`#007aff` 主题色
- **缓存策略**: Workbox `generateSW` 模式，预缓存所有构建资源
- **离线支持**: 所有资源在首次访问时缓存，后续可完全离线使用

---

## 十、依赖图谱

```
money-book@1.0.0
├── vue@^3.4.0          [运行时]
│   ├── @vue/compiler-sfc
│   └── @vue/runtime-dom
├── vue-router@^4.3.0   [路由]
├── pinia@^2.1.0        [状态管理]
├── dexie@^3.2.0        [IndexedDB]
├── @vueuse/core@^10.7.0 [工具函数]
│   └── useBreakpoints
├── echarts@^5.5.0      [图表]
│   ├── 按需注册: bar/pie/grid/tooltip/legend
│   └── canvas 渲染器
└── vue-echarts@^7.0.0  [ECharts Vue 集成]

[devDependencies]
├── vite@^5.1.0         [构建]
│   ├── @vitejs/plugin-vue
│   ├── unocss@^0.58.0
│   └── vite-plugin-pwa@^0.19.0
├── vue-tsc@^2.0.0      [类型检查]
└── typescript@^5.3.0   [语言]
```

---

## 十一、设计约束与约定

### 11.1 编码规范

- **Composition API + `<script setup>`**：全项目统一，无 Options API 混用
- **命名**：camelCase 变量/函数，PascalCase 组件/类型，kebab-case CSS class
- **导入顺序**：Vue API → 第三方库 → 内部模块 → 样式
- **模板**：`v-for` 优先使用 `key`，避免同一元素上 `v-if` 与 `v-for` 混用

### 11.2 财务逻辑约定

| 规则 | 说明 |
|------|------|
| 支出减 fromAccount 余额，收入加 toAccount 余额 | `expense → fromAccount.balance -= amount` |
| 转账同时减 from、加 to | `from -= amount, to += amount` |
| 负债账户余额为负数 | `debt` 分组 balance ≤ 0 |
| 删除交易自动冲正 | `deleteTransaction` 内部调用 `reverseTransaction` |
| 单位统一为"分" | 所有 DB 字段、store 计算、内部传递均使用分 |

### 11.3 视觉约定

| 元素 | 颜色 / 样式 |
|------|-------------|
| 支出 | `#34c759` (iOS 绿色) |
| 收入 | `#ff3b30` (iOS 红色) |
| 转账 | `#007aff` (iOS 蓝色) |
| 背景 | `#f2f2f6` (iOS 系统灰色) |
| 卡片 | `rgba(255,255,255,0.8)` + `backdrop-filter: blur(10px)` |
| 字体 | Apple system font stack `-apple-system, BlinkMacSystemFont, ...` |
| 圆角 | 8px / 12px / 14px / 16px |
| 阴影 | 0 1-3px / 0 4-12px / 0 8-24px rgba(0,0,0, 0.08/0.1/0.12) |

---

## 十二、许可证

本项目为个人记账工具，仅供学习参考。