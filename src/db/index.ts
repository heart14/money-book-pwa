import Dexie, { type Table } from 'dexie'
import type { Category, Transaction, RecurringRule, Tag, QuickTemplate, Diary } from '@/types'

export class MoneyBookDB extends Dexie {
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  recurringRules!: Table<RecurringRule, number>
  tags!: Table<Tag, number>
  quickTemplates!: Table<QuickTemplate, number>
  diaries!: Table<Diary, number>

  constructor() {
    super('moneybook')

    this.version(2).stores({
      accounts: '++id, name',
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId',
      recurringRules: '++id, enabled, dayOfMonth',
    })

    this.version(3).stores({
      accounts: '++id, name',
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId',
      recurringRules: '++id, enabled, dayOfMonth',
      tags: '++id, &name',
    }).upgrade(async (tx) => {
      // Seed the tags table from existing transaction tags
      const allTxs = await tx.table('transactions').toArray()
      const tagSet = new Set<string>()
      for (const txRecord of allTxs) {
        for (const tag of (txRecord as any).tags || []) {
          if (tag) tagSet.add(tag)
        }
      }
      const tagEntries = Array.from(tagSet).sort().map((name) => ({ name }))
      if (tagEntries.length > 0) {
        await tx.table('tags').bulkAdd(tagEntries)
      }
    })

    // v4: 为游标分页添加 [date+id] 复合索引
    this.version(4).stores({
      accounts: '++id, name',
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId, [date+id]',
      recurringRules: '++id, enabled, dayOfMonth',
      tags: '++id, &name',
    })

    // v5: 快捷记账气泡模板
    this.version(5).stores({
      accounts: '++id, name',
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId, [date+id]',
      recurringRules: '++id, enabled, dayOfMonth',
      tags: '++id, &name',
      quickTemplates: '++id, type, sort',
    })

    // v6: 移除独立账户体系。accounts 表不再被 schema 声明，Dexie 升级时自动丢弃该表。
    this.version(6).stores({
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId, [date+id]',
      recurringRules: '++id, enabled, dayOfMonth',
      tags: '++id, &name',
      quickTemplates: '++id, type, sort',
    })

    // v7: 新增「日记」独立表（日期 + 正文），一天一条。
    this.version(7).stores({
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId, [date+id]',
      recurringRules: '++id, enabled, dayOfMonth',
      tags: '++id, &name',
      quickTemplates: '++id, type, sort',
      diaries: '++id, date',
    })

    // v8: 日记「一天一条」强制——date 改为唯一索引 &date。
    //   迁移时先按日期去重（同日期仅保留 id 最大的一条），避免唯一索引建立失败。
    this.version(8).stores({
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId, [date+id]',
      recurringRules: '++id, enabled, dayOfMonth',
      tags: '++id, &name',
      quickTemplates: '++id, type, sort',
      diaries: '++id, &date',
    }).upgrade(async (tx) => {
      const all = await tx.table('diaries').toArray()
      const newestByDate = new Map<string, number>() // date → 最大 id
      for (const d of all) {
        if (d.id == null) continue
        const prev = newestByDate.get(d.date)
        if (prev == null || d.id > prev) newestByDate.set(d.date, d.id)
      }
      const toRemove = all
        .filter((d) => d.id != null && newestByDate.get(d.date) !== d.id)
        .map((d) => d.id as number)
      if (toRemove.length > 0) {
        await tx.table('diaries').bulkDelete(toRemove)
      }
    })
  }
}

export const db = new MoneyBookDB()