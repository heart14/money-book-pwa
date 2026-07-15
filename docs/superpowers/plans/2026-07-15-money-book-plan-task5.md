# Task 5: 记账页详细实现

## 组件

### ModeSwitch.vue
收入/支出/转账三段式切换器。iOS 风格圆角容器，激活项蓝色背景白字。

Props: `modelValue: 'expense' | 'income' | 'transfer'`
Emits: `update:modelValue`

### NumberKeyboard.vue
iOS 计算器风格数字键盘，4 列布局。

Props: `value: string`（当前输入字符串）
Emits: `update:value`, `confirm`

按键逻辑：
- 数字键：`value === '0'` 时替换，否则追加
- 小数点：已有`.`则忽略
- 退格：去尾，只剩1位时重置为'0'
- 确认：`value !== '0'` 时才 emit

布局：3×3 数字 + 第四行 `[.] [0] [delete]`，确认按钮 `↵` 单独占第 4 列底部。

### CategoryPicker.vue
两级分类选择器。

Props: `type: 'expense' | 'income'`, `selectedCategoryId: number | null`
Emits: `select(categoryId: number)`

一级：4 列宫格，每个显示 icon + name，选中态蓝色边框
二级：Chip 横向排列，点击选中蓝色高亮
逻辑：选中一级 → 显示二级 → 如果二级只有1个直接选中；点击二级 → emit select

## BookingPage.vue

**状态:** inputValue('0'), selectedAccount, selectedToAccount, note, tags, showNote, showAccountPicker

**工作流:**
1. 默认模式 'expense'
2. 用户点键盘输入金额
3. 选择账户（默认上次选中的，或第一个流动资产）
4. 选择一级分类 → 展开二级 → 选二级
5. 点确认 → `addTransaction`
6. 重置所有状态

**转账模式:** 隐藏 CategoryPicker，显示双账户选择器（从：流动资产 | 到：全部账户）

**布局:**
```
[ModeSwitch]          ← 居中
[¥0.00]               ← 大字
[账户选择器]          ← 毛玻璃卡片
[CategoryPicker]      ← 一级宫格 + 二级 Chip
[备注/标签]           ← 可折叠
[NumberKeyboard]      ← 底部
**需要注意的细节:**
- 确认按钮右侧的 ↵ 键要在键盘布局中正确放置
- 转账模式时自动隐藏 CategoryPicker
- 确认后清空输入并重置为 0
- 全部使用 Composition API setup 语法