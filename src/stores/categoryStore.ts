import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/db'
import type { Category } from '@/types'

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])

  const subscription = liveQuery(() => db.categories.orderBy('sort').toArray()).subscribe({
    next: (data) => { categories.value = data },
    error: (err) => { console.error(err) },
  })

  const expenseTree = computed(() => {
    const list = categories.value.filter(c => c.type === 'expense' && !c.isHidden)
    return buildTree(list)
  })

  const incomeTree = computed(() => {
    const list = categories.value.filter(c => c.type === 'income' && !c.isHidden)
    return buildTree(list)
  })

  const latteFactorIds = computed(() =>
    categories.value.filter(c => c.isLatteFactor && c.parentId !== null).map(c => c.id!)
  )

  const flatExpenseSubCategories = computed(() =>
    categories.value.filter(c => c.type === 'expense' && c.parentId !== null)
  )

  function buildTree(flat: Category[]) {
    const parents = flat.filter(c => c.parentId === null)
    return parents.map(p => ({
      ...p,
      children: flat.filter(c => c.parentId === p.id)
    }))
  }

  async function toggleLatteFactor(id: number) {
    const cat = categories.value.find(c => c.id === id)
    if (cat) await db.categories.update(id, { isLatteFactor: !cat.isLatteFactor })
  }

  async function toggleHidden(id: number) {
    const cat = categories.value.find(c => c.id === id)
    if (cat) await db.categories.update(id, { isHidden: !cat.isHidden })
  }

  return { categories, expenseTree, incomeTree, latteFactorIds, flatExpenseSubCategories, toggleLatteFactor, toggleHidden, subscription }
})