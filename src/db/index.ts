import Dexie, { type Table } from 'dexie'
import type { Account, Category, Transaction, RecurringRule, Tag } from '@/types'

export class MoneyBookDB extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  recurringRules!: Table<RecurringRule, number>
  tags!: Table<Tag, number>

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
  }
}

export const db = new MoneyBookDB()