# 字号可调功能 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为用户提供 5 档字号可调能力，全字号通过 CSS 变量体系实现，与深色模式使用同一架构模式。

**Architecture:** 定义 8 个字号变量（`--fs-micro`~`--fs-hero`）+ 额外 3 个大号量变量，在 `:root.font-{xs/sm/lg/xl}` 中覆盖各档位值。`uiStore` 管理档位状态 + `localStorage` 持久化，`App.vue` 通过切换 `html` class 全局生效。

**Tech Stack:** Vue 3 + TypeScript + CSS Variables

## Global Constraints

- **零后端依赖** — 所有状态仅 browser localStorage
- **不修改布局间距** — padding/margin/width/height 不随字号变化
- **Emoji 图标字号不变** — `.row-icon`、`.category-icon`、`.sheet-icon`、empty state emoji 等 font-size 保持固定（16-18px 档）
- **NumberKeyboard 按钮字号不变** — 键盘按钮 22-24px 保持固定
- **构建通过** — `npm run build`（vue-tsc + vite）
- **与深色模式正交** — 支持 `:root.dark.font-lg` 等组合

---
## 文件结构

### 新增文件
- 无（全部修改现有文件）

### 修改文件（5 个核心 + 26 个迁移文件 = 31 个）

**核心文件（5 个）：**
- `src/styles/main.css` — 新增字号变量定义 + 5 档覆盖
- `src/stores/uiStore.ts` — 新增 `fontSize` ref + `setFontSize()` + 持久化
- `src/App.vue` — 新增 `applyFontSize()` 应用逻辑
- `src/pages/settings/SettingsPage.vue` — 外观区段新增字号选择器
- `src/types/index.ts` — 新增 `FontSizeLevel` 类型（可选，或内联在 uiStore）

**迁移文件（26 个 .vue）：**

| 批次 | 文件 |
|---|---|
| 批次 2 | `src/pages/settings/AccountManager.vue`、`CategoryManager.vue`、`TagManager.vue`、`RuleManager.vue`、`QuickTemplateManager.vue`、`SecurityLock.vue` |
| 批次 3 | `src/pages/transactions/TransactionsPage.vue`、`TransactionItem.vue`、`FilterChips.vue`、`TransactionDetail.vue`、`TransactionEdit.vue` |
| 批次 4 | `src/pages/booking/BookingPage.vue`、`ModeSwitch.vue`、`CategoryPicker.vue`、`NumberKeyboard.vue`、`src/pages/accounts/AccountsPage.vue`、`AccountGroup.vue`、`NetWorthCard.vue` |
| 批次 5 | `src/pages/stats/StatsPage.vue`、`ExpenseChart.vue`、`src/components/layout/TabBar.vue`、`src/components/common/PinDialog.vue`、`ConfirmDialog.vue`、`PromptDialog.vue`、`CommonBottomSheet.vue`、`EmptyState.vue`、`PullToRefresh.vue` |

---

### Task 1: 字号变量定义 + Store + App.vue + 设置页

**Files:**
- Modify: `src/styles/main.css`
- Modify: `src/stores/uiStore.ts`
- Modify: `src/App.vue`
- Modify: `src/pages/settings/SettingsPage.vue`

**Interfaces:**
- Consumes: theme system architecture pattern from dark mode (same class-swapping approach)
- Produces: `FontSizeLevel` type, `uiStore.fontSize` + `setFontSize()`, CSS vars in `:root.font-*`

- [ ] **Step 1: 在 main.css 添加字号变量定义**

在 `:root` 块末尾添加默认字号令牌：

```css
/* ── 字号令牌（5档字号：xs/sm/md(默认)/lg/xl） ── */
:root {
  --fs-micro: 10px;
  --fs-small: 12px;
  --fs-ui:    13px;
  --fs-body:  14px;
  --fs-title: 15px;
  --fs-amount:16px;
  --fs-heading:17px;
  --fs-hero:  20px;
  --fs-page-title: 27px;
  --fs-amount-lg: 34px;
  --fs-amount-xl: 60px;
}

:root.font-xs {
  --fs-micro: 8px;  --fs-small: 10px;  --fs-ui: 10px;
  --fs-body: 11px;  --fs-title: 12px;  --fs-amount: 13px;
  --fs-heading: 14px; --fs-hero: 16px; --fs-page-title: 22px;
  --fs-amount-lg: 27px; --fs-amount-xl: 48px;
}

:root.font-sm {
  --fs-micro: 9px;  --fs-small: 11px;  --fs-ui: 12px;
  --fs-body: 13px;  --fs-title: 14px;  --fs-amount: 14px;
  --fs-heading: 15px; --fs-hero: 18px; --fs-page-title: 24px;
  --fs-amount-lg: 31px; --fs-amount-xl: 54px;
}

:root.font-lg {
  --fs-micro: 12px; --fs-small: 14px;  --fs-ui: 15px;
  --fs-body: 16px;  --fs-title: 17px;  --fs-amount: 18px;
  --fs-heading: 20px; --fs-hero: 23px; --fs-page-title: 31px;
  --fs-amount-lg: 39px; --fs-amount-xl: 69px;
}

:root.font-xl {
  --fs-micro: 13px; --fs-small: 16px;  --fs-ui: 17px;
  --fs-body: 18px;  --fs-title: 20px;  --fs-amount: 21px;
  --fs-heading: 22px; --fs-hero: 26px; --fs-page-title: 35px;
  --fs-amount-lg: 44px; --fs-amount-xl: 78px;
}
```

- [ ] **Step 2: 在 uiStore.ts 添加 fontSize 状态**

在 `ThemeMode` 后新增：

```typescript
export type FontSizeLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
```

在 theme 持久化代码附近新增：

```typescript
// ── Font size state ──
const fontSize = ref<FontSizeLevel>((localStorage.getItem('fontSize') as FontSizeLevel) || 'md')

function setFontSize(level: FontSizeLevel) {
  fontSize.value = level
  localStorage.setItem('fontSize', level)
}
```

在 return 中添加 `fontSize` 和 `setFontSize`。

移除 `watch` 导入（如果之前已去除则无需操作）。

- [ ] **Step 3: 在 App.vue 添加 applyFontSize()**

在 `applyTheme()` 同级新增：

```typescript
function applyFontSize() {
  const html = document.documentElement
  html.classList.remove('font-xs', 'font-sm', 'font-lg', 'font-xl')
  const level = uiStore.fontSize
  if (level !== 'md') html.classList.add(`font-${level}`)
}
```

在 `onMounted` 中 `applyTheme()` 后调用 `applyFontSize()`。

在 watch 中添加 `watch(uiStore.fontSize, applyFontSize)`。

- [ ] **Step 4: 在 SettingsPage.vue 添加字号选择器**

在"外观"区段 theme-toggle 下方，添加"文字大小"行。使用与 theme-toggle 相同的三段式选择器 UI 风格，但提供 5 个选项。

在 `template` 中 theme-toggle 之后加入：

```html
<div class="setting-row">
  <span class="setting-label">文字大小</span>
  <div class="theme-toggle">
    <button
      v-for="opt in fontSizeOptions" :key="opt.value"
      class="theme-btn" :class="{ active: uiStore.fontSize === opt.value }"
      @click="uiStore.setFontSize(opt.value)"
    >{{ opt.label }}</button>
  </div>
</div>
```

在 `<script>` 中添加：

```typescript
const fontSizeOptions = [
  { label: '很小', value: 'xs' as const },
  { label: '小', value: 'sm' as const },
  { label: '中', value: 'md' as const },
  { label: '大', value: 'lg' as const },
  { label: '特大', value: 'xl' as const },
]
```

5 个按钮在移动端可能会溢出，设置 `font-size: 11px` + 灵活 `flex` 分配。

- [ ] **Step 5: 构建验证**

```bash
npm run build
```

验证：类型检查通过 + vite build 成功。

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: 添加字号可调功能核心（CSS变量+Store+App+设置页）"
```

---

### Task 2: 设置页 6 个管理子组件的字号迁移

**Files:**
- Modify: `src/pages/settings/AccountManager.vue`
- Modify: `src/pages/settings/CategoryManager.vue`
- Modify: `src/pages/settings/TagManager.vue`
- Modify: `src/pages/settings/RuleManager.vue`
- Modify: `src/pages/settings/QuickTemplateManager.vue`
- Modify: `src/pages/settings/SecurityLock.vue`

**Interfaces:**
- Consumes: `--fs-*` CSS variables defined in Task 1
- Produces: All `font-size: Xpx` in these 6 files → `var(--fs-xxx)`

**Mapping rules (apply to ALL migration tasks):**

| Current px | Replace with | Notes |
|---|---|---|
| 10px | `var(--fs-micro)` | 标签、小提示 |
| 12px | `var(--fs-small)` | 描述、副标题、类型标签 |
| 13px | `var(--fs-ui)` | Chip、状态文字 |
| 14px | `var(--fs-body)` | 正文、列表行、输入框、按钮文字 |
| 15px | `var(--fs-title)` | Section 标题、列表项标题、input |
| 16px | `var(--fs-amount)` | 金额显示、按钮文字 |
| 17px | `var(--fs-heading)` | Dialog 标题 |
| 18px | `var(--fs-hero)` | 仅用于**文本**（非图标）场景 |
| 20px | `var(--fs-hero)` | |
| 27px | `var(--fs-page-title)` | 页面标题 |

**DO NOT change:**
- `.row-icon` 或任何用于 emoji 图标的 `font-size: 18px` 或 `font-size: 16px`
- `.category-icon` 的 `font-size: 16px`
- `.drag-handle` 的 `font-size: 16px`（图标）
- Number keyboard 按钮的 `22px`、`24px`

- [ ] **Step 1: 逐个文件替换硬编码字号**

对每个文件：
1. 读取完整 `<style scoped>` 区域
2. 对每个 `font-size: Xpx`，判断是否应该替换
3. 使用 `edit()` 替换。可以提供较大上下文确保唯一匹配

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: 设置页6个管理子组件字号迁移"
```

---

### Task 3: 明细页 5 个组件的字号迁移

**Files:**
- Modify: `src/pages/transactions/TransactionsPage.vue`
- Modify: `src/components/transactions/TransactionItem.vue`
- Modify: `src/components/transactions/FilterChips.vue`
- Modify: `src/components/transactions/TransactionDetail.vue`
- Modify: `src/components/transactions/TransactionEdit.vue`

- [ ] **Step 1: 逐个文件替换**

同 Task 2 的映射规则。特别注意：
- `TransactionItem.vue:97` (`.item-icon`) → `font-size: 18px` 是图标背景装饰，**不替换**
- `TransactionDetail.vue:230` (`.sheet-icon`) → `font-size: 28px` 是 emoji，**不替换**
- `TransactionEdit.vue:156` → 检查是否为图标，若是则 **不替换**

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: 明细页5个组件字号迁移"
```

---

### Task 4: 记账页 + 账户页 7 个组件的字号迁移

**Files:**
- Modify: `src/pages/booking/BookingPage.vue`
- Modify: `src/components/booking/ModeSwitch.vue`
- Modify: `src/components/booking/CategoryPicker.vue`
- Modify: `src/components/booking/NumberKeyboard.vue`
- Modify: `src/pages/accounts/AccountsPage.vue`
- Modify: `src/components/accounts/AccountGroup.vue`
- Modify: `src/components/accounts/NetWorthCard.vue`

**Special cases:**
- `BookingPage.vue:445` → `font-size: 60px` 输入金额 → `var(--fs-amount-xl)`
- `NumberKeyboard.vue:120` → `font-size: 22px` 键盘按钮 → **不替换**
- `NumberKeyboard.vue:156` → `font-size: 24px` 键盘按钮 → **不替换**
- `CategoryPicker.vue:160` → `font-size: 22px` 分类图标 → **不替换**
- `AccountsPage.vue:231` → `font-size: 34px` 净资产 → `var(--fs-amount-lg)`
- `AccountsPage.vue:268` → `font-size: 22px` 总资产标签 → `var(--fs-hero)`
- `AccountsPage.vue:187` → `font-size: 27px` → `var(--fs-page-title)`
- `NetWorthCard.vue:43` → `font-size: 34px` → `var(--fs-amount-lg)`
- `NetWorthCard.vue:69` → `font-size: 15px` → `var(--fs-title)`
- `NetWorthCard.vue:37` → `font-size: 13px` → `var(--fs-ui)`

- [ ] **Step 1: 逐个文件替换**

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: 记账页+账户页7个组件字号迁移"
```

---

### Task 5: 统计页 + Layout + 通用组件 8 个文件的字号迁移

**Files:**
- Modify: `src/pages/stats/StatsPage.vue`
- Modify: `src/components/stats/ExpenseChart.vue`
- Modify: `src/components/layout/TabBar.vue`
- Modify: `src/components/common/PinDialog.vue`
- Modify: `src/components/common/ConfirmDialog.vue`
- Modify: `src/components/common/PromptDialog.vue`
- Modify: `src/components/common/CommonBottomSheet.vue`
- Modify: `src/components/common/EmptyState.vue`
- Modify: `src/components/common/PullToRefresh.vue`

**Special cases:**
- `EmptyState.vue:27` → `font-size: 48px` emoji → **不替换**
- `PinDialog.vue:126` → `font-size: 18px` 圆点装饰 → **不替换**
- `CommonBottomSheet.vue:67` → `font-size: 18px` 拖拽条 → **不替换**
- `ConfirmDialog.vue:79` → `font-size: 17px` 标题 → `var(--fs-heading)`

- [ ] **Step 1: 逐个文件替换**

- [ ] **Step 2: 最终全量构建验证**

```bash
npm run build
```

Expected: 零错误、零类型警告、零 lint 问题。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: 统计页+Layout+通用组件字号迁移，完成全量迁移"
```

---

## Spec 对照检查

| Spec 需求 | Task | 状态 |
|---|---|---|
| main.css 字母令牌 + 5 档值 | Task 1 Step 1 | ✅ |
| uiStore.ts fontSize + setFontSize + localStorage | Task 1 Step 2 | ✅ |
| App.vue applyFontSize + watch | Task 1 Step 3 | ✅ |
| SettingsPage.vue 5 档选择器 | Task 1 Step 4 | ✅ |
| 设置页 6 管理组件迁移 | Task 2 | ✅ |
| 明细页 5 组件迁移 | Task 3 | ✅ |
| 记账+账户页 7 组件迁移 | Task 4 | ✅ |
| 统计+Layout+通用 9 组件迁移 | Task 5 | ✅ |
| 全量构建通过 | Task 5 Step 2 | ✅ |
| 不变 emoji 图标字号 | 各任务 DO NOT change | ✅ |
| 不变布局间距 | 各任务只改 font-size | ✅ |
| 与深色模式正交 | main.css 中 `:root.dark.font-lg` | ✅ |