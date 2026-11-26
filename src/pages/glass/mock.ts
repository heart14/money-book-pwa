import type { Mode } from './state'

/**
 * 沙盒原型使用的 mock 数据。纯演示，不来自 store / DB。
 * 分类：父子两级；模板：按"支出/收入"分的快捷记账。
 */
export interface MockChild {
  id: number
  name: string
}

export interface MockCategory {
  id: number
  name: string
  icon: string
  children?: MockChild[]
}

export const mockCats: Record<Mode, MockCategory[]> = {
  expense: [
    { id: 1, name: '餐饮', icon: '🍽️', children: [
      { id: 11, name: '早餐' }, { id: 12, name: '午餐' }, { id: 13, name: '晚餐' },
      { id: 14, name: '夜宵' }, { id: 15, name: '饮用水' },
    ] },
    { id: 2, name: '交通', icon: '🚗', children: [
      { id: 21, name: '地铁公交' }, { id: 22, name: '打车' }, { id: 23, name: '加油' }, { id: 24, name: '停车' },
    ] },
    { id: 3, name: '购物', icon: '🛍️', children: [
      { id: 31, name: '服饰' }, { id: 32, name: '数码' }, { id: 33, name: '日用' },
    ] },
    { id: 4, name: '居住', icon: '🏠', children: [
      { id: 41, name: '房租物业' }, { id: 42, name: '水电燃气' }, { id: 43, name: '家居' },
    ] },
    { id: 5, name: '娱乐', icon: '🎮', children: [
      { id: 51, name: '电影' }, { id: 52, name: '游戏' }, { id: 53, name: '旅游' },
    ] },
    { id: 6, name: '医疗', icon: '💊', children: [{ id: 61, name: '药品' }, { id: 62, name: '体检' }] },
    { id: 7, name: '教育', icon: '📚', children: [{ id: 71, name: '课程' }, { id: 72, name: '书籍' }] },
    { id: 8, name: '其他', icon: '📦' },
  ],
  income: [
    { id: 101, name: '工资奖金', icon: '💼' },
    { id: 102, name: '理财', icon: '📈' },
    { id: 103, name: '兼职', icon: '💪' },
    { id: 104, name: '红包', icon: '🧧' },
    { id: 105, name: '退款', icon: '↩️' },
    { id: 106, name: '其他收入', icon: '💰' },
  ],
  transfer: [
    { id: 201, name: '转出', icon: '↗️', children: [
      { id: 2011, name: '支付宝→银行卡' }, { id: 2012, name: '微信→银行卡' },
    ] },
    { id: 202, name: '转卡', icon: '🔄' },
    { id: 203, name: '还信用卡', icon: '💳' },
  ],
}

export const mockTemplates: { name: string; icon: string; amount: string; type: Mode }[] = [
  { name: '早餐', icon: '🌅', amount: '¥18', type: 'expense' },
  { name: '午餐', icon: '🍱', amount: '¥25', type: 'expense' },
  { name: '打车', icon: '🚕', amount: '¥30', type: 'expense' },
  { name: '奶茶', icon: '🧋', amount: '¥15', type: 'expense' },
  { name: '超市', icon: '🛒', amount: '¥88', type: 'expense' },
  { name: '工资', icon: '💼', amount: '¥8,000', type: 'income' },
  { name: '报销', icon: '🧾', amount: '¥200', type: 'income' },
]

export function parentsFor(mode: Mode): MockCategory[] {
  return mockCats[mode]
}

export function childrenFor(mode: Mode, parentId: number): MockChild[] {
  const p = mockCats[mode].find((c) => c.id === parentId)
  return p?.children ?? []
}