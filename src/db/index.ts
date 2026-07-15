import Dexie from 'dexie'

export class MoneyBookDB extends Dexie {
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