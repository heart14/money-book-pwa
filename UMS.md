# 钱书 (Money Book) PWA 开发规范

本项目是一个**本地优先、零后端依赖**的个人记账 PWA（Progressive Web App），所有数据存储在浏览器 IndexedDB 中，无需任何服务器。

---

## 项目技术栈

| 类别 | 技术 |
|------|------|
| **核心框架** | Vue 3 (Composition API + `<script setup>`) |
| **语言** | TypeScript (strict mode) |
| **构建工具** | Vite 5 |
| **路由** | Vue Router 4 (createWebHistory) |
| **状态管理** | Pinia |
| **本地数据库** | Dexie.js (IndexedDB 封装) |
| **样式方案** | UnoCSS + 全局 CSS |
| **图表** | ECharts 5 + vue-echarts |
| **工具库** | VueUse, Dexie |
| **PWA** | vite-plugin-pwa (autoUpdate, standalone display) |
| **类型检查** | vue-tsc |
| **安全** | Web Crypto API (SHA-256), WebAuthn API (生物识别) |
| **响应式** | 纯移动端设计，固定为 MobileLayout |

---

## 构建与运行

```bash
# 安装依赖
npm install

# 本地开发（支持局域网访问）
npm run dev          # → vite --host

# 生产构建（含类型检查）
npm run build        # → vue-tsc --noEmit && vite build

# 预览构建结果
npm run preview      # → vite preview
```

### Node.js 版本要求

参见 `.nvmrc` — Node.js 20。

---

## 项目代码结构

```
money-book-pwa/
├── .env                    # 环境变量
├── .nvmrc                  # Node.js 版本
├── index.html              # 入口 HTML
├── package.json            # 依赖和脚本
├── vite.config.ts          # Vite 配置（PWA + UnoCSS + @ 别名）
├── tsconfig.json           # TypeScript 配置（strict, @/* 路径别名）
├── tsconfig.node.json      # Node 端 TS 配置
│
├── src/                    # 源代码
│   ├── main.ts             # 应用入口（Pinia + Router + UnoCSS + 种子数据）
│   ├── App.vue             # 根组件（PIN 锁定层 + 自适应 Mobile/Desktop 布局）
│   ├── env.d.ts            # 类型声明（*.vue 模块 + vite/client）
│   │
│   ├── router/             # 路由配置
│   │   └── index.ts        # 5 条路由: /booking, /transactions, /accounts, /stats, /settings
│   │
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts        # Account, Category, Transaction, Tag, RecurringRule
│   │
│   ├── db/                 # IndexedDB 数据层 (Dexie.js)
│   │   ├── index.ts        # MoneyBookDB 定义（版本迁移，复合索引）
│   │   └── seed.ts         # 初始化预设数据（账户 + 多级分类）
│   │
│   ├── stores/             # Pinia 状态仓库
│   │   ├── uiStore.ts      # UI 状态：PIN 锁定、记账模式、金额/分类
│   │   ├── transactionStore.ts  # 交易 CRUD + liveQuery + 版本号
│   │   ├── accountStore.ts      # 账户管理 + 总资产计算
│   │   └── categoryStore.ts     # 分类管理 + 层级过滤
│   │
│   ├── composables/        # 共享 Composable
│   │   └── useLiveQuery.ts # Dexie liveQuery → Vue ref 封装
│   │
│   ├── utils/              # 工具函数
│   │   ├── crypto.ts       # PIN SHA-256 哈希 (Web Crypto API + fallback)
│   │   ├── biometric.ts    # WebAuthn 生物识别注册/认证/发现
│   │   ├── format.ts       # 金额/日期/数字格式化
│   │   ├── export.ts       # 全量数据 JSON 导入/导出
│   │   └── echarts-setup.ts# ECharts 全局注册
│   │
│   ├── styles/             # 全局样式
│   │   └── main.css        # iOS 风格设计令牌（CSS 变量）+ 全局重置
│   │
│   ├── pages/              # 路由页面
│   │   ├── booking/        #   记账页
│   │   ├── transactions/   #   明细/流水页
│   │   ├── accounts/       #   账户页
│   │   ├── stats/          #   统计页
│   │   └── settings/       #   设置页（账号/分类/标签/PIN/生物识别/规则/管理）
│   │
│   └── components/         # 可复用组件（按功能模块组织）
│       ├── common/         #   通用组件（PinDialog, ConfirmDialog, EmptyState, PullToRefresh, CommonBottomSheet）
│       ├── layout/         #   布局组件（MobileLayout, TabBar）
│       ├── booking/        #   记账组件（CategoryPicker, ModeSwitch, NumberKeyboard）
│       ├── transactions/   #   明细组件（TransactionItem, TransactionDetail, TransactionEdit, FilterChips）
│       ├── accounts/       #   账户组件（AccountGroup, NetWorthCard）
│       └── stats/          #   统计组件（ExpenseChart）
│
├── docs/                   # 设计文档
│   ├── security_design.md  # PIN + WebAuthn 安全验证方案设计（467 行）
│   ├── trans_design.md     # 明细页游标分页 + 懒加载方案设计（496 行）
│   ├── preview/            # UI 预览资源
│   └── superpowers/        # AI 辅助设计记录
│
├── public/                 # 公共静态资源
│   ├── favicon.svg         # 网站图标
│   ├── _headers            # Cloudflare Headers
│   └── _redirects          # Cloudflare Redirects
│
└── dist/                   # 构建产物
```

---

## 开发约定

### 1. 编码风格

- **Vue 3 + TS + `<script setup>`**：所有组件使用 Composition API 和 `<script setup lang="ts">`
- **Pinia 函数式写法**：Store 统一使用 `defineStore('name', () => { ... })` 函数式范型
- **严格模式 TypeScript**：`tsconfig.json` 开启了 `strict: true`
- **路径别名**：`@` 映射到 `./src`（如 `@/types`, `@/db`, `@/stores/uiStore`）

### 2. 数据层约定

- **Dexie DB 版本管理**：`src/db/index.ts` 中通过 `this.version(n).stores(...)` 管理 schema 版本，每次变更需要编写 `.upgrade()` 迁移函数
- **复合索引**：游标分页场景需要合适的复合索引（如 `[date+id]`）
- **liveQuery**：Dexie 的 `liveQuery` 通过 `useLiveQuery` composable 封装成 Vue ref，用于数据响应
- **种子数据**：首次启动在 `main.ts` 中调用 `seedData()` 初始化预设账户和分类

### 3. 安全约定

- **PIN 码**：6 位数字 PIN，通过 `Web Crypto API SHA-256` 哈希后存储在 `localStorage`
- **生物识别**：基于 WebAuthn `platform authenticator`（Face ID / Touch ID / Windows Hello）
- **PIN 为根基**：生物识别不可独立存在，关闭 PIN 时必须同步关闭生物识别
- **优雅降级**：生物识别不可用时自动回退到 PIN 输入
- **切后台锁屏**：`document.visibilitychange` 事件监听，切到后台自动锁定

### 4. UI/UX 约定

- **纯移动端**：固定使用 MobileLayout（TabBar 底部导航 + router-view），不再支持桌面宽屏布局
- **iOS 风格**：CSS 变量定义的 iOS 设计语言（SF font stack, frosted glass card, iOS colors）
- **记账模式**：`expense | income | transfer` 三种模式，通过 `uiStore.bookingMode` 管理
- **金额存储**：所有金额以 **分（cent）** 为单位存储（整数），`format.ts` 提供货币格式化

### 5. 路由约定

| 路径 | 名称 | 页面 |
|------|------|------|
| `/` | — | 重定向到 `/booking` |
| `/booking` | booking | 记账页 |
| `/transactions` | transactions | 明细页 |
| `/accounts` | accounts | 账户页 |
| `/stats` | stats | 统计页 |
| `/settings` | settings | 设置页 |

### 6. 设置页面模块

`src/pages/settings/` 包含以下子页面：
- `SecurityLock.vue` — PIN + 生物识别安全设置
- `AccountManager.vue` — 账户管理
- `CategoryManager.vue` — 分类管理
- `TagManager.vue` — 标签管理
- `RuleManager.vue` — 周期规则管理

---

## 关键设计文档

| 文档 | 说明 |
|------|------|
| `docs/security_design.md` | PIN + WebAuthn 安全验证方案（467 行） |
| `docs/trans_design.md` | 明细页游标分页 + 懒加载方案（496 行） |

---

## 约束

- **零后端依赖**：禁止引入任何服务端依赖，所有数据仅在本地 IndexedDB 中
- **兼容现有版本**：新增功能需兼容 Dexie v3/v4 schema 迁移
- **金额以分为单位**：所有金额字段存储整数（分），避免浮点精度问题
- **敏感数据本地处理**：PIN 哈希、生物识别凭证均在浏览器本地，不上传
- **注释规范**：核心函数/业务逻辑必须有清晰的注释
- **异常处理**：所有异步操作必须有 `.catch()` 或 `try-catch` 处理
- **避免 N+1 查询**：IndexedDB 查询注意批量操作，参考 `seed.ts` 中的 `bulkAdd` + `allKeys` 优化