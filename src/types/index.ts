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

export interface QuickTemplate {
  id?: number
  /** 用户自定义名称，如"每日咖啡" */
  name: string
  /** 记账模式 */
  type: 'expense' | 'income' | 'transfer'
  /** 金额（分） */
  amount: number
  /** 分类 ID */
  categoryId: number
  /** 标题（可选） */
  title: string
  /** 标签列表（可选） */
  tags: string[]
  /** 备注（可选） */
  note: string
  /** 排序序号，用于拖动排序 */
  sort: number
}