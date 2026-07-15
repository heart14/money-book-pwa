import Dexie, { type Table } from 'dexie'
import type { Account, Category, Transaction } from '@/types'

export class MoneyBookDB extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>

  constructor() {
    super('MoneyBookDB')
    this.version(1).stores({
      accounts: '++id, groupId, name, type, balance, isCommon, sort',
      categories: '++id, type, parentId, name, isLatteFactor, isHidden, sort',
      transactions: '++id, type, amount, fromAccountId, toAccountId, categoryId, date, createdAt',
    })
  }
}

export const db = new MoneyBookDB()