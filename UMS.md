# UMS Code — 项目上下文 (金钱账簿 / Money Book)

## 项目概述

**钱书 (Money Book)** — 本地优先、零后端依赖的个人记账 PWA。

| 属性 | 值 |
|------|-----|
| 技术栈 | Vue 3 + TypeScript (Composition API + `<script setup>`) |
| 构建工具 | Vite 5 |
| 样式方案 | UnoCSS + 手写 CSS 变量 (iOS 设计语言) |
| 数据库 | Dexie.js 3 (IndexedDB 封装) — 5 张表 |
| 状态管理 | Pinia 2 — 3 个 Store |
| 路由 | Vue Router 4 — 6 条路由, 所有页面组件懒加载 |
| PWA | vite-plugin-pwa (autoUpdate) — SW + manifest + 离线缓存 |
| 图表 | ECharts 5 + vue-echarts (按需注册) |
| 工具库 | @vueuse/core (useBreakpoints 做响应式适配) |
| 安全 | Web Crypto API (SHA-256) PIN 码本地哈希 |
| 金额精度 | 分 (cents) 为整数单位存储, 避免浮点误差 |
| 目标平台 | 移动端 (≤768px) + 桌面端 (>768px) |

## 快速命令

```bash
npm install          # 安装依赖
npm run dev          # 启动 Vite 开发服务器 (默认 :5173)
npm run build        # vue-tsc 类型检查 → vite build (PWA + 代码分割)
npm run preview      # 本地预览构建产物
```

## 目录结构

```
src/
├── main.ts                     # 入口: mount App、Pinia、Router、seed 种子数据
├── App.vue                     # 根组件: 按屏幕宽度渲染 MobileLayout / DesktopLayout
├── env.d.ts                    # 环境类型声明
├── types/index.ts              # TypeScript 类型定义 (5 个接口)
├── db/
│   ├── index.ts                # Dexie 数据库定义 (moneybook, v3, 5 张表)
│   └── seed.ts                 # 首次启动幂等植入预设账户和分类
├── router/index.ts             # 6 条路由, 全部懒加载
├── stores/
│   ├── accountStore.ts         # 账户列表 (liveQuery) + CRUD
│   ├── categoryStore.ts        # 分类列表 (liveQuery) + CRUD
│   └── transactionStore.ts     # 交易 CRUD + 标签同步
├── composables/
│   └── useLiveQuery.ts         # Dexie liveQuery → Vue ref 封装
├── utils/
│   ├── format.ts               # 金额/日期格式化
│   ├── export.ts               # JSON 导入/导出/数据彻底销毁
│   ├── crypto.ts               # SHA-256 PIN 哈希 + localStorage 存取
│   └── echarts-setup.ts        # ECharts 按需注册
├── styles/main.css             # 全局 CSS 变量 + reset
├── pages/
│   ├── booking/BookingPage.vue       # 记账页 (核心交互)
│   ├── transactions/TransactionsPage.vue  # 明细页 (~850 行, 最复杂)
│   ├── accounts/AccountsPage.vue     # 账户总览
│   ├── accounts/AccountDetailPage.vue # 单账户流水详情
│   ├── stats/StatsPage.vue           # 统计页 (ECharts)
│   └── settings/SettingsPage.vue     # 设置页 (~720 行)
├── components/
│   ├── layout/        # MobileLayout, DesktopLayout, TabBar, Sidebar
│   ├── booking/       # ModeSwitch, NumberKeyboard, CategoryPicker
│   ├── transactions/  # TransactionItem, FilterChips
│   ├── accounts/      # NetWorthCard, AccountGroup
│   ├── stats/         # ExpenseChart
│   └── common/        # EmptyState, PinDialog
```

## 数据库 (Dexie.js / IndexedDB)

数据库名: `moneybook` (当前版本 v3)

| 表名 | 主键/索引 | 说明 |
|------|-----------|------|
| `accounts` | `++id, name` | 账户 (10 个预设) |
| `categories` | `++id, type, parentId` | 分类 (两级: 父分类 + 子分类) |
| `transactions` | `++id, type, date, categoryId` | 交易流水 |
| `recurringRules` | `++id, enabled, dayOfMonth` | 周期记账规则 (UI 已完成, 自动执行未实现) |
| `tags` | `++id, &name` | 标签 (唯一索引) |

## 核心类型 (src/types/index.ts)

```typescript
interface Account {
  id?: number; name: string; balance: number; icon: string; sort: number
}
interface Category {
  id?: number; type: 'expense' | 'income' | 'transfer'; parentId: number | null;
  name: string; icon: string; sort: number
}
interface Transaction {
  id?: number; type: 'expense' | 'income' | 'transfer'; title: string;
  amount: number; categoryId: number | null; tags: string[];
  note: string; date: string; time: string
}
interface Tag { id?: number; name: string }
interface RecurringRule {
  id?: number; type: 'expense' | 'income'; title: string; amount: number;
  categoryId: number | null; tags: string[]; note: string;
  dayOfMonth: number; enabled: boolean; lastExecuted: string | null
}
```

## 路由表

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | → 重定向到 `/booking` | 默认首页 |
| `/booking` | BookingPage | 核心记账 |
| `/transactions` | TransactionsPage | 流水列表/筛选/详情 |
| `/accounts` | AccountsPage | 净资产 + 所有账户 |
| `/stats` | StatsPage | 收入/支出/趋势/构成图表 |
| `/settings` | SettingsPage | PIN/数据管理 |

## 开发约定

### 编码规范
- **Composition API + `<script setup>`**: 全项目统一, 无 Options API
- **命名**: camelCase 变量/函数, PascalCase 组件/类型, kebab-case CSS class
- **导入顺序**: Vue API → 第三方库 → 内部模块 (使用 `@/` 别名)
- **模板**: `v-for` 必须使用 `key`, 避免 `v-if` 与 `v-for` 混用同一元素

### 金额约定
- **所有金额以"分"存储**: DB、store、内部传递均使用整数分
- **输入**: `Math.round(parseFloat(v) * 100)` 元→分
- **显示**: `formatCurrency(n)` 分→ `¥1,234.00`
- **编辑**: 分÷100 显示, 保存时 `Math.round(yuan * 100)` 转回

### 响应式适配
- 移动端 (≤768px): 底部 TabBar 导航, 单列布局, safe-area-inset-bottom
- 桌面端 (>768px): 左侧 160px 固定 Sidebar 导航
- 使用 `@vueuse/core` 的 `useBreakpoints({ mobile: 768 }).smaller('mobile')`

### 视觉约定
- 支出绿 `#34c759`, 收入红 `#ff3b30`, 转账蓝 `#007aff`
- 背景 `#f2f2f6`, 卡片 `rgba(255,255,255,0.8)` + `backdrop-filter: blur(10px)`
- iOS system font stack, 圆角 8-16px, 三级阴影

### 交易与余额一致性
- 所有写操作使用 Dexie 读写事务 `db.transaction('rw', ...)`
- `addTransaction`: 写流水 → 更新余额
- `deleteTransaction`: 反向冲正余额 → 删除流水

### 账户删除保护
- 已有流水的账户禁止删除 (需先处理关联交易)

## 已知问题 / 待改进

| 优先级 | 问题 | 说明 |
|--------|------|------|
| P0 | 周期记账自动执行 | 规则 UI 已完成但无定时执行逻辑 |
| P0 | 零测试覆盖 | 建议为 transactionStore 和 format.ts 添加测试 |
| P1 | TransactionsPage ~850 行 | 建议拆分详情/编辑 Sheet 为独立组件 |
| P1 | SettingsPage ~720 行 | 建议每个功能区提取为独立组件 |
| P1 | UnoCSS 未生效 | 已安装依赖但缺少 `uno.config.ts` 配置 |
| P2 | 大交易量下无分页 | 全部交易一次性查询 |
| P2 | 余额手动编辑 | 只能通过交易间接修改余额 |
| P2 | 分类/账户无编辑入口 | 设置页缺少编辑已有分类或账户的功能 |

## 重要财务规则

### 借贷记账
- **借入/借出必须使用"转账"模式**, 不能使用收入/支出
- 借入: from=借入款项 → to=现金账户 (同时增加负债和现金)
- 还钱: from=现金账户 → to=借入款项 (同时减少现金和负债)

### 房贷记账
- 月供必须拆成两条: 利息(支出) + 本金(转账到房贷本金账户)
- 房贷本金放款: from=房贷本金 → to=银行卡 (转账)
- 房贷本金还款: from=银行卡 → to=房贷本金 (转账)

## 数据流模式

```
IndexedDB (Dexie)
  → liveQuery() Observable
    → Pinia Store (watchEffect + subscribe)
      → ref / computed 响应式更新
        → Vue Template 自动重新渲染
```

### Pinia Stores

| Store | 职责 | 数据来源 |
|-------|------|---------|
| `accountStore` | 账户列表 + CRUD | liveQuery 订阅全部账户 |
| `categoryStore` | 分类列表 + CRUD | liveQuery 订阅全部分类 |
| `transactionStore` | 交易 CRUD + 标签同步 | 无状态, 不缓存全部数据 |