export interface Account {
  id?: number
  name: string
  balance: number
  icon: string
  sort: number
}

export interface Category {
  id?: number
  type: 'expense' | 'income' | 'transfer'
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
  categoryId: number | null
  tags: string[]
  note: string
  date: string
  time: string
}

export interface Tag {
  id?: number
  name: string
}

export interface RecurringRule {
  id?: number
  type: 'expense' | 'income'
  title: string
  amount: number
  categoryId: number | null
  tags: string[]
  note: string
  dayOfMonth: number
  enabled: boolean
  lastExecuted: string | null
}