# 钱书「真玻璃景深」UI 结构重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已获批的「方向① 真玻璃景深」设计语言（brainstorm 预览 `direction1.html`）落地到真实业务页，核心是**结构增量**：加环境光背景层 + 承载面从平底抬成真玻璃浮层，而非换色。

**Architecture:** 三件结构性新增物，全站共享、逐页套用：
1. **环境光背景层**（`<AmbientBackdrop />`，fixed 全局一层，位于内容之后）——四团柔光斑 + 全场景底渐变，深浅主题各一套色。五页根背景从 `var(--surface)` 实底 → 透明，让光透出。
2. **真玻璃基元**（全局 `.glass` 工具类 + 恢复 `--glass-blur/--glass-highlight` 真实值）——`backdrop-filter: blur` 真实折射环境光，半透明白/墨"玻璃"底 + 发丝高光描边 + 柔和投影。这是相对旧版"假玻璃"（无光可折射 + `.liquid-sheen` 模拟高光）的关键差异。
3. **承载面→玻璃**：只把"承重的浮层"玻璃化——TabBar、结余/净资产卡、记账键盘/半屏分类面板、明细日分组卡、统计 hero 与卡片、账户行、通用弹层。说明性文字/大标题保持透明，让光透出。

**Tech Stack:** Vue 3 SFC + `<style scoped>`，CSS 变量 + `backdrop-filter`，Pinia stores 复用不动 script 逻辑。无单测框架，唯一验证门 = `npm run build`（`vue-tsc --noEmit && vite build`）+ `npm run dev` 目视。

**Spec:** `.superpowers/brainstorm/preview-20261126/content/direction1.html`（已获批的方向①设计预览，本计划的视觉权威来源）。本计划为纯前端展示性改动，不改任何 store / service / db / types。

## Global Constraints

- 只改 `<template>` 结构与 `<style>`，**绝不改动 `<script setup>` 业务逻辑**（记账、分页、统计聚合、CRUD、路由、PWA 全部保留）。
- 验收门 = `npm run build`（`vue-tsc --noEmit && vite build`）退出码 0；类型与模板引用（`TwemojiIcon`、组件、class）必须通过 vue-tsc。
- 深浅两主题都要做：环境光斑与玻璃透明度各一组色值。`html.dark` 由 `App.vue` 通过全局令牌切换，`<style scoped>` 用 `.dark` 属性选择器匹配根即可（现有页已按 `:root.dark` 变量走，页面样式用 `var(...)` 即可自适应，无需逐条写 `.dark`）。
- 新令牌必须加到 `src/styles/main.css` 的 `:root` 与 `:root.dark`，供所有 scoped 样式 `var()` 引用；不在单组件内各自硬编码一套。
- 玻璃只加在**承载面**，说明文字/大标题保持透明，维持"透明层级"设计基座——不允许把整页套一层玻璃。
- 环境光背景实现为独立 `<AmbientBackdrop />` 组件（fixed 一层），在 `MobileLayout.vue` 渲染一次；五页各自根背景改透明。**不要**在每页重复画光斑。

## Review Focus

以下输入类/失效模式是 spec 未明言、但真实用户使用时会遇到的，每条都归到持有该代码的任务，并加入该任务的验证步骤：

- **后台锁屏与弹层叠在玻璃上的可读性**：`PinDialog`、`ConfirmDialog`、`CommonBottomSheet`、`TransactionEdit` 等通用弹层自身用 `var(--color-sheet-bg)` 实底——若只改页面玻璃不动弹层，弹层会叠在一层模糊上仍为实底，观感割裂。→ 落在 Task 7，统一把弹层底改玻璃。
- **深色模式的玻璃透明度过低导致承载面与背景糊成一片**：暗色玻璃只有 `0.07` 不透明度，若背景光斑过暗、玻璃高光过弱，卡片会失去"浮起"感。→ Task 1 定值、Task 3-7 目视校验。
- **`--color-*` / `--color-card` 实底老令牌残留**：任务组 `Task 2-7` 改的组件若漏了 `var(--color-card)`/`var(--color-sheet-bg)` 实底引用，卡片仍是白实底，玻璃不生效。→ 每个任务 `grep` 本组件无残留实底令牌才完整。
- **backdrop-filter 对 fixed 环境光层的折射**：玻璃层必须真正位于 `AmbientBackdrop` 之上（z 序/后渲染），否则 blur 无内容可折射、显示为纯半透明。→ Task 1 布局断言 + 目视。
- **SMART/PWA 与滚动**：环境光层 `fixed inset:0` 不得拦截触控（pointer-events:none），不得影响 body 原生滚动（MobileLayout 注释依赖 window scroll）。→ Task 1。

## 文件结构

### 新增
- `src/components/layout/AmbientBackdrop.vue` — fixed 环境光背景层：全场景底渐变 + 四团柔光斑 `<i>`（读取全局 `--amb-*` 变量），`pointer-events:none`，渲染一次。
- `src/components/glass/GlassSurface.vue`（可选，若 `gl` 工具类不足以表达弹层差异化 → 用普通 div + `.glass` 即可，不强制建组件；计划默认**不建**，统一用 `.glass` 工具类）。

### 修改
- `src/styles/main.css` — `:root`/`:root.dark` 新增 `--amb-base/--amb-a..d`、`--glass-tint/--glass-border/--glass-saturate`，恢复 `--glass-blur/--glass-blur-weak/--glass-highlight/--glass-shadow` 为真实值；新增全局 `.glass` 工具类 + `.ambient-bg` 定位类。
- `src/components/layout/MobileLayout.vue` — 渲染 `<AmbientBackdrop />`；确保路由内容浮在其上。
- `src/components/layout/TabBar.vue` — 底 `var(--surface)` → `.glass` 玻璃底 + 顶部发丝线。
- `src/pages/booking/BookingPage.vue` — 根背景透明；结余说明/金额保持透明；键盘浮层、半屏分类面板、结算栏 `--accent` 实底 → 玻璃浮层。
- `src/pages/transactions/TransactionsPage.vue` — 根透明；日分组块/搜索条/日期栏 → 玻璃浮层（复用现有 `tx-day`/`tx-search` 结构加 `.glass`）。
- `src/pages/stats/StatsPage.vue` — 根透明；hero 与各 `st-block` → 玻璃浮层。
- `src/pages/accounts/AccountsPage.vue` — 根透明；净资产净卡与账户行 → 玻璃浮层。
- `src/pages/settings/SettingsPage.vue` — 根透明；`se-group` 分组容器 → 玻璃浮层。
- 通用弹层（`src/components/common/CommonBottomSheet.vue`、`ConfirmDialog.vue`、`PromptDialog.vue`、`PinDialog.vue`；`src/components/transactions/TransactionEdit.vue`）— sheet/卡底 `var(--color-sheet-bg)`/`var(--color-card)` → 玻璃。

### 不动（信息清楚起见）
- `src/pages/glass/`（含 `RedesignPreview.vue` 与 `rs/*`）— 预览沙盒，保持自包含不并入业务。
- `src/router/index.ts`、`src/App.vue`、stores、services、types、db、PWA。

## 任务

### Task 1: 全局玻璃令牌 + 环境光背景层 + 布局接入

**Files:**
- Modify: `src/styles/main.css`（`:root`、`:root.dark`、追加 `.glass`/`.ambient-bg`）
- Create: `src/components/layout/AmbientBackdrop.vue`
- Modify: `src/components/layout/MobileLayout.vue`

**Interfaces:**
- Consumes: 现有 `--surface/--ink/--ink2/--ink3/--line/--line-soft/--inc/--exp` 令牌已在 main.css 定义。
- Produces: 全局 CSS 变量名 `--amb-base`、`--amb-a/b/c/d`、`--glass-tint`、`--glass-border`、`--glass-blur`、`--glass-blur-weak`、`--glass-saturate`、`--glass-shadow`；全局工具类 `.glass`、`.ambient-bg`；`<AmbientBackdrop />` 组件（无 props，无 emit）。

- [ ] **Step 1: 在 `src/styles/main.css` 的 `:root` 追加令牌并定义 `.glass` / `.ambient-bg`**

浅色：
```
--amb-base: linear-gradient(155deg,#e9f4f1 0%,#e6eef9 45%,#f2edf9 100%);
--amb-a:#bfe9dc; --amb-b:#c4d7f6; --amb-c:#ead7f6; --amb-d:#ffe3d6;
--glass-tint: rgba(255,255,255,.5);
--glass-border: rgba(255,255,255,.78);
--glass-blur: 22px; --glass-blur-weak: 12px; --glass-saturate: 180%;
--glass-shadow: 0 18px 36px -20px rgba(40,60,110,.45), inset 0 0 0 .5px rgba(255,255,255,.5);
```
：root.dark：
```
--amb-base: linear-gradient(155deg,#0c1220 0%,#0a0c16 48%,#150d20 100%);
--amb-a:#0f4a44; --amb-b:#1c2f5a; --amb-c:#3a2560; --amb-d:#5a2d22;
--glass-tint: rgba(255,255,255,.07);
--glass-border: rgba(255,255,255,.14);
--glass-blur: 22px; --glass-blur-weak: 12px; --glass-saturate: 150%;
--glass-shadow: 0 18px 36px -20px rgba(0,0,0,.7), inset 0 0 0 .5px rgba(255,255,255,.12);
```
全局（放 `:root` 后、`*{}` 前）：
```
.glass{
  background: var(--glass-tint);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border:1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
.glass-weak{ -webkit-backdrop-filter: blur(var(--glass-blur-weak)) saturate(var(--glass-saturate)); backdrop-filter: blur(var(--glass-blur-weak)) saturate(var(--glass-saturate)); }
```
注意：原 main.css 里 `--glass-blur:0px`、`--glass-highlight:none` 等"纸感贬抑"值被 Task 1 覆盖为真实值；`--glass-highlight` 保留变量但此处不再被新 `.glass` 使用（老 `.glass-card` 组件走别处）。记 ledger。

- [ ] **Step 2: 创建 `src/components/layout/AmbientBackdrop.vue`**

一个 `<div class="ambient-bg">`，内放四个 `<i class="amb b-a">…b-d</i>` 光斑 + 一个 `.amb-base` 底。样式：
```
.ambient-bg{ position:fixed; inset:0; z-index:0; background:var(--amb-base); overflow:hidden; pointer-events:none; }
.ambient-bg .amb{ position:absolute; border-radius:50%; filter:blur(46px); opacity:.55; }
.ambient-bg .b-a{ width:230px;height:230px; background:var(--amb-a); top:-50px; left:-60px; }
.ambient-bg .b-b{ width:260px;height:260px; background:var(--amb-b); bottom:-70px; right:-70px; }
.ambient-bg .b-c{ width:150px;height:150px; background:var(--amb-c); top:38%; left:-30px; opacity:.4; }
.ambient-bg .b-d{ width:160px;height:160px; background:var(--amb-d); bottom:14%; right:-20px; opacity:.35; }
```
template 无内容文案。`<script setup lang="ts">` 空。

- [ ] **Step 3: 在 `MobileLayout.vue` 渲染 `<AmbientBackdrop />` 并调整布局**

template 改为：
```
<div class="mobile-layout">
  <AmbientBackdrop />
  <main class="mobile-content"><router-view /></main>
  <TabBar />
</div>
```
`.mobile-content{ position:relative; z-index:1; }`（保证浮在环境光层之上、玻璃可折射）；`.mobile-layout` 保留 min-height。import 并在 `<script setup>` 引入。此步不动现有滚动/触控逻辑。

- [ ] **Step 4: 验证**

Run：`npm run build`
Expected：退出码 0（vue-tsc 通过、vite 构建成功）。
目视（`npm run dev`，浏览器）：背景为浅色柔光渐变 + 四团模糊光斑，无任何页面时可见；滚动页面时背景层不随内容滚动（fixed）；点击/触摸背景空白处可穿透到页面（无拦截）。

- [ ] **Step 5: Commit**

```bash
git add src/styles/main.css src/components/layout/AmbientBackdrop.vue src/components/layout/MobileLayout.vue
git commit -m "feat(ui): 环境光背景层 + 真玻璃令牌（方向①基座）"
```

### Task 2: TabBar → 玻璃导航

**Files:**
- Modify: `src/components/layout/TabBar.vue`

**Interfaces:**
- Consumes: Task 1 的 `.glass` 工具类、`--glass-border`。
- Produces: 无新接口。

- [ ] **Step 1: 改 `.tab-bar` 实底 → 玻璃**

现有 `.tab-bar { background: var(--surface); border-top: 1px solid var(--line-soft); }` → 在元素 class 加 `.glass`，`background` 由 `.glass` 提供；`border-top` 改为 `1px solid var(--glass-border)`；保留 `position:fixed; bottom:0; height;z-index:100` 不变。Table 上侧加发丝高光：`box-shadow: 0 -1px 0 rgba(255,255,255,.6) inset`（浅色）/ 移交给 `.glass` 已有 inset 高光。

- [ ] **Step 2: 验证**

Run：`grep -n "background: var(--surface)" src/components/layout/TabBar.vue`（应无输出——实底已清除）。
Run：`npm run build`
Expected：退出码 0。目视：底部导航为半透明磨砂、能看到下方滚动内容被模糊，三个 tab 状态与记账 FAB、保存桥功能不受影响。

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/TabBar.vue
git commit -m "feat(ui): 底部导航玻璃化"
```

### Task 3: 记账页 → 环境光 + 玻璃承载面

**Files:**
- Modify: `src/pages/booking/BookingPage.vue`

**Interfaces:**
- Consumes: Task 1 令牌/`.glass`；现有 `bk-*` 结构与全部 script 逻辑。
- Produces: 无新接口。

- [ ] **Step 1: 根背景透明**

`.bk { background: var(--surface); }` → 去掉实底（或 `background: transparent`）。`bk-screen` 滚动区保留。

- [ ] **Step 2: 承载面玻璃化**
- `.bk-amount-zone`（全屏大金额）——保持透明（说明文字+金额浮在光上，不加玻璃）。
- 底部浮层 `.bk-sheet`（半屏分类面板）与 `.bk-kb-inner`（键盘浮层）——`background: var(--surface)` → `.glass`（加玻璃浮层），保留圆角与上滑过渡。
- `.bk-commit` 结算栏——目前 `--accent` 实底。改为玻璃浮层 + `--inc`/`--exp` 金额仍显色；`.off` 禁用态保留。注意提交栏语义是主操作，玻璃底 + `--ink` 文字即可（对照方向①预览的键盘"玻璃+OK"态）。
- `.bk-undo`、`.bk-mode-tag`、`.bk-dt-picker`、`.bk-tpl`、`.bk-tile` 等轻控件：可留轻实底（`--act-bg`）或改 `.glass-weak`，任选一致即可；**重点是浮层类改为真玻璃**。

- [ ] **Step 3: 验证**

Run：`grep -n "background: var(--surface)" src/pages/booking/BookingPage.vue`（承载面应无实底残留；轻控件用 `--act-bg` 不算残留）。
Run：`npm run build`
Expected：退出码 0。目视：记账页背景透出光斑；点金额弹数字键盘时键盘为磨砂玻璃浮层、能看到下方分类网格被模糊；收支转滑动切换、保存、模板、周期规则全部正常。

- [ ] **Step 4: Commit**

```bash
git add src/pages/booking/BookingPage.vue
git commit -m "feat(ui): 记账页玻璃化（键盘/分类面板/结算栏浮层）"
```

### Task 4: 明细页 → 玻璃分组卡

**Files:**
- Modify: `src/pages/transactions/TransactionsPage.vue`

**Interfaces:**
- Consumes: Task 1 令牌/`.glass`；现有 `tx-*`/`tx-day` 结构与分页/筛选 script。
- Produces: 无新接口。

- [ ] **Step 1: 根透明**

`.transactions-page { background: var(--surface); }` → 透明。

- [ ] **Step 2: 日分组卡玻璃化**

`tx-content`/`tx-list` 内每 `div.tx-day` → 加 `.glass`（磨砂玻璃分组卡，内嵌 `TransactionItem` 行仍透明只留分隔线）。`tx-day-label` 日期行保持略透明层级（可半透明灰）。搜索条 `tx-search-inner` 与日期栏 `tx-datebar-inner` → `.glass`. 头部 `tx-head` 大标题保持透明。`FilterChips`（子组件）不动（其为透明 chip）、`EmptyState` 不动。

- [ ] **Step 3: 验证**

Run：`grep -n "background: var(--surface)" src/pages/transactions/TransactionsPage.vue`（应为空）。
Run：`npm run build`
Expected：退出码 0。目视：流水按日分组成磨砂卡片、卡片内行分隔线清晰；搜索/日期栏玻璃浮层；无限滚动、分页筛选、详情/编辑弹窗正常。注意 `TransactionDetail`/`TransactionEdit` 弹窗属 Task 7。

- [ ] **Step 4: Commit**

```bash
git add src/pages/transactions/TransactionsPage.vue
git commit -m "feat(ui): 明细页日分组玻璃化"
```

### Task 5: 统计页 → 玻璃 hero 与卡片

**Files:**
- Modify: `src/pages/stats/StatsPage.vue`

**Interfaces:**
- Consumes: Task 1 令牌/`.glass`；现有 `st-*` 结构与统计 script（chart option 已用 `--color-*` 读色，保留）。
- Produces: 无新接口。

- [ ] **Step 1: 根透明**

`.stats-page { background: var(--surface); }` → 透明。

- [ ] **Step 2: hero 与块玻璃化**

`.st-hero`（本期支出大数字）→ `.glass`（玻璃卡，金额 `c-exp` 仍显色）；`.st-period`、`.st-period--custom` → `.glass-weak` 或保留；各 `.st-block`（趋势/构成/排行/高频/大额/标签）→ `.glass` 容器。内部 `st-rank-row` 行保留分隔线透明。图表 `v-chart`（echart）背景要求透明，`backgroundColor:'transparent'` 已设，直接在玻璃卡内渲染即可。

- [ ] **Step 3: 验证**

Run：`grep -n "background: var(--surface)" src/pages/stats/StatsPage.vue`（应为空）。
Run：`npm run build`
Expected：退出码 0。目视：统计各分析块为磨砂玻璃卡、图表在其上清晰；周/月/年/自选切换、排行点击跳转明细、环比/同比、屏蔽车贷房贷全部正常。

- [ ] **Step 4: Commit**

```bash
git add src/pages/stats/StatsPage.vue
git commit -m "feat(ui): 统计页玻璃化（hero与卡片）"
```

### Task 6: 资产页 → 玻璃净卡与账户行

**Files:**
- Modify: `src/pages/accounts/AccountsPage.vue`

**Interfaces:**
- Consumes: Task 1 令牌/`.glass`；现有 `ac-*` 结构与 CRUD script。
- Produces: 无新接口。

- [ ] **Step 1: 根透明**

`.accounts-page { background: var(--surface); }` → 透明。

- [ ] **Step 2: 净资产净卡与账户行玻璃化**

`.ac-net`（净资产大数字）→ `.glass`；账户行 `.ac-row` → `.ac-row` 每个加 `.glass`（磨砂玻璃行，行内 icon/名称/金额仍透明）。头部 `ac-head` 大标题透明。`ac-del` 删除按钮 `--exp` 保留。

- [ ] **Step 3: 验证**

Run：`grep -n "background: var(--surface)" src/pages/accounts/AccountsPage.vue`（应为空）。
Run：`npm run build`
Expected：退出码 0。目视：净资产玻璃净卡 + 玻璃账户卡堆叠、能见轻微折射；新增/编辑/删除资产弹窗（`CommonBottomSheet`，属 Task 7）正常。

- [ ] **Step 4: Commit**

```bash
git add src/pages/accounts/AccountsPage.vue
git commit -m "feat(ui): 资产页净资产与账户行玻璃化"
```

### Task 7: 设置页 + 通用弹层 → 玻璃

**Files:**
- Modify: `src/pages/settings/SettingsPage.vue`
- Modify: `src/components/common/CommonBottomSheet.vue`
- Modify: `src/components/common/ConfirmDialog.vue`
- Modify: `src/components/common/PromptDialog.vue`
- Modify: `src/components/common/PinDialog.vue`
- Modify: `src/components/transactions/TransactionEdit.vue`

**Interfaces:**
- Consumes: Task 1 令牌/`.glass`；现有 `se-*` 结构、弹层 `--color-sheet-bg`/`--color-card` 引用。
- Produces: 无新接口。

- [ ] **Step 1: 设置页根透明 + 分组玻璃化**

`.settings-page { background: var(--surface); }` → 透明。`se-title` 透明。`se-group` 容器 → 为整组一个 `.glass` 容器（含若干 `se-row`），`se-row` 内分隔线保留、不要逐行玻璃。

- [ ] **Step 2: 通用弹层底 → 玻璃**

凡 `background: var(--color-sheet-bg)` 或 `background: var(--glass-highlight), var(--color-sheet-bg)` 的 sheet/卡底 → 改 `.glass` 或 `background: var(--glass-tint); backdrop-filter:...`。涉及：`CommonBottomSheet`、`ConfirmDialog`、`PromptDialog`、`PinDialog`（PIN 锁屏层保持高不透明防透过金额——可用较高 `--glass-tint` 或保留实底，目视确认金额不可透过）、`TransactionEdit`。`PromptDialog` 里 `background: var(--color-surface)` 的输入框注：输入框保持实底以可读，只改外层 sheet。

- [ ] **Step 3: 验证**

Run：`grep -rn "var(--color-sheet-bg)\|var(--color-card)" src/components/common/CommonBottomSheet.vue src/components/common/ConfirmDialog.vue src/components/common/PromptDialog.vue src/components/common/PinDialog.vue src/components/transactions/TransactionEdit.vue src/pages/settings/SettingsPage.vue`（sheet/卡底残留应清除或经 Ruling 豁免，输入框 `--color-surface` 除外）。
Run：`npm run build`
Expected：退出码 0。目视：设置分组为磨砂玻璃组；各类弹窗/锁屏/编辑窗为玻璃浮层；**PIN 锁屏层不可透过看到金额**；导入导出、销毁、分类/标签/模板/规则管理器打开均正常。

- [ ] **Step 4: Commit**

```bash
git add src/pages/settings/SettingsPage.vue src/components/common/CommonBottomSheet.vue src/components/common/ConfirmDialog.vue src/components/common/PromptDialog.vue src/components/common/PinDialog.vue src/components/transactions/TransactionEdit.vue
git commit -m "feat(ui): 设置页与通用弹层玻璃化"
```

## 执行后自检

- `git log --oneline`：可见 7 条有序提交，覆盖全部任务。
- `git diff HEAD --stat`：确认改动集中在 main.css、AmbientBackdrop、MobileLayout、TabBar、五页、通用弹层；`src/pages/glass/` 未动。
- 全量重建一次 `npm run build` 退出码 0；`npm run dev` 深浅两主题目视一遍。
- 确认无任何 `<script setup>` / store / service / db 被改动。