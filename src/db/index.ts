import Dexie, { type Table } from 'dexie'
import type { Account, Category, Transaction, RecurringRule } from '@/types'

export class MoneyBookDB extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  recurringRules!: Table<RecurringRule, number>

  constructor() {
    super('moneybook')
    this.version(1).stores({
      accounts: '++id, groupId, name',
      categories: '++id, type, parentId',
      transactions: '++id, type, date, fromAccountId, toAccountId, categoryId',
      recurringRules: '++id, enabled, dayOfMonth',
    })
  }
}

export const db = new MoneyBookDB()