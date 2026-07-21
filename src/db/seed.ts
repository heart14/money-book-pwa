import { db } from './index'
import type { Account, Category } from '@/types'

async function seedAccounts() {
  const count = await db.accounts.count()
  if (count > 0) return

  const accounts: Account[] = [
    { name: '银行卡', balance: 0, icon: '💳', sort: 1 },
    { name: '支付宝', balance: 0, icon: '💳', sort: 2 },
    { name: '微信', balance: 0, icon: '💳', sort: 3 },
    { name: '现金', balance: 0, icon: '💵', sort: 4 },
  ]

  await db.accounts.bulkAdd(accounts)
}

async function seedCategories() {
  const count = await db.categories.count()
  if (count > 0) return

  // --- Expense Categories ---
  const expenseCategories: { parent: Omit<Category, 'id'>; children: Omit<Category, 'id'>[] }[] = [
    {
      parent: { type: 'expense', parentId: null, name: '居住', icon: '🏠', sort: 1 },
      children: [
        { type: 'expense', parentId: null, name: '房租房贷', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '生活缴费', icon: '', sort: 2 },
        { type: 'expense', parentId: null, name: '家居家装', icon: '', sort: 3 },
      ],
    },
    {
      parent: { type: 'expense', parentId: null, name: '餐饮', icon: '🍽️', sort: 2 },
      children: [
        { type: 'expense', parentId: null, name: '餐饮美食', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '生鲜食材', icon: '', sort: 2 },
        { type: 'expense', parentId: null, name: '休闲食品', icon: '', sort: 3 },
      ],
    },
    {
      parent: { type: 'expense', parentId: null, name: '交通', icon: '🚗', sort: 3 },
      children: [
        { type: 'expense', parentId: null, name: '公共交通', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '汽车消费', icon: '', sort: 2 },
        { type: 'expense', parentId: null, name: '停车通行', icon: '', sort: 3 },
        { type: 'expense', parentId: null, name: '汽车加油', icon: '', sort: 4 },
        { type: 'expense', parentId: null, name: '汽车充电', icon: '', sort: 5 },
      ],
    },
    {
      parent: { type: 'expense', parentId: null, name: '购物', icon: '🛍️', sort: 4 },
      children: [
        { type: 'expense', parentId: null, name: '日用百货', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '服饰装扮', icon: '', sort: 2 },
        { type: 'expense', parentId: null, name: '美妆护理', icon: '', sort: 3 },
        { type: 'expense', parentId: null, name: '数码家电', icon: '', sort: 4 },
      ],
    },
    {
      parent: { type: 'expense', parentId: null, name: '休闲', icon: '🎭', sort: 5 },
      children: [
        { type: 'expense', parentId: null, name: '虚拟消费', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '文娱休闲', icon: '', sort: 2 },
        { type: 'expense', parentId: null, name: '兴趣潮玩', icon: '', sort: 3 },
        { type: 'expense', parentId: null, name: '运动健身', icon: '', sort: 4 },
        { type: 'expense', parentId: null, name: '旅游出行', icon: '', sort: 5 },
      ],
    },
    {
      parent: { type: 'expense', parentId: null, name: '家庭', icon: '👨‍👩‍👧', sort: 6 },
      children: [
        { type: 'expense', parentId: null, name: '文化教育', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '医疗保健', icon: '', sort: 2 },
        { type: 'expense', parentId: null, name: '宠物消费', icon: '', sort: 3 },
      ],
    },
    {
      parent: { type: 'expense', parentId: null, name: '人情', icon: '🤝', sort: 7 },
      children: [
        { type: 'expense', parentId: null, name: '红包转账', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '节日礼物', icon: '', sort: 2 },
      ],
    },
    {
      parent: { type: 'expense', parentId: null, name: '特别', icon: '🧮', sort: 8 },
      children: [
        { type: 'expense', parentId: null, name: '订婚', icon: '', sort: 1 },
        { type: 'expense', parentId: null, name: '婚礼', icon: '', sort: 2 },
        { type: 'expense', parentId: null, name: '购车', icon: '', sort: 3 },
        { type: 'expense', parentId: null, name: '购房', icon: '', sort: 4 },
        { type: 'expense', parentId: null, name: '其它', icon: '', sort: 5 },
      ],
    },
  ]

  // --- Income Categories ---
  const incomeCategories: { parent: Omit<Category, 'id'>; children: Omit<Category, 'id'>[] }[] = [
    {
      parent: { type: 'income', parentId: null, name: '主动收入', icon: '💼', sort: 1 },
      children: [
        { type: 'income', parentId: null, name: '税后薪酬', icon: '', sort: 1 },
        { type: 'income', parentId: null, name: '绩效奖金', icon: '', sort: 2 },
        { type: 'income', parentId: null, name: '兼职外包', icon: '', sort: 3 },
        { type: 'income', parentId: null, name: '公积金入账', icon: '', sort: 4 },
      ],
    },
    {
      parent: { type: 'income', parentId: null, name: '被动收入', icon: '💰', sort: 2 },
      children: [
        { type: 'income', parentId: null, name: '利息分红', icon: '', sort: 1 },
        { type: 'income', parentId: null, name: '资本利得', icon: '', sort: 2 },
      ],
    },
    {
      parent: { type: 'income', parentId: null, name: '其它收入', icon: '🎁', sort: 3 },
      children: [
        { type: 'income', parentId: null, name: '转卖返现', icon: '', sort: 1 },
        { type: 'income', parentId: null, name: '红包转账', icon: '', sort: 2 },
      ],
    },
  ]

  // --- Transfer Categories ---
  const transferCategories: { parent: Omit<Category, 'id'>; children: Omit<Category, 'id'>[] }[] = [
    {
      parent: { type: 'transfer', parentId: null, name: '借入借出', icon: '🤝', sort: 1 },
      children: [
        { type: 'transfer', parentId: null, name: '借出', icon: '', sort: 1 },
        { type: 'transfer', parentId: null, name: '收回', icon: '', sort: 2 },
      ],
    },
    {
      parent: { type: 'transfer', parentId: null, name: '存钱账户', icon: '🏦', sort: 2 },
      children: [
        { type: 'transfer', parentId: null, name: '存入', icon: '', sort: 1 },
        { type: 'transfer', parentId: null, name: '取出', icon: '', sort: 2 },
      ],
    },
    {
      parent: { type: 'transfer', parentId: null, name: '理财账户', icon: '📈', sort: 3 },
      children: [
        { type: 'transfer', parentId: null, name: '买入', icon: '', sort: 1 },
        { type: 'transfer', parentId: null, name: '赎回', icon: '', sort: 2 },
      ],
    },
  ]

  // 批量插入优化：先 bulkAdd 所有父分类，再映射 parentId，再 bulkAdd 子分类
  async function insertCategoryGroups(groups: { parent: Omit<Category, 'id'>; children: Omit<Category, 'id'>[] }[]) {
    // 第 1 步：批量写入所有父分类
    const parentRecords = groups.map(g => g.parent)
    const parentIds = await db.categories.bulkAdd(parentRecords, { allKeys: true })

    // 第 2 步：为子分类设置 parentId
    const allChildren: Omit<Category, 'id'>[] = []
    for (let i = 0; i < groups.length; i++) {
      for (const child of groups[i].children) {
        child.parentId = parentIds[i] as number
        allChildren.push(child)
      }
    }

    // 第 3 步：批量写入所有子分类
    if (allChildren.length > 0) {
      await db.categories.bulkAdd(allChildren)
    }
  }

  await insertCategoryGroups(expenseCategories)
  await insertCategoryGroups(incomeCategories)
  await insertCategoryGroups(transferCategories)
}

export async function seedData() {
  await seedAccounts()
  await seedCategories()
}