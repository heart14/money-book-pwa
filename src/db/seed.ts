import { db } from './index'
import type { Account, Category } from '@/types'

const presetAccounts: Account[] = [
  // 流动性资产 (groupId: 0)
  { groupId: 0, groupName: '流动性资产', name: '微信零钱', type: 'liquid', icon: '💬', balance: 0, isCommon: false, sort: 0 },
  { groupId: 0, groupName: '流动性资产', name: '支付宝余额', type: 'liquid', icon: '🔵', balance: 0, isCommon: false, sort: 1 },
  { groupId: 0, groupName: '流动性资产', name: '银行卡账户', type: 'liquid', icon: '💳', balance: 0, isCommon: false, sort: 2 },
  { groupId: 0, groupName: '流动性资产', name: '支付宝小荷包', type: 'liquid', icon: '🐷', balance: 0, isCommon: true, sort: 3 },
  // 限制性资产 (groupId: 1)
  { groupId: 1, groupName: '限制性资产', name: '公积金账户', type: 'restricted', icon: '🏛️', balance: 0, isCommon: false, sort: 0 },
  { groupId: 1, groupName: '限制性资产', name: '投资理财账户', type: 'restricted', icon: '📈', balance: 0, isCommon: false, sort: 1 },
  // 债权 (groupId: 2)
  { groupId: 2, groupName: '债权', name: '借出款项', type: 'claim', icon: '🤝', balance: 0, isCommon: false, sort: 0 },
  // 负债 (groupId: 3)
  { groupId: 3, groupName: '负债', name: '信用卡', type: 'debt', icon: '💳', balance: 0, isCommon: false, sort: 0 },
  { groupId: 3, groupName: '负债', name: '借入款项', type: 'debt', icon: '📋', balance: 0, isCommon: false, sort: 1 },
  { groupId: 3, groupName: '负债', name: '房贷本金', type: 'debt', icon: '🏠', balance: 0, isCommon: false, sort: 2 },
]

const presetCategories: Category[] = [
  // ===== 支出分类 =====
  // 🏠 居住 (parentId: null → id will be assigned sequentially)
  { type: 'expense', parentId: null, name: '🏠 居住', icon: 'home-outline', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 1, name: '房租房贷', icon: 'home-outline', attribute: '固定', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 1, name: '生活缴费', icon: 'light', attribute: '波动', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 1, name: '家居家装', icon: 'furniture', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 2 },
  // 🍽️ 餐饮
  { type: 'expense', parentId: null, name: '🍽️ 餐饮', icon: 'food', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 5, name: '餐饮美食', icon: 'food', attribute: '必需', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 5, name: '生鲜食材', icon: 'vegetables', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 5, name: '休闲食品', icon: 'snacks', attribute: '社交', isLatteFactor: false, isHidden: false, sort: 2 },
  // 🚗 交通
  { type: 'expense', parentId: null, name: '🚗 交通', icon: 'transport', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 9, name: '公共交通', icon: 'bus', attribute: '必需', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 9, name: '汽车消费', icon: 'car', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 9, name: '停车通行', icon: 'parking', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 9, name: '汽车加油', icon: 'gas-station', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 9, name: '汽车充电', icon: 'charge', isLatteFactor: false, isHidden: false, sort: 4 },
  // 🛍️ 购物
  { type: 'expense', parentId: null, name: '🛍️ 购物', icon: 'shopping', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 15, name: '日用百货', icon: 'daily', attribute: '必需', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 15, name: '服饰装扮', icon: 'clothes', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 15, name: '美妆护理', icon: 'beauty', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 15, name: '数码家电', icon: 'digital', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 3 },
  // 🎭 休闲
  { type: 'expense', parentId: null, name: '🎭 休闲', icon: 'leisure', isLatteFactor: false, isHidden: false, sort: 4 },
  { type: 'expense', parentId: 20, name: '虚拟消费', icon: 'game', attribute: '弹性', isLatteFactor: true, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 20, name: '文娱休闲', icon: 'movie', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 20, name: '兴趣潮玩', icon: 'toy', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 20, name: '运动健身', icon: 'sport', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 20, name: '旅游出行', icon: 'travel', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 4 },
  // 👨‍👩‍👧 家庭
  { type: 'expense', parentId: null, name: '👨‍👩‍👧 家庭', icon: 'family', isLatteFactor: false, isHidden: false, sort: 5 },
  { type: 'expense', parentId: 26, name: '文化教育', icon: 'education', attribute: '义务', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 26, name: '医疗保健', icon: 'medical', attribute: '固定', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 26, name: '宠物消费', icon: 'pet', attribute: '固定', isLatteFactor: false, isHidden: false, sort: 2 },
  // 🤝 人情
  { type: 'expense', parentId: null, name: '🤝 人情', icon: 'gift', isLatteFactor: false, isHidden: false, sort: 6 },
  { type: 'expense', parentId: 30, name: '红包转账', icon: 'redpacket', attribute: '突发', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 30, name: '节日礼物', icon: 'gift', attribute: '弹性', isLatteFactor: false, isHidden: false, sort: 1 },
  // 🧮 特别分类
  { type: 'expense', parentId: null, name: '🧮 特别分类', icon: 'special', isLatteFactor: false, isHidden: false, sort: 7 },
  { type: 'expense', parentId: 33, name: '订婚', icon: 'ring', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'expense', parentId: 33, name: '婚礼', icon: 'wedding', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'expense', parentId: 33, name: '购车', icon: 'car', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'expense', parentId: 33, name: '购房', icon: 'house', isLatteFactor: false, isHidden: false, sort: 3 },
  { type: 'expense', parentId: 33, name: '其它', icon: 'other', attribute: '兜底', isLatteFactor: false, isHidden: false, sort: 4 },
  // ===== 收入分类 =====
  // 💼 主动收入
  { type: 'income', parentId: null, name: '💼 主动收入', icon: 'work', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 39, name: '税后薪酬', icon: 'salary', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 39, name: '绩效奖金', icon: 'bonus', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'income', parentId: 39, name: '兼职外包', icon: 'freelance', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'income', parentId: 39, name: '公积金入账', icon: 'fund', isLatteFactor: false, isHidden: false, sort: 3 },
  // 💰 被动收入
  { type: 'income', parentId: null, name: '💰 被动收入', icon: 'passive', isLatteFactor: false, isHidden: false, sort: 1 },
  { type: 'income', parentId: 44, name: '利息分红', icon: 'interest', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 44, name: '资本利得', icon: 'profit', isLatteFactor: false, isHidden: false, sort: 1 },
  // 🎁 其它收入
  { type: 'income', parentId: null, name: '🎁 其它收入', icon: 'other', isLatteFactor: false, isHidden: false, sort: 2 },
  { type: 'income', parentId: 47, name: '转卖返现', icon: 'cashback', isLatteFactor: false, isHidden: false, sort: 0 },
  { type: 'income', parentId: 47, name: '红包转账', icon: 'redpacket', isLatteFactor: false, isHidden: false, sort: 1 },
]

export async function seedDatabase() {
  const accountCount = await db.accounts.count()
  const categoryCount = await db.categories.count()
  if (accountCount > 0 || categoryCount > 0) return

  await db.transaction('rw', db.accounts, db.categories, async () => {
    await db.accounts.bulkAdd(presetAccounts as Account[])
    await db.categories.bulkAdd(presetCategories as Category[])
  })
}