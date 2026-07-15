// ========== 账户 ==========
export type AccountType = 'liquid' | 'restricted' | 'claim' | 'debt'
export type AccountGroupName = '流动性资产' | '限制性资产' | '债权' | '负债'

export interface Account {
  id?: number
  groupId: number
  groupName: AccountGroupName
  name: string
  type: AccountType
  icon: string
  balance: number
  isCommon: boolean
  sort: number
}

// ========== 分类 ==========
export type CategoryType = 'expense' | 'income'

export interface Category {
  id?: number
  type: CategoryType
  parentId: number | null
  name: string
  icon: string
  attribute?: string
  isLatteFactor: boolean
  isHidden: boolean
  sort: number
}

// ========== 流水 ==========
export type TransactionType = 'expense' | 'income' | 'transfer'

export interface Transaction {
  id?: number
  type: TransactionType
  amount: number
  fromAccountId: number | null
  toAccountId: number | null
  categoryId: number | null
  tags: string[]
  note: string
  date: string
  createdAt: string
}