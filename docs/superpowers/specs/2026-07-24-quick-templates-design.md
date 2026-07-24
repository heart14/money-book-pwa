# 快捷记账气泡 — 功能需求规格

> 日期：2026-07-24
> 状态：设计稿待审

---

## 一、概述

记账页添加"快捷记账气泡"功能，允许用户将高频记账内容保存为模板，一键填充到记账表单。气泡通过设置页管理，也可从交易明细中直接提取。

---

## 二、数据模型

### 2.1 QuickTemplate 类型

添加至 `src/types/index.ts`：

```ts
export interface QuickTemplate {
  id?: number
  /** 用户自定义名称，如"每日咖啡" */
  name: string
  /** 记账模式 */
  type: 'expense' | 'income' | 'transfer'
  /** 金额（分） */
  amount: number
  /** 分类 ID */
  categoryId: number
  /** 标题（可选） */
  title: string
  /** 标签列表（可选） */
  tags: string[]
  /** 备注（可选） */
  note: string
  /** 排序序号，用于拖动排序 */
  sort: number
}
```

### 2.2 Dexie 版本迁移（v5）

在 `src/db/index.ts` 新增 v5 迁移：

```ts
this.version(5).stores({
  accounts: '++id, name',
  categories: '++id, type, parentId',
  transactions: '++id, type, date, categoryId, [date+id]',
  recurringRules: '++id, enabled, dayOfMonth',
  tags: '++id, &name',
  quickTemplates: '++id, type, sort',  // ← 新增
})
```

### 2.3 导出/导入兼容

`src/utils/export.ts` 需同步处理 `quickTemplates` 表：

- **`exportData()`**：`Promise.all` 查询中增加 `db.quickTemplates.toArray()`，`data` 对象增加 `quickTemplates` 字段
- **`importData()`**：数据校验中读取 `data.quickTemplates ?? []`，`db.transaction('rw', ...)` 的表格列表增加 `db.quickTemplates`，`clear()` 和 `bulkAdd` 均增加对应操作
- **`destroyAllData()`**：`Promise.all` 中增加 `db.quickTemplates.clear()`

---

## 三、QuickTemplate Store

新建 `src/stores/quickTemplateStore.ts`，沿用项目 Pinia 函数式写法：

| 方法 | 说明 |
|------|------|
| `templates` | `liveQuery` 返回的 `QuickTemplate[]`，按 `sort` 升序 |
| `add(tpl)` | 添加模板（不含 id），自动分配 `sort = maxSort + 1` |
| `update(id, changes)` | 更新模板字段 |
| `remove(id)` | 删除模板 |
| `reorder(ids)` | 接收排序后的 ID 数组，批量更新 `sort` 值 |

---

## 四、记账页气泡展示

### 4.1 位置

位于记账内容区（模式开关 → 金额 → 分类 → 标题 → 标签 → 备注）之后、数字键盘之前。

### 4.2 类型过滤

气泡按 `type` 归属（`expense` / `income` / `transfer`）。记账页切换记账模式时，气泡区域**仅展示与当前模式匹配**的气泡。例如切换到"收入"模式时，只显示 `type === 'income'` 的气泡。

### 4.4 视觉

- 药丸状（胶囊状）按钮，横向 `flex-wrap` 排列
- **每个气泡内部一排展示**：分类图标（来自 `categories` 表） + 用户自定义名称（`name`） + `¥`+ 金额简写（`formatShortCurrency`）
  - 示例：`🍽️ 每日咖啡 ¥32.00` / `🚗 通勤地铁 ¥3.00`
- 最后固定一个「+」按钮，用于快速新建模板

### 4.5 交互：点击气泡 → applyTemplate()

**乐观覆盖原则**：无论当前表单是否已有用户输入，点击气泡一律用模板内容覆盖全部字段。

```ts
function applyTemplate(tpl: QuickTemplate) {
  bookingMode.value = tpl.type
  uiStore.setMode(tpl.type)
  
  // 金额：从分反算回元显示
  const yuan = tpl.amount / 100
  inputValue.value = yuan.toFixed(2).replace(/\.?0+$/, '') || '0'
  
  selectedCategoryId.value = tpl.categoryId
  title.value = tpl.title
  tags.value = [...tpl.tags]
  note.value = tpl.note
}
```

- `CategoryPicker` 内部通过 `watch(selectedCategoryId)` 自动同步展开对应的父分类
- 填充完成后用户可自由微调任何字段
- 保存按钮的高亮提示（`bookingCanSave`）自动更新

### 4.6 快速新建

点击「+」按钮 → 以当前表单内容创建一个新模板 → 弹出命名弹窗 → 确认后存入 IndexedDB → 气泡区域即时刷新。

---

## 五、交易明细提取

### 5.1 入口

在 `TransactionDetail.vue` 的 sheet 头部右上角添加星标/书签图标按钮（☆）。

### 5.2 流程

1. 点击 ☆ → 弹出命名弹窗（封装为 `PromptDialog` 或沿用现有 `ConfirmDialog` 改造）
2. 默认名称推荐：根据标题或分类名自动生成
3. 用户可修改 → 点击确认 → 存入 `quickTemplates`
4. 自动提取字段：`type` / `amount` / `categoryId` / `title` / `tags` / `note`
5. `sort` = 当前最大序号 + 1
6. Toast 提示"已添加快记模板"

### 5.3 内容重复检测

若已存在精确匹配的模板（同 `type + amount + categoryId`），则不重复添加，Toast 提示"该模板已存在"。

---

## 六、设置页管理

### 6.1 入口

`SettingsPage.vue` 中新增"快捷记账"板块，位于"周期记账"之后、"关于"之前。

### 6.2 功能

| 操作 | 说明 |
|------|------|
| **查看列表** | 每条显示：分类图标 + 自定义名称 + 金额简写（与气泡视觉一致） |
| **拖动排序** | ☰ 手柄拖动，调用 `reorder(ids)` |
| **编辑** | 点击 ✎ → 弹出编辑弹窗，可编辑所有字段（名称 + type + amount + category + title + tags + note），底部有「删除」按钮 |
| **新建** | 底部的「+ 添加新模板」按钮 → 弹出新建弹窗 |
| **删除** | 编辑弹窗中的「删除」按钮 → `ConfirmDialog` 确认后删除 |

### 6.3 弹窗设计

编辑/新建使用 `CommonBottomSheet` 风格弹窗，包含：
- 名称输入（必填）
- 记账模式选择（收入/支出/转账）
- 金额输入
- 分类选择
- 标题输入（可选）
- 标签输入（可选）
- 备注输入（可选）

---

## 七、涉及文件清单

| 操作 | 文件 | 变更类型 |
|------|------|----------|
| 新增类型 | `src/types/index.ts` | 追加 `QuickTemplate` |
| 新增表 | `src/db/index.ts` | v5 迁移 |
| 新增 Store | `src/stores/quickTemplateStore.ts` | 新建 |
| 修改组件 | `src/pages/booking/BookingPage.vue` | 追加气泡区域 + `applyTemplate` |
| 修改组件 | `src/components/transactions/TransactionDetail.vue` | 追加提取按钮 + 命名弹窗 |
| 修改页面 | `src/pages/settings/SettingsPage.vue` | 追加快捷记账管理板块 |
| 修改工具 | `src/utils/export.ts` | 导入/导出含 `quickTemplates` |
| 新增组件 | `src/components/common/PromptDialog.vue` | 命名弹窗（可选，如不复用 ConfirmDialog） |
| 新增 UI 组件 | `src/components/booking/QuickBubble.vue` | 气泡展示组件（可选，可内联在 BookingPage） |

---

## 八、边界情况与异常处理

| 场景 | 处理方式 |
|------|----------|
| 气泡数量为 0 | 显示空状态提示"暂无快记模板，在交易详情中提取或去设置页添加" |
| 切换记账模式后无匹配气泡 | 该类型下无模板时气泡区域隐藏或显示空状态 |
| 气泡数量很多 | flex-wrap 自动换行，最多显示 2 行后隐藏剩余气泡，加「展开箭头」展开全部 |
| 气泡对应分类已被删除 | `applyTemplate` 时校验 `categoryId` 是否存在，不存在则 Toast 提示"该分类已不存在"并跳过分类填充 |
| 导入数据含 `quickTemplates` | 导入时先 clear 全表再 bulkAdd |
| 新建模板时内容重复 | Store 层先查 `type + amount + categoryId` 是否存在，是则阻止添加并 Toast "该模板已存在" |
| 气泡金额为 0 | 允许保存为模板；`applyTemplate` 后金额显示 ¥0，用户可手动调整 |

---

## 九、约束

- 所有金额以分为单位（`amount: number`）
- 兼容现有 Dexie v4 → v5 迁移
- `liveQuery` 复用 `useLiveQuery` composable
- 气泡组件样式沿用 iOS 设计语言（CSS 变量）