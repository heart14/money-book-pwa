import Dexie, { type Table } from 'dexie'
import type { Account, Category, Transaction, RecurringRule } from '@/types'

export class MoneyBookDB extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  recurringRules!: Table<RecurringRule, number>

  constructor() {
    super('moneybook')
    this.version(2).stores({
      accounts: '++id, name',
      categories: '++id, type, parentId',
      transactions: '++id, type, date, categoryId',
      recurringRules: '++id, enabled, dayOfMonth',
    })
  }
}

export const db = new MoneyBookDB()