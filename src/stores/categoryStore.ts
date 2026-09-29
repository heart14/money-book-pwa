import { defineStore } from 'pinia'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useTransactionStore } from '@/stores/transactionStore'
import type { Category, RecurringRule, Transaction, QuickTemplate } from '@/types'

export const useCategoryStore = defineStore('categories', () => {
  const categories = useLiveQuery(
    () => db.categories.toArray().then(arr => arr.sort((a, b) => a.sort - b.sort)),
    [] as Category[],
  )

  function getByType(type: 'expense' | 'income' | 'transfer'): Category[] {
    return categories.value.filter((c: Category) => c.type === type)
  }

  function getParents(type?: 'expense' | 'income' | 'transfer'): Category[] {
    let list = categories.value
    if (type !== undefined) list = list.filter((c: Category) => c.type === type)
    return list.filter((c: Category) => c.parentId === null)
  }

  function getChildren(parentId: number): Category[] {
    return categories.value.filter((c: Category) => c.parentId === parentId)
  }

  async function addCategory(category: Omit<Category, 'id'>): Promise<number> {
    // Category.id 可选，Omit<...,'id'> 与 Category 结构兼容，无需断言
    return db.categories.add(category)
  }

  /**
   * 删除一个分类（含其子分类），并在【单一事务】内同步清理外部引用，避免产生悬空 categoryId：
   * - transactions.categoryId        → 置空 null（保留流水，不丢数据；统计会跳过无分类项）
   * - recurringRules.categoryId      → 置空 null（保留规则，展示兜底图标）
   * - quickTemplates.categoryId      → 删除该模板（模板强依赖分类存在，失效分类的模板已无意义）
   *
   * 分类删除本身会经 Dexie liveQuery 自动刷新分类列表；交易被置空后通过
   * transactionStore.bumpVersion() 手动通知明细页重新分页加载。
   */
  async function deleteCategory(id: number): Promise<void> {
    const children = await db.categories.where('parentId').equals(id).toArray()
    const ids = [id, ...children.map((c: Category) => c.id).filter((x): x is number => x != null)]
    if (ids.length === 0) return

    await db.transaction(
      'rw',
      [db.categories, db.transactions, db.recurringRules, db.quickTemplates],
      async (trx) => {
        // 1) 置空引用了被删分类的交易流水
        const txs = await trx.table<Transaction, number>('transactions')
          .filter((t) => t.categoryId != null && ids.includes(t.categoryId))
          .toArray()
        for (const t of txs) {
          if (t.id != null) {
            await trx.table<Transaction, number>('transactions').update(t.id, { categoryId: null })
          }
        }

        // 2) 置空引用了被删分类的周期规则
        const rules = await trx.table<RecurringRule, number>('recurringRules')
          .filter((r) => r.categoryId != null && ids.includes(r.categoryId))
          .toArray()
        for (const r of rules) {
          if (r.id != null) {
            await trx.table<RecurringRule, number>('recurringRules').update(r.id, { categoryId: null })
          }
        }

        // 3) 删除引用了被删分类的快记模板（模板强依赖分类存在）
        const tpls = await trx.table<QuickTemplate, number>('quickTemplates')
          .filter((t) => t.categoryId != null && ids.includes(t.categoryId))
          .toArray()
        for (const t of tpls) {
          if (t.id != null) {
            await trx.table<QuickTemplate, number>('quickTemplates').delete(t.id)
          }
        }

        // 4) 级联删除分类本身及其子分类
        await trx.table<Category, number>('categories').bulkDelete(ids)
      },
    )

    // 交易被置空，手动通知明细页刷新
    useTransactionStore().bumpVersion()
  }

  return {
    categories,
    getByType,
    getParents,
    getChildren,
    addCategory,
    deleteCategory,
  }
})