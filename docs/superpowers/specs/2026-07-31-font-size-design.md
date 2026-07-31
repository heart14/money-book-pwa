# 字号大小可调功能设计规范

> 日期: 2026-07-31
> 状态: 待实现

## 1. 概述

为"钱书" PWA 添加用户可调节的字号大小功能，提供 5 档文字大小选择（很小/小/中/大/特大），所有字号通过 CSS 变量令牌体系实现，与深色模式采用相同的架构模式。

## 2. 字号令牌体系

### 2.1 令牌定义（7 个语义令牌）

| 令牌 | 默认值（中档） | 用途场景 |
|---|---|---|
| `--fs-micro` | 10px | 标签、小提示、金额下方的标签 |
| `--fs-small` | 12px | 副标题、描述文字、下拉菜单文本 |
| `--fs-ui` | 13px | Chip、筛选按钮、模式切换按钮 |
| `--fs-body` | 14px | 正文、列表行内容、输入框文字（最常用） |
| `--fs-title` | 15px | Section 标题、列表项标题、日期标签 |
| `--fs-amount` | 16px | 金额显示、Tab 标签文字 |
| `--fs-heading` | 17px | 弹窗标题、页面 header 标题 |
| `--fs-hero` | 18–24px | 净资产大号数字、大图标标签 |

### 2.2 5 档缩放方案

| 档位 | 缩放比例 | `<html>` class | 说明 |
|---|---|---|---|
| 很小 | 0.80× | `font-xs` | 极紧凑 |
| 小 | 0.90× | `font-sm` | 紧凑 |
| **中** | **1.00×** | **无（默认）** | **基准** |
| 大 | 1.15× | `font-lg` | 宽松 |
| 特大 | 1.30× | `font-xl` | 阅读友好 |

### 2.3 各档位变量值对照表

| 令牌 | xs (0.80×) | sm (0.90×) | md (1.00×) | lg (1.15×) | xl (1.30×) |
|---|---|---|---|---|---|
| `--fs-micro` | 8px | 9px | 10px | 12px | 13px |
| `--fs-small` | 10px | 11px | 12px | 14px | 16px |
| `--fs-ui` | 10px | 12px | 13px | 15px | 17px |
| `--fs-body` | 11px | 13px | 14px | 16px | 18px |
| `--fs-title` | 12px | 14px | 15px | 17px | 20px |
| `--fs-amount` | 13px | 14px | 16px | 18px | 21px |
| `--fs-heading` | 14px | 15px | 17px | 20px | 22px |
| `--fs-hero` | 16px | 18px | 20px | 23px | 26px |

### 2.4 不缩放的元素

以下字号不受 `font-*` class 影响，始终保持固定大小：
- 内联 SVG 图标尺寸（`width`/`height`）
- Emoji 图标的 `font-size`
- ECharts 图表内文字（由图表 option 单独控制）
- `font-size` 在第三方库作用的范围内

## 3. 架构设计

### 3.1 数据层（uiStore.ts）

在 `uiStore` 中新增：

```typescript
export type FontSizeLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// state
const fontSize = ref<FontSizeLevel>(
  (localStorage.getItem('fontSize') as FontSizeLevel) || 'md'
)

// action
function setFontSize(level: FontSizeLevel) {
  fontSize.value = level
  localStorage.setItem('fontSize', level)
}
```

### 3.2 应用层（App.vue）

在现有 `applyTheme()` 同级新增 `applyFontSize()`：

```typescript
function applyFontSize() {
  const html = document.documentElement
  const level = uiStore.fontSize
  // 清除所有字号 class
  html.classList.remove('font-xs', 'font-sm', 'font-lg', 'font-xl')
  if (level !== 'md') html.classList.add(`font-${level}`)
}
```

在 `onMounted` 中调用，并 `watch(uiStore.fontSize, applyFontSize)`。

### 3.3 样式层（main.css）

在 `:root` 和 `:root.dark` 同级增加字号 class：

```css
/* 字号档位 */
:root { /* md */ ... }
:root.font-xs { ... }
:root.font-sm { ... }
:root.font-lg { ... }
:root.font-xl { ... }
```

与 `:root.dark` 完全正交——可同时存在 `:root.dark.font-lg`。

### 3.4 设置页（SettingsPage.vue）

在"外观"区段，theme 切换器下方新增"文字大小"行：

- 标题："文字大小"
- 5 个紧凑排列的选项按钮（"很小/小/中/大/特大"）
- 选中态：`--color-primary` 背景 + 白色文字
- 默认"中"高亮

交互逻辑：
1. 用户点击任一档位 → `uiStore.setFontSize(level)` → Store 更新 → `watch` 触发 → `applyFontSize()` 切换 `html` class → 全页面字号即时变化
2. 页面刷新时，`localStorage` 恢复上次选择

## 4. 迁移策略

### 4.1 迁移范围

- **209 处** `font-size: Xpx` 硬编码，分布在 **~31 个 .vue 文件**的 `<style scoped>` 中
- **0 处** 内联 style 字号
- **0 处** JS/TS 中的字号
- **0 处** ECharts option 中的字号馈

### 4.2 映射规则

| 当前 px | 替换为 |
|---|---|
| `font-size: 10px` | `font-size: var(--fs-micro)` |
| `font-size: 12px` | `font-size: var(--fs-small)` |
| `font-size: 13px` | `font-size: var(--fs-ui)` |
| `font-size: 14px` | `font-size: var(--fs-body)` |
| `font-size: 15px` | `font-size: var(--fs-title)` |
| `font-size: 16px` | `font-size: var(--fs-amount)` |
| `font-size: 17px` | `font-size: var(--fs-heading)` |
| `font-size: 18px ~ 24px` | `font-size: var(--fs-hero)` |

### 4.3 执行计划

与深色模式迁移相同的分批并行模式：

1. **批次 1**（5 个核心文件）：`main.css` + `uiStore.ts` + `App.vue` + `SettingsPage.vue` → 构建验证
2. **批次 2**（7 个设置页文件）：`AccountManager` / `CategoryManager` / `TagManager` / `RuleManager` / `QuickTemplateManager` / `SecurityLock` / `SettingsPage`(已含)
3. **批次 3**（4 个页面 + 组件）：`TransactionsPage` + `TransactionItem` / `FilterChips` / `TransactionDetail` / `TransactionEdit`
4. **批次 4**（记账 + 账户）：`BookingPage` + `ModeSwitch` / `CategoryPicker` / `NumberKeyboard` / `AccountsPage` + `AccountGroup` / `NetWorthCard`
5. **批次 5**（统计 + 通用 + Layout）：`StatsPage` + `ExpenseChart` + `TabBar` + `PinDialog` / `ConfirmDialog` / `PromptDialog` / `CommonBottomSheet` / `EmptyState` / `PullToRefresh`
6. **最终验证**：`npm run build` 全量构建

### 4.4 无需处理的文件

- `src/types/index.ts` — 纯类型，无字号
- `src/db/` — 数据层，无字号
- `src/utils/` — 工具函数（format / crypto / biometric / export），无字号
- `src/composables/useLiveQuery.ts` — 无字号
- `src/main.ts` — 无字号
- `src/env.d.ts` — 无字号

## 5. 测试清单

- [ ] 设置页切换 5 档字号，页面所有文字正确缩放
- [ ] 切换深色模式后切换字号，两者正交正常工作
- [ ] 刷新页面后字号保留上次选择
- [ ] 极小字号（xs）下无文字溢出/截断
- [ ] 特大字号（xl）下无布局错位
- [ ] 记录类型金额符号（-/+/无）与字号一致
- [ ] TabBar 按钮图标大小不受影响
- [ ] 构建通过（`npm run build`）

## 6. 约束

- **不修改布局间距**：`padding`、`margin`、`width`、`height` 保持不变，仅缩放文字
- **不修改 ECharts 图表内部字号**：图表字体由 option 独立控制，不在本次范围
- **不变号 emoji 大小**：分类图标的 `font-size` 保持不变
- **兼容已有 CSS 变量体系**：字号变量与颜色变量 `--color-*` 并列存在于 `:root`
- **与深色模式正交**：支持 `:root.dark.font-lg` 等组合