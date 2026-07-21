import { defineStore } from 'pinia'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import type { Category } from '@/types'

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
    return db.categories.add(category as Category)
  }

  async function deleteCategory(id: number): Promise<void> {
    const children = await db.categories.where('parentId').equals(id).toArray()
    const idsToDelete = [id, ...children.map((c: Category) => c.id as number)]
    await db.categories.bulkDelete(idsToDelete)
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