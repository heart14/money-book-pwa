import { db } from '@/db'
import type { Transaction } from '@/types'

interface CategoryRef {
  id: number
  name: string
  parentName: string
  type: 'expense' | 'income' | 'transfer'
}

// ── Helpers ──

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}

function randomTime(): string {
  return `${String(rand(8, 23)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`
}

function randomDate(base: Date, daysBack: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() - rand(0, daysBack))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Weighted random: higher weight = more likely */
function weightedRand(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

// ── Mock data pools ──

const titlePools: Record<string, string[]> = {
  // expense subcategories
  '餐饮美食': ['午餐', '晚餐', '早餐', '外卖', '公司食堂', '朋友聚餐', '下午茶', '夜宵'],
  '生鲜食材': ['买菜', '超市采购', '水果', '肉蛋奶'],
  '休闲食品': ['零食', '奶茶', '冰淇淋', '咖啡', '面包甜点'],
  '公共交通': ['地铁通勤', '公交', '打车', '共享单车'],
  '汽车加油': ['加油', '洗车'],
  '汽车充电': ['充电'],
  '停车通行': ['停车费', '高速通行费'],
  '汽车消费': ['保养', '维修', '保险'],
  '日用百货': ['日用品', '厨房用品', '清洁用品', '收纳'],
  '服饰装扮': ['衣服', '鞋子', '包包', '配饰'],
  '美妆护理': ['护肤品', '化妆品', '理发'],
  '数码家电': ['数码配件', '小家电', '电子产品'],
  '房租房贷': ['房租', '物业费'],
  '生活缴费': ['水费', '电费', '燃气费', '话费', '网费'],
  '家居家装': ['家居用品', '装修材料', '家具'],
  '虚拟消费': ['视频会员', '音乐会员', '云存储', '游戏充值', 'App订阅'],
  '文娱休闲': ['电影票', '展览', 'KTV', '剧本杀'],
  '兴趣潮玩': ['手办', '盲盒', '模型'],
  '运动健身': ['健身房月卡', '运动装备', '游泳'],
  '旅游出行': ['机票', '酒店', '景点门票', '旅行团'],
  '文化教育': ['书籍', '课程', '文具'],
  '医疗保健': ['挂号费', '药品', '体检', '牙科'],
  '宠物消费': ['猫粮', '狗粮', '宠物玩具', '宠物医疗'],
  '红包转账(支)': ['随礼', '红包'],
  '节日礼物': ['生日礼物', '节日礼物', '纪念日礼物'],
  // income
  '税后薪酬': ['工资', '月薪'],
  '绩效奖金': ['季度奖金', '年终奖', '项目奖金'],
  '兼职外包': ['兼职收入', '外包项目', '咨询费'],
  '利息分红': ['银行利息', '基金分红', '理财收益'],
  '红包转账': ['压岁钱', '红包'],
}

const tagPool = ['外卖', '通勤', '聚餐', '零食', '日用品', '网购', '娱乐', '健身', '学习', '交通', '咖啡', '数码']

const notePool = [
  '', '', '', '', '', '',
  '今天有点贵',
  '月底了省着点',
  '刚需消费',
  '活动价入手',
  '挺划算的',
  '犒劳自己',
  '日常开销',
  '',
  '',
  '',
  '',
]

// ── Category mapping ──

let expenseChildren: CategoryRef[] = []
let incomeChildren: CategoryRef[] = []

async function loadCategories(): Promise<void> {
  const all = await db.categories.toArray()
  expenseChildren = all
    .filter((c) => c.type === 'expense' && c.parentId != null)
    .map((c) => ({
      id: c.id!,
      name: c.name,
      // find parent name
      parentName: all.find((p) => p.id === c.parentId)?.name ?? '',
      type: c.type,
    }))
  incomeChildren = all
    .filter((c) => c.type === 'income' && c.parentId != null)
    .map((c) => ({
      id: c.id!,
      name: c.name,
      parentName: all.find((p) => p.id === c.parentId)?.name ?? '',
      type: c.type,
    }))
}

// Weighted expense distribution: more food/shopping, less special
const expenseWeights = [
  // 居住,餐饮,交通,购物,休闲,家庭,人情,特别
  0.08, 0.35, 0.12, 0.20, 0.12, 0.06, 0.05, 0.02,
]

// ── Generator ──

async function generateExpenses(count: number, endDate: Date): Promise<Transaction[]> {
  const txs: Transaction[] = []
  const groups = [
    expenseChildren.filter((c) => c.parentName === '居住'),
    expenseChildren.filter((c) => c.parentName === '餐饮'),
    expenseChildren.filter((c) => c.parentName === '交通'),
    expenseChildren.filter((c) => c.parentName === '购物'),
    expenseChildren.filter((c) => c.parentName === '休闲'),
    expenseChildren.filter((c) => c.parentName === '家庭'),
    expenseChildren.filter((c) => c.parentName === '人情'),
    expenseChildren.filter((c) => c.parentName === '特别'),
  ]

  for (let i = 0; i < count; i++) {
    const groupIdx = weightedRand(expenseWeights)
    const children = groups[groupIdx]
    if (children.length === 0) continue
    const cat = pick(children)

    // Map duplicate category name '红包转账' to unique key
    const poolKey = cat.name === '红包转账' && cat.parentName === '人情' ? '红包转账(支)' : cat.name
    const titles = titlePools[poolKey] ?? [cat.name]
    const title = pick(titles)

    let amount: number
    switch (cat.parentName) {
      case '居住':
        amount = cat.name === '房租房贷' ? rand(2000, 5000) : rand(50, 500)
        break
      case '餐饮':
        amount = rand(8, 80)
        break
      case '交通':
        amount = cat.name === '汽车加油' ? rand(200, 400) : cat.name === '汽车充电' ? rand(20, 80) : cat.name === '汽车消费' ? rand(200, 2000) : rand(2, 50)
        break
      case '购物':
        amount = rand(15, 500)
        break
      case '休闲':
        amount = rand(10, 300)
        break
      case '家庭':
        amount = rand(20, 500)
        break
      case '人情':
        amount = rand(50, 1000)
        break
      default:
        amount = rand(50, 200)
    }

    // Some transactions get tags
    const tags: string[] = []
    if (Math.random() < 0.3) {
      const tagMap: Record<string, string[]> = {
        '餐饮': ['外卖', '聚餐', '零食', '咖啡'],
        '交通': ['通勤', '交通'],
        '购物': ['网购', '日用品'],
        '休闲': ['娱乐', '健身', '学习'],
      }
      const catTags = tagMap[cat.parentName] ?? []
      if (catTags.length > 0) {
        tags.push(pick(catTags))
        if (Math.random() < 0.25) tags.push(pick(tagPool.filter((t) => !tags.includes(t))))
      }
    }

    txs.push({
      type: 'expense',
      title,
      amount,
      categoryId: cat.id,
      tags,
      note: pick(notePool),
      date: randomDate(endDate, 365),
      time: randomTime(),
    })
  }
  return txs
}

async function generateIncomes(count: number, endDate: Date): Promise<Transaction[]> {
  const txs: Transaction[] = []
  if (incomeChildren.length === 0) return txs

  // Salary on ~10th-15th each month
  const salaryCat = incomeChildren.find((c) => c.name === '税后薪酬')
  const bonusCats = incomeChildren.filter((c) => c.name === '绩效奖金' || c.name === '兼职外包')
  const passiveCat = incomeChildren.find((c) => c.name === '利息分红')
  const otherCats = incomeChildren.filter((c) => c.name === '转卖返现' || c.name === '红包转账')

  // Generate salary for past 12 months
  const now = endDate
  for (let m = 0; m < 12; m++) {
    const payDate = new Date(now.getFullYear(), now.getMonth() - m, rand(8, 15))
    if (salaryCat) {
      txs.push({
        type: 'income',
        title: '工资',
        amount: rand(12000, 18000),
        categoryId: salaryCat.id,
        tags: [],
        note: '',
        date: `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`,
        time: '10:00',
      })
    }
    // Quarterly bonus
    if (m % 3 === 0 && bonusCats.length > 0) {
      const bonusDate = new Date(now.getFullYear(), now.getMonth() - m, rand(15, 25))
      txs.push({
        type: 'income',
        title: '绩效奖金',
        amount: rand(3000, 8000),
        categoryId: pick(bonusCats).id,
        tags: [],
        note: `${Math.ceil((m + 1) / 3)}季度`,
        date: `${bonusDate.getFullYear()}-${String(bonusDate.getMonth() + 1).padStart(2, '0')}-${String(bonusDate.getDate()).padStart(2, '0')}`,
        time: '10:30',
      })
    }
  }

  // Extra random incomes
  for (let i = 0; i < count - 12 - 4; i++) {
    const cat = pick([...passiveCats(), ...otherCats])
    const titles = titlePools[cat.name] ?? [cat.name]
    txs.push({
      type: 'income',
      title: pick(titles),
      amount: rand(50, 2000),
      categoryId: cat.id,
      tags: [],
      note: pick(notePool),
      date: randomDate(now, 365),
      time: randomTime(),
    })
  }

  return txs
}

function passiveCats(): CategoryRef[] {
  return incomeChildren.filter((c) => c.parentName === '被动收入' || c.parentName === '其它收入')
}

// ── Main entry ──

export async function seedMockData(
  options: { expenseCount?: number; incomeCount?: number } = {},
): Promise<{ transactions: number; tags: number }> {
  const { expenseCount = 300, incomeCount = 50 } = options

  // Check if mock data already exists
  const existingCount = await db.transactions.count()
  if (existingCount > 100) {
    const ok = confirm(
      `数据库中已有 ${existingCount} 条交易记录。\n\n确定要追加 ${expenseCount + incomeCount} 条 mock 数据吗？\n（不会覆盖已有数据）`,
    )
    if (!ok) return { transactions: existingCount, tags: 0 }
  }

  console.log('📦 开始生成 mock 数据...')

  // Load actual category IDs from DB
  await loadCategories()
  console.log(`  ✓ 已加载 ${expenseChildren.length} 个支出子分类, ${incomeChildren.length} 个收入子分类`)

  const now = new Date()

  // Generate
  const expenseTxs = await generateExpenses(expenseCount, now)
  const incomeTxs = await generateIncomes(incomeCount, now)

  const allTxs = [...expenseTxs, ...incomeTxs]
  // Sort by date desc
  allTxs.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  // Collect unique tags for the tags table
  const uniqueTags = new Set<string>()
  for (const tx of allTxs) {
    for (const t of tx.tags) uniqueTags.add(t)
  }

  // Insert in bulk (batches of 500 for safety)
  const BATCH = 500
  let inserted = 0
  for (let i = 0; i < allTxs.length; i += BATCH) {
    const batch = allTxs.slice(i, i + BATCH)
    await db.transactions.bulkAdd(batch)
    inserted += batch.length
    console.log(`  ▶ 已插入 ${Math.min(inserted, allTxs.length)}/${allTxs.length} 条...`)
  }

  // Register tags in tags table
  let tagCount = 0
  for (const tagName of uniqueTags) {
    const exists = await db.tags.where('name').equals(tagName).first()
    if (!exists) {
      await db.tags.add({ name: tagName })
      tagCount++
    }
  }

  console.log(`\n✅ Mock 数据导入完成!`)
  console.log(`   💰 交易记录: ${inserted} 条 (${expenseTxs.length} 笔支出 + ${incomeTxs.length} 笔收入)`)
  console.log(`   🏷️  标签: ${uniqueTags.size} 个 (新增 ${tagCount} 个)`)

  return { transactions: inserted, tags: uniqueTags.size }
}