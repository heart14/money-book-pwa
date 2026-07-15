# Task 8: 统计页详细实现

## 组件

### ExpenseChart.vue
ECharts 图表包装组件。按需导入（`import * as echarts from 'echarts/core'` +  BarChart, PieChart, TitleComponent, TooltipComponent, CanvasRenderer...）

Props: `type: 'bar' | 'pie' | 'line'`, `data: any`, `height?: string`

使用 `vue-echarts` 的 `<VChart>` 组件，或者手动管理 echarts 实例（推荐手管减少依赖）。简单起见直接用 echarts 库：

```typescript
import * as echarts from 'echarts'
```

然后在 onMounted 中初始化，watch 数据变化时更新。

### StatsPage.vue

**状态:** timeMode('month'|'year'|'custom'), currentDate(Date), transactions

**数据获取:** 根据当前时间和模式动态 liveQuery 获取流水数据

**功能块:**

1. **时间切换器** — 月/年/自选三段式按钮 + 前一月/下一月箭头 + 当前月份显示
2. **收支概览卡** — 绿色收入卡片 + 红色支出卡片
3. **月度柱状图** — 双色柱 (收入绿/支出浅红)，X轴月份
4. **支出构成环形图** — 一级分类占比
5. **支出排行** — Top 3 带序号徽章(红/橙/黄) + 分类名 + 金额 + 百分比
6. **标签聚合** — 所有标签 + 汇总金额 chip 展示

**桌面端:** 使用 CSS grid 两列布局，柱状图+环形图并排，排行+标签并排。

**移动端:** 单列纵向排列。

**数据聚合逻辑:**
```typescript
// 按一级分类汇总支出
function aggregateByCategory(txList: Transaction[]): { name: string; icon: string; amount: number }[] {
  const map = new Map<number, { name: string; icon: string; amount: number }>()
  for (const tx of txList) {
    if (!tx.categoryId) continue
    // 找到对应的一级分类
    const cat = categoryStore.categories.value?.find(c => c.id === tx.categoryId)
    if (!cat) continue
    const parent = cat.parentId ? categoryStore.categories.value?.find(c => c.id === cat.parentId) : cat
    if (!parent) continue
    const key = parent.id!
    if (!map.has(key)) map.set(key, { name: parent.name, icon: parent.icon, amount: 0 })
    map.get(key)!.amount += tx.amount
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
}
```