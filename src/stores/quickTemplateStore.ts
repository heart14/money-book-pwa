import { defineStore } from 'pinia'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import type { QuickTemplate } from '@/types'

export const useQuickTemplateStore = defineStore('quickTemplates', () => {
  const templates = useLiveQuery(
    () => db.quickTemplates.orderBy('sort').toArray(),
    [] as QuickTemplate[],
  )

  /**
   * 添加模板。先检查 type + amount + categoryId 是否已存在，
   * 若存在则返回 false 并设置 duplicateMsg，否则添加并返回 true。
   */
  async function add(tpl: Omit<QuickTemplate, 'id'>): Promise<{ success: boolean; duplicateMsg?: string }> {
    // 检查 type + amount + categoryId 是否已存在
    const all = await db.quickTemplates.toArray()
    const dup = all.find(t => t.type === tpl.type && t.amount === tpl.amount && t.categoryId === tpl.categoryId)
    if (dup) {
      return { success: false, duplicateMsg: '该模板已存在' }
    }

    // 分配 sort = maxSort + 1
    const maxSort = all.reduce((max, t) => Math.max(max, t.sort), 0)
    tpl.sort = maxSort + 1

    await db.quickTemplates.add(tpl as QuickTemplate)
    return { success: true }
  }

  async function update(id: number, changes: Partial<QuickTemplate>): Promise<void> {
    await db.quickTemplates.update(id, changes)
  }

  async function remove(id: number): Promise<void> {
    await db.quickTemplates.delete(id)
  }

  /**
   * 批量更新排序：接收排序后的 ID 数组，按数组顺序分配 sort 1..N
   */
  async function reorder(ids: number[]): Promise<void> {
    await db.transaction('rw', db.quickTemplates, async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.quickTemplates.update(ids[i], { sort: i + 1 })
      }
    })
  }

  /**
   * 检查 type + amount + categoryId 是否已存在
   */
  async function isDuplicate(tpl: { type: string; amount: number; categoryId: number }): Promise<boolean> {
    const all = await db.quickTemplates.toArray()
    return all.some(t => t.type === tpl.type && t.amount === tpl.amount && t.categoryId === tpl.categoryId)
  }

  return { templates, add, update, remove, reorder, isDuplicate }
})