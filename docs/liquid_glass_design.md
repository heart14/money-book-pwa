# 钱书 Liquid Glass（液态玻璃）视觉方案设计

> 更新日期：2026-09-29
> 状态：批次 A/B/C 已落地 → 待真机验证；已通过一轮代码评审并完成修复。入口 demo：`/glass`（`src/pages/glass/GlassDemoPage.vue`）

---

## 一、概述与目标

在钱书 PWA 中引入基于 **iOS 26 液态玻璃（Liquid Glass）** 设计语言的统一视觉皮肤。其核心不是"给卡片加一个背景模糊"，而是把整个界面拆成 **三层**，让内容"浮"在一层连续玻璃之下，玻璃再折射底下的彩色环境：

```
┌─────────────────────────────────────────────┐
│  Layer 3  光效层   全局镜面高光 sheen（跟随指针）│
│  Layer 2  玻璃层   TabBar / 卡片 / 弹窗 / 按钮    │
│  Layer 1  环境层   fixed 全屏彩色渐变光斑背景     │
└─────────────────────────────────────────────┘
```

### 目标

| 目标 | 说明 |
|------|------|
| **令牌化** | 所有玻璃外观均由 CSS 设计令牌驱动，避免各组件写死，可整体调参 |
| **可回退** | 通过切换令牌即可在"液态玻璃"与"当前扁平"之间往返，风险低 |
| **分批落地** | 分为 A / B / C 三批，每批完成可独立验证观感与性能 |
| **一直开启** | 跟随深浅色始终开启，不做独立开关（用户决策） |
| **性能兜底** | 低配/不支持 `backdrop-filter` 时优雅降级 |

### 非目标

- 不做 DevTools 之外的 OpenGL 级真实物理折射（浏览器 CSS 无法 100% 复刻 Apple 的 GPU 折射），目标是 90%+ 的视觉观感。
- 不在 `--color-bg` 上做文章（它被大量"实体面"如弹窗主体、按钮、输入框引用，改动风险高）。

---

## 二、分层策略

### Layer 1 · 环境层（批次 A）

- 新增令牌 `--color-app-bg`：多层 `radial-gradient` 彩色光斑 + 底线性渐变（浅色/深色各一套）。
- `html/body/#app` 与各**页面根容器**使用 `--color-app-bg`，作为卡片 blur 的"折射源"。
- 页面根不再使用不透明 `--color-bg`（会把环境完全盖住）。

### Layer 2 · 玻璃层（批次 A/B）

- 复用现有 `--color-card` 半透明卡片管线（已有 `backdrop-filter: blur(10px)`），将其**透明度调低**（浅色更透、深色略透），叠加环境背景后即呈现玻璃。
- `.glass-card` 增强：描边、顶部渐变高光、柔和投影。
- TabBar（批次 A）：半透明白 + `blur + saturate` + 顶部细光边。
- 弹窗 / 底部抽屉 / PIN 键盘 / 记账悬浮按钮 / 图表卡（批次 B）：逐个套用玻璃材质。

### Layer 3 · 光效层（批次 C）

- 全局 pointer 追踪 composable（App 根绑定一次，将 `--gx/--gy` 写到统一容器），卡片 `::after` 引用父级变量显示镜面高光，避免每卡各自监听。
- 移动端无 hover：触摸时短暂点亮，松手淡出。
- 点击涟漪 / 滚动光。

---

## 三、设计令牌规范（`src/styles/main.css`）

所有组件应引用令牌，不写死。下面为规范基准（浅色；深色另行覆盖）。

| 令牌 | 规划值（浅色示意） | 用途 |
|------|------|------|
| `--color-app-bg` | 多层 radial/linear 渐变 | 环境背景（折射源） |
| `--color-card`（调整） | `rgba(255,255,255,0.55)` | 卡片/行玻璃底色 |
| `--color-tabbar-bg`（调整） | `rgba(255,255,255,0.6)` | TabBar 玻璃底色 |
| `--glass-blur` | `20px` | 玻璃模糊强度 |
| `--glass-blur-weak` | `12px` | 长滚动列表弱模糊 |
| `--glass-saturate` | `180%` | 玻璃色彩饱和度 |
| `--glass-border` | `rgba(255,255,255,0.55)` | 玻璃描边 |
| `--glass-highlight` | 顶部次高光渐变（伪元素） | 体积感 |
| `--glass-shadow` | 柔和投影 | 层级 |

> 深色环境用更低饱和度、更暗的底色；深色卡片透明度略高（`≈0.7`）以保证文字对比度。

---

## 四、批次清单

### 批次 A（已完成）—— 打通三层骨架，观感提升最大

1. ✅ 设计文档（本文件）
2. ✅ 令牌化：main.css 新增 `--color-app-bg`、调低 `--color-card` / `--color-tabbar-bg`、增强 `.glass-card`、`body/#app` 用环境背景
3. ✅ TabBar 玻璃化（半透明 + blur + 光边）
4. ✅ 页面根容器（账户/明细/统计/设置）背景改为 `transparent`（透出环境）
5. ✅ `npm run build` 验证；启动 `npm run dev` 真机验证

### 批次 B（进行中 → 待真机验证）—— 逐组件玻璃化

- ✅ 新增浮层玻璃底色令牌 `--color-sheet-bg`
- ✅ 确认弹窗（`ConfirmDialog`）、底部抽屉（`CommonBottomSheet`）、提示弹窗（`PromptDialog`）→ 玻璃材质
- ✅ PIN 锁屏（`PinDialog`）→ 背景换环境、键盘玻璃化
- ✅ 统计图表卡（`ExpenseChart`）、分类选择器（`CategoryPicker`）、设置分组卡（`SettingsPage.section-card`）→ 玻璃化并统一 `--glass-blur` 令牌
- ✅ 交易编辑/详情弹层（`TransactionEdit|Detail .sheet`）、快速模板弹层（`QuickTemplateManager .qt-dialog`）、设置删除确认框（`AccountManager|RuleManager|TagManager .modal-content`）、数字键盘（`NumberKeyboard .key`）、安全设置卡（`SecurityLock .section-card`）→ 玻璃化
- ✅ 列表项/分组卡/筛选条（`TransactionItem`/`AccountGroup`/`FilterChips`）→ 统一 `--glass-blur` 令牌 + 描边
- ✅ 记账悬浮按钮（`booking-btn`）→ 玻璃高光边缘 + 顶部内高光（保留强对比主色渐变）
- ✅ 日期筛选条 / 搜索条 / 明细列表统一玻璃材质：`day-group` 作统一玻璃卡，`TransactionItem` 改透明分隔行
- ✅ 批次 B 全部落地；待真机微调令牌（`--color-sheet-bg` 不透明度 / 环境亮度）

### 批次 C（已完成）—— 光效与降级

- ✅ 全局镜面高光（`useLiquidSheen`：单层 + rAF 节流 + `pointerup` 淡出）
- ✅ `.glass-card` 按压内发光反馈
- ✅ `@supports not (backdrop-filter)` 回退近实色；`prefers-reduced-motion` 关闭动效
- ✅ 长列表弱模糊令牌 `--glass-blur-weak`；`will-change` 仅用于 sheen 层
- ⬜ 点击涟漪 / 滚动光：未实施（可选增强，非本轮范围）

---

## 五、性能与降级策略

| 场景 | 策略 |
|------|------|
| 不支持 `backdrop-filter`（旧浏览器） | `@supports` 回退为半透明白/纯色，保证可读性 |
| 低配设备 | 可通过令牌降低 `--glass-blur`、关闭 sheen |
| 长滚动列表（明细/统计） | 卡片使用较低 blur 或静态半透明，保证 60fps |
| 背景层 | 环境渐变在 `body::before` 固定层（`position:fixed`）渲染一次，规避 iOS `background-attachment` 不稳定 |
| `will-change` | 仅在高光层使用，避免大面积占用 GPU 内存 |

---

## 六、涉及文件

| 文件 | 角色 | 批次 |
|------|------|------|
| `src/styles/main.css` | 令牌 + `body::before` 环境背景层 + `.glass-card` 增强 | A |
| `src/components/layout/TabBar.vue` | TabBar 玻璃化 | A |
| `src/pages/*` 页面根容器 | `--color-bg` → `--color-app-bg` | A |
| `src/pages/glass/GlassDemoPage.vue` | 单页 demo（参考实现） | — |
| `src/components/common/PinDialog.vue` 等弹窗 | 玻璃材质 | B |
| 全局光效 composable | `src/composables/useLiquidSheen.ts`（sheen） | C |

---

## 七、修订历史

| 日期 | 修订内容 | 版本 |
|------|---------|------|
| 2026-09-29 | 初稿：三层架构、令牌规范、分批清单 | v1.0 |
| 2026-09-29 | 落地批次 A/B/C；悬浮 TabBar；明细页统一颜色；评审修复（sheen 触摸淡出、深色禁用态、`background-attachment`→`body::before`、blur 令牌化、锁屏 z-index、rAF 节流） | v1.1 |