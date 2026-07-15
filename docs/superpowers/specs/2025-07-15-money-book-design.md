# 《钱书》V1.0 架构设计文档

> 基于 PRD 梳理后形成的最终设计方案，2025-07-15 评审通过。

---

## 1. 技术栈确认

| 模块 | 选型 | 职责 |
|:---|:---|:---|
| 框架 | Vue 3 (Composition API + TypeScript) | 响应式 UI 与业务逻辑组合 |
| 构建 | Vite | 极速开发服务器与生产打包 |
| UI 库 | Vant 4 | 移动端组件（重点：NumberKeyboard、Tabbar、Dialog） |
| 数据库 | Dexie.js | IndexedDB 封装，提供 liveQuery |
| 图表 | ECharts（按需引入） | 统计页大盘图表 |
| 状态管理 | Pinia | 内存态缓存 + 派生计算 |
| 路由 | Vue Router 4 | 4 页面路由 + 账户详情子路由 |
| PWA | vite-plugin-pwa | Service Worker 生成、离线缓存 manifests |
| 工具库 | @vueuse/core | useObservable、useBreakpoints 等 |

---

## 2. 项目目录结构

```
money-book-pwa/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── favicon.svg
│   ├── logo-192.png
│   └── logo-512.png
├── src/
│   ├── main.ts                    # 入口：注册 Vant、Router、Pinia
│   ├── App.vue                    # 根组件：响应式布局容器
│   ├── router/
│   │   └── index.ts               # 路由配置
│   ├── stores/
│   │   ├── accountStore.ts        # 账户状态（列表、分组树、选中项）
│   │   ├── categoryStore.ts       # 分类状态（分类树、拿铁因子标记、隐藏）
│   │   └── transactionStore.ts    # 流水状态（当前列表、筛选、分页）
│   ├── composables/
│   │   ├── useAccounts.ts         # 账户 CRUD + liveQuery
│   │   ├── useTransactions.ts     # 流水 CRUD + 事务一致性
│   │   ├── useCategories.ts       # 分类查询
│   │   ├── useStats.ts            # 统计聚合计算
│   │   ├── useValidationEngine.ts # 智能防错引擎
│   │   └── usePinLock.ts          # PIN 安全锁逻辑
│   ├── db/
│   │   ├── index.ts               # Dexie 实例 + 表结构 + 索引
│   │   └── seed.ts                # 预设数据（账户 + 分类）
│   ├── pages/
│   │   ├── booking/
│   │   │   └── BookingPage.vue    # 极速记账页
│   │   ├── accounts/
│   │   │   ├── AccountsPage.vue   # 账户中心列表
│   │   │   └── AccountDetail.vue  # 账户详情
│   │   ├── stats/
│   │   │   └── StatsPage.vue      # 统计分析页
│   │   └── settings/
│   │       ├── SettingsPage.vue   # 设置主页
│   │       ├── SecurityLock.vue   # PIN 设置/修改
│   │       └── DataManagement.vue # 导出/导入/销毁
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MobileLayout.vue   # 移动端底部 Tab
│   │   │   └── DesktopLayout.vue  # 桌面端侧边栏
│   │   ├── booking/
│   │   │   ├── NumberKeyboard.vue # 数字键盘
│   │   │   ├── CategoryPicker.vue # 两级宫格分类选择器
│   │   │   ├── ModeSwitch.vue     # 支出/收入/转账滑动切换
│   │   │   └── TransferPanel.vue  # 转账模式面板（双账户选择）
│   │   ├── accounts/
│   │   │   ├── NetWorthCard.vue   # 净资产大盘 + 月度趋势
│   │   │   ├── AccountGroup.vue   # 账户分组列表（四种类型）
│   │   │   └── MemberChip.vue     # 小荷包成员筛选 Chip
│   │   ├── stats/
│   │   │   ├── MonthlyChart.vue   # 月度收支柱状图
│   │   │   ├── PieChart.vue       # 一级分类支出饼图
│   │   │   ├── LatteFactorCard.vue# 拿铁因子吞噬机洞察卡
│   │   │   └── HousingCostCard.vue# 真实居住成本洞察卡
│   │   └── common/
│   │       ├── PinDialog.vue      # PIN 输入弹窗
│   │       └── EmptyState.vue     # 空状态占位
│   ├── utils/
│   │   ├── crypto.ts              # PIN 加盐哈希
│   │   ├── export.ts              # JSON 导出/导入
│   │   └── format.ts              # 金额、日期格式化
│   └── types/
│       └── index.ts               # 全局 TypeScript 类型定义
```

---

## 3. 路由设计

| 路径 | 页面组件 | 导航方式(移动) | 导航方式(桌面) |
|:---|---|:---|:---|
| `/` | BookingPage | 底部 Tab | 侧边栏点击 |
| `/accounts` | AccountsPage | 底部 Tab | 侧边栏点击 |
| `/accounts/:id` | AccountDetail | push 跳转 | 右侧内容区切换 |
| `/stats` | StatsPage | 底部 Tab | 侧边栏点击 |
| `/settings` | SettingsPage | 底部 Tab | 侧边栏点击 |
| `/settings/security` | SecurityLock | push 跳转 | 右侧内容区切换 |
| `/settings/data` | DataManagement | push 跳转 | 右侧内容区切换 |

---

## 4. 数据流架构

### 4.1 响应式数据流

```
Dexie (IndexedDB)
  │  liveQuery() 订阅表变化
  ▼
composables (useXxx.ts)
  │  useObservable() → Ref<T>
  ▼
Pinia Stores (内存态缓存 + 派生 computed)
  │  storeToRefs() 解构
  ▼
Vue 组件 (Template + ECharts)
```

**关键原则**: Dexie 始终是唯一真实数据源。Pinia 只做缓存和派生计算，不做写操作。写操作统一通过 composables 调用 Dexie。

### 4.2 事务一致性

所有涉及金额变动的操作强制使用 `db.transaction`：

```typescript
// useTransactions.ts - addTransaction()
async function addTransaction(tx: NewTransaction) {
  await db.transaction('rw', [db.transactions, db.accounts], async () => {
    // 1. 写入流水
    const id = await db.transactions.add(tx)
    // 2. 更新转出账户余额
    if (tx.fromAccountId) {
      await db.accounts.update(tx.fromAccountId, {
        balance: new Decimal(account.balance).minus(tx.amount).toNumber()
      })
    }
    // 3. 更新转入账户余额（转账/收入场景）
    if (tx.toAccountId) {
      await db.accounts.update(tx.toAccountId, ...)
    }
  })
}
```

---

## 5. 响应式布局方案

- **断点**: 768px（`useBreakpoints({ mobile: 768 })`）
- **移动端 (<=768px)**: `MobileLayout` — 底部 Vant Tabbar + 全屏页面 + 全屏数字键盘
- **桌面端 (>768px)**: `DesktopLayout` — 左侧 240px 侧边栏 + 右侧看板区域
- **记账弹窗(桌面)**: 点击记账按钮，弹出 Vant Dialog/Popup 内嵌输入面板
- **两套 Layout 在 `App.vue` 中通过 `v-if` 切换，路由出口复用**

---

## 6. 智能防错引擎（核心交互规则）

### 规则 1：流转隔离

```
如果: 转出账户类型 = liquid AND 转入账户类型 = debt
那么: 强制锁定为"转账"模式，隐藏分类选择器
场景: 还信用卡、还借入款项
```

### 规则 2：小荷包成员标签

```
如果: 转出/转入任一账户 isCommon (小荷包)
那么: 自动展开成员 Chip 选择器（"我" / "伴侣"），必选
```

### 规则 3：信用卡支出允许

```
如果: 支出模式下 fromAccount 类型 = debt (信用卡)
那么: 允许，正常显示分类选择器
场景: 刷信用卡消费，体现真实负债增加
```

### 规则 4：转账经费分类隔离

```
如果: mode = transfer
那么: categoryId 必须为 null（不在流水表中记录分类）
```

---

## 7. 统计聚合逻辑

所有统计采用内存聚合（`filter` + `reduce`），不依赖 SQL GROUP BY。

### 7.1 月度图表

```typescript
// 伪代码
const monthlyStats = computed(() => {
  const byMonth = groupBy(filter(transactions, byCurrentMonth), 'type')
  return {
    expense: sumBy(byMonth.expense, 'amount'),
    income: sumBy(byMonth.income, 'amount'),
    byCategory: groupBy(byMonth.expense, 'categoryId')
  }
})
```

### 7.2 深度洞察卡

| 洞察卡 | 数据源 | 聚合规则 |
|:---|---|:---|
| 真实居住成本 | 支出流水 | `filter(二级分类 ∈ {房租房贷, 生活缴费})` + 关联的公积金扣款流水 |
| 拿铁因子吞噬机 | 支出流水 | `filter(二级分类.isLatteFactor === true)` 汇总，按 5% 年化算复利 |

### 7.3 标签聚合

遍历 `transactions` 表的 `tags: string[]` 字段，按标签名分组汇总金额。

---

## 8. 数据库设计

### 8.1 表结构

```typescript
// db/index.ts
import Dexie from 'dexie'

export const db = new Dexie('MoneyBookDB')

db.version(1).stores({
  accounts: '++id, groupId, name, type, icon, balance, isCommon, sort',
  categories: '++id, type, parentId, name, icon, attribute, isLatteFactor, isHidden, sort',
  transactions: '++id, type, amount, fromAccountId, toAccountId, categoryId, tags, note, date, createdAt',
})
```

### 8.2 流水类型规则

| type | fromAccountId | toAccountId | categoryId |
|:---|---|---|---|
| expense | 支付账户 | null | 支出分类 ID |
| income | null | 收款账户 | 收入分类 ID |
| transfer | 转出账户 | 转入账户 | null |

---

## 9. PWA 配置

| 特性 | 实现方式 |
|:---|---|
| 离线缓存 | vite-plugin-pwa 自动生成 SW，静态资源 CacheFirst |
| 应用安装 | manifest.json → display: standalone |
| 持久化 | navigator.storage.persist() 首次加载调用 |
| 安全锁 | App 启动 / visibilitychange → 前台 → PINDialog |
| 数据导出 | 序列化 IndexedDB → Blob → 下载 .json |
| 数据导入 | 读取 JSON → 事务覆盖写入 |
| 彻底销毁 | db.delete() → caches.delete() → unregister SW |

---

## 10. PIN 安全锁设计

- **存储**: `localStorage`，加盐 SHA-256 哈希，不存明文
- **密保重置**: 设置 PIN 时预设 1 个密保问题 + 答案（答案同样哈希存储）
- **触发时机**: App 启动 + `document.visibilityState` 从 `hidden` 切回 `visible`
- **锁定阈值**: 连续 5 次 PIN 错误，锁定 60 秒

---

## 11. 预设数据初始化

首次启动自动写入 PRD 第 4 章全部预设数据：

- 9 个预设账户（分 4 组）
- 32+ 个支出分类（8 个一级 + 二级）
- 8 个收入分类（3 个一级 + 二级）
- 默认拿铁因子标记：虚拟消费

---

## 12. 决策记录

| 序号 | 决策项 | 结论 |
|:---|:---|---|
| 1 | 架构方案 | 方案 A — 按模块分页 + 共享 composables |
| 2 | 数据流 | Dexie liveQuery → composables → Pinia（缓存）→ Vue 组件 |
| 3 | 响应式 | 移动端底部 Tab / 桌面端侧边栏，双 Layout 组件切换 |
| 4 | PIN 找回策略 | 密保问题找回（1 个问题 + 哈希答案） |
| 5 | 周期记账 | V1.0 仅做定时提醒通知，不做自动入账 |
| 6 | 预设初始化 | 首次启动自动写入全部预设数据 |
| 7 | 桌面端 | V1.0 同时覆盖移动端和桌面端 |