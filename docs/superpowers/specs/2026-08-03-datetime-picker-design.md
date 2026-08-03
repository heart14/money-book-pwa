# 日期时间选择器 — 重构设计文档

日期：2026-08-03
状态：设计稿待审

## 1. 动机

记账页（`BookingPage.vue`）和交易编辑弹窗（`TransactionEdit.vue`）目前使用浏览器原生 `<input type="date">` 和 `<input type="time">`。这些原生控件在桌面端视觉突兀，与项目的 iOS 毛玻璃设计风格严重不协调，且在移动端各浏览器表现不一致，属于"假选择器"（功能可用但体验割裂）。

需要替换为自定义的 iOS 风格滚轮选择器，与项目已有的 `NumberKeyboard`、`CategoryPicker` 等自定义组件形成统一的设计语言。

## 2. 目标

- 为记账页和交易编辑页提供 iOS 原生风格的日期/时间滚轮选择器
- 日期和时间分两个独立的底部弹窗，体验与 iOS 系统日历一致
- 保持默认值为当前时间，最小化对快速记账流程的干扰
- 零新增第三方依赖，完全自建

## 3. 组件设计

### 3.1 组件树

```
src/components/common/
├── PickerWheel.vue         # [新建] 通用滚轮内核
├── DatePickerSheet.vue     # [新建] 日期选择弹窗（年·月·日 3列滚轮）
└── TimePickerSheet.vue     # [新建] 时间选择弹窗（时·分 2列滚轮）
```

### 3.2 PickerWheel.vue — 通用滚轮内核

**Props**：

```ts
{
  items: { label: string; value: T }[]  // 滚轮选项列表
  modelValue: T                          // 当前选中值
  itemHeight?: number                    // 每项高度，默认 36px
  visibleCount?: number                  // 可见项数（奇数），默认 5
}
```

**Emits**：`update:modelValue`

**核心机制**：

1. **渲染**：垂直列表，实际渲染的项数 = `items.length + visibleCount`（上下各填充空白项以实现循环效果顶部/底部的视觉收尾）
2. **定位**：通过 `transform: translateY()` 控制列表偏移量
3. **3D 透视**：非选中项按距离中心的比例缩放 + 透明度渐变：
   - 中心项：`scale(1)` `opacity(1)`
   - 偏移 1 项：`scale(0.85)` `opacity(0.6)`
   - 偏移 2 项：`scale(0.7)` `opacity(0.3)`
   - 偏移 ≥3 项：`opacity(0)`（不可见）
4. **吸附**：`touchend` 时计算最近项，动画归位
5. **惯性**：基于 touchmove 最后 100ms 的平均速度，减速动画后吸附
6. **鼠标滚轮**：转换为滚动偏移（deltaY / 3），松手后吸附
7. **高亮条**：固定在容器中间，`height: itemHeight`，半透明毛玻璃背景

**状态管理**：

```ts
const scrollOffset = ref(0)        // 当前偏移量（px）
const isAnimating = ref(false)     // 是否在吸附/惯性动画中

// 选中索引 = Math.round(scrollOffset / itemHeight)
// 实际值 = items[selectedIndex]?.value
```

**事件处理**：

| 事件 | 行为 |
|------|------|
| `touchstart` | 记录起始位置 + 起始偏移 + 时间戳 |
| `touchmove` | 更新偏移量 = 起始偏移 + deltaY，记录最后 5 个点的位置+时间 |
| `touchend` | 计算惯性速度，执行减速动画 → 吸附到最近项 |
| `wheel` | 偏移量 += deltaY / 3，停止滚动后 150ms 吸附 |

### 3.3 DatePickerSheet.vue — 日期选择弹窗

**Props**：

```ts
{
  visible: boolean        // 弹窗可见性
  modelValue: string      // 日期值，格式 "YYYY-MM-DD"
}
```

**Emits**：`update:modelValue`, `update:visible`, `close`

**布局**（复用 `CommonBottomSheet`）：

```
┌─────────────────────────────┐
│          ───                │  ← sheet-handle
│                             │
│         选择日期             │  ← 标题
│                             │
│  ┌──────┬──────┬────────┐  │
│  │  年  │  月  │   日   │  │  ← 列标签
│  │ 2024 │  08  │   03   │  │
│  │ 2025 │  09  │   04   │  │
│  │●2026●│●10●  │●05●    │  │  ← 选中项（高亮条）
│  │ 2027 │  11  │   06   │  │
│  │ 2028 │  12  │   07   │  │
│  └──────┴──────┴────────┘  │
│                             │
│     [取消]    [完成]        │  ← 操作按钮
└─────────────────────────────┘
```

**列配置**：

| 列 | 数据源 | 宽度 | 说明 |
|---|---|---|---|
| 年 | 1970 ~ 2050 | flex: 1 | 100 年范围 |
| 月 | 01 ~ 12 | flex: 1 | 固定 12 个月 |
| 日 | 01 ~ 28/29/30/31 | flex: 1 | 根据年月动态计算 |

**联动逻辑**：

- 改年 → 2 月天数根据闰年变化
- 改月 → 天数随月份变化
- 若当前选中的日在目标月份不存在（如 1月31日 → 2月），自动修正到该月最后一天
- 每次联动后，任一列的选中值变更都要校验并修正所有列的日值

**日期有效性计算**：

```ts
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
```

**操作按钮**：
- **取消**：关闭弹窗，不改变已选值
- **完成**：校验日期有效性 → emit `update:modelValue` → 关闭弹窗

### 3.4 TimePickerSheet.vue — 时间选择弹窗

**Props**：

```ts
{
  visible: boolean        // 弹窗可见性
  modelValue: string      // 时间值，格式 "HH:mm"
}
```

**Emits**：`update:modelValue`, `update:visible`, `close`

**布局**：

```
┌─────────────────────────────┐
│          ───                │
│                             │
│         选择时间             │
│                             │
│  ┌────────┬──────────┐      │
│  │  小时  │   分钟   │      │  ← 列标签
│  │  22    │   58     │      │
│  │  23    │   59     │      │
│  │●00●    │●00●      │      │  ← 选中项
│  │  01    │   01     │      │
│  │  02    │   02     │      │
│  └────────┴──────────┘      │
│                             │
│     [取消]    [完成]        │
└─────────────────────────────┘
```

**列配置**：

| 列 | 数据源 | 说明 |
|---|---|---|
| 小时 | 00 ~ 23 | 24 小时制，2 位数字 |
| 分钟 | 00 ~ 59 | 步长 1 分钟，2 位数字 |

### 3.5 显示触发区域

在记账页和编辑页中，日期和时间各展现为一个可点击的卡片样式区域，显示格式化文本：

**日期显示**（调用已有的 `formatDate()` 函数）：
- 今天 → "今天"
- 昨天 → "昨天"
- 其他 → "8月3日 周一"

**时间显示**："15:30"

## 4. 集成方案

### 4.1 BookingPage.vue

**替换**：

```diff
- <div class="dt-row">
-   <input v-model="selectedDate" type="date" class="dt-input" />
-   <input v-model="selectedTime" type="time" class="dt-input" />
- </div>
+ <div class="dt-row">
+   <div class="dt-picker" @click="datePickerOpen = true">
+     <span class="dt-picker-icon">📅</span>
+     <span class="dt-picker-text">{{ formatDate(selectedDate) }}</span>
+   </div>
+   <div class="dt-picker" @click="timePickerOpen = true">
+     <span class="dt-picker-icon">⏰</span>
+     <span class="dt-picker-text">{{ selectedTime }}</span>
+   </div>
+ </div>
+ 
+ <DatePickerSheet v-model:visible="datePickerOpen" v-model="selectedDate" />
+ <TimePickerSheet v-model:visible="timePickerOpen" v-model="selectedTime" />
```

**状态变更**：`selectedDate` / `selectedTime` 的初始化和重置逻辑保持不变

**样式**：`.dt-picker` 沿用 `.dt-input` 的尺寸和背景，但改为 flex 布局，左侧图标 + 右侧文字

### 4.2 TransactionEdit.vue

**替换**：

```diff
- <div class="edit-row">
-   <label class="edit-label">日期</label>
-   <input v-model="form.date" class="edit-input" type="date" />
- </div>
- <div class="edit-row">
-   <label class="edit-label">时间</label>
-   <input v-model="form.time" class="edit-input" type="time" />
- </div>
+ <div class="edit-row">
+   <label class="edit-label">日期</label>
+   <div class="edit-input edit-picker-trigger" @click="datePickerOpen = true">
+     {{ formatDate(form.date) }}
+   </div>
+ </div>
+ <div class="edit-row">
+   <label class="edit-label">时间</label>
+   <div class="edit-input edit-picker-trigger" @click="timePickerOpen = true">
+     {{ form.time }}
+   </div>
+ </div>
+ 
+ <DatePickerSheet v-model:visible="datePickerOpen" v-model="form.date" />
+ <TimePickerSheet v-model:visible="timePickerOpen" v-model="form.time" />
```

**额外 import**：增加 `formatDate` 函数引用

## 5. 交互流程

```
记账页：
  用户点击日期/时间区域
    → 触发区域高亮反馈
    → 弹出 DatePickerSheet / TimePickerSheet（底部弹窗）
    → 滚轮选择年·月·日 / 时·分
    → 点击"完成"确认（或"取消"回退）
    → 弹窗关闭，触发区域更新为选中值
    → 用户继续其他操作或点击保存

编辑页：
  用户点击编辑交易中的日期/时间
    → 同上流程
    → 确认后更新表单数据
    → 用户点击"保存"提交编辑
```

## 6. 数据流

```
BookingPage.vue
  ├── selectedDate: Ref<string> (YYYY-MM-DD)
  ├── selectedTime: Ref<string> (HH:mm)
  │
  ├── DatePickerSheet
  │     props: visible, modelValue
  │     emits: update:modelValue, update:visible
  │
  ├── TimePickerSheet
  │     props: visible, modelValue
  │     emits: update:modelValue, update:visible
  │
  └── handleConfirm()
        └── 使用 selectedDate + selectedTime 提交

TransactionEdit.vue
  ├── form.date, form.time
  ├── DatePickerSheet / TimePickerSheet
  └── handleSave()
        └── 使用 form.date + form.time 更新
```

## 7. 涉及的格式化函数

已有 `src/utils/format.ts` 中的函数将直接复用：

| 函数 | 用途 |
|---|---|
| `formatDate(dateStr)` | "今天" / "昨天" / "8月3日 周一" |
| `toDateString(d)` | Date → "YYYY-MM-DD" |
| `formatTimeLabel(dateStr, timeStr)` | "今天 15:30" |

## 8. 边界情况

| 场景 | 处理 |
|------|------|
| 未来日期 | 允许选择（用户可能预记账），不拦截 |
| 闰年 2月 29日 | 通过 `new Date(year, month, 0).getDate()` 自动计算 |
| 1月31日 → 2月 | 自动修正到 2月28/29日 |
| 快速连续点击 | PickerWheel 在 `isAnimating` 期间忽略新的 touch/wheel 事件 |
| 空数据 | 日期默认今天，时间默认当前时刻 |
| 深色模式 | 滚轮颜色跟随 CSS 变量（`--color-text`, `--color-card` 等） |
| 字号缩放 | 滚轮字体使用 `--fs-body` / `--fs-title`，跟随系统字号设置 |
| 触摸 + 鼠标混合 | 同时绑定 touch 和 wheel 事件，互不干扰 |

## 9. 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `src/components/common/PickerWheel.vue` | 通用滚轮内核组件 |
| 新建 | `src/components/common/DatePickerSheet.vue` | 日期选择弹窗 |
| 新建 | `src/components/common/TimePickerSheet.vue` | 时间选择弹窗 |
| 修改 | `src/pages/booking/BookingPage.vue` | 替换原生 date/time input 为自定义选择器 |
| 修改 | `src/components/transactions/TransactionEdit.vue` | 同上 |
| 引用 | `src/utils/format.ts` | 复用已有格式化函数，无需改动 |

## 10. 不涉及的变更

- 不修改 `types/index.ts`（Transaction 类型的 date/time 字段格式不变）
- 不修改 `db/index.ts`（数据库结构不变）
- 不修改 `CommonBottomSheet.vue`（但可以被复用为容器）
- 不引入任何第三方依赖
- 不修改 `TransactionDetail.vue`（详情页只展示日期文本，无需选择器）