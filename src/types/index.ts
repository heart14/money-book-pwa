export interface Account {
  id?: number
  name: string
  groupId: 'liquid' | 'restricted' | 'claim' | 'debt'
  balance: number
  icon: string
  sort: number
}

export interface Category {
  id?: number
  type: 'expense' | 'income'
  parentId: number | null
  name: string
  icon: string
  sort: number
}

export interface Transaction {
  id?: number
  type: 'expense' | 'income' | 'transfer'
  title: string
  amount: number
  fromAccountId: number | null
  toAccountId: number | null
  categoryId: number | null
  tags: string[]
  note: string
  date: string
  time: string
}

export interface RecurringRule {
  id?: number
  type: 'expense' | 'income' | 'transfer'
  title: string
  amount: number
  fromAccountId: number
  toAccountId: number | null
  categoryId: number | null
  tags: string[]
  note: string
  dayOfMonth: number
  enabled: boolean
  lastExecuted: string | null
}