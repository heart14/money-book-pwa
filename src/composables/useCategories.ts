import { ref, computed, onUnmounted } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/db'
import type { Category } from '@/types'

function useLiveQuery<T>(querier: () => Promise<T>) {
  const data = ref<T>() as import('vue').Ref<T>
  const subscription = liveQuery(querier).subscribe({
    next: (result) => { data.value = result as T },
    error: (err) => { console.error(err) },
  })
  onUnmounted(() => subscription.unsubscribe())
  return data
}

export function useCategories() {
  const categories = useLiveQuery(() =>
    db.categories.orderBy('sort').toArray()
  )

  const expenseTree = computed(() => {
    const list = categories.value ?? []
    return buildTree(list.filter(c => c.type === 'expense' && !c.isHidden))
  })

  const incomeTree = computed(() => {
    const list = categories.value ?? []
    return buildTree(list.filter(c => c.type === 'income' && !c.isHidden))
  })

  function buildTree(flat: Category[]) {
    const parents = flat.filter(c => c.parentId === null)
    return parents.map(p => ({
      ...p,
      children: flat.filter(c => c.parentId === p.id)
    }))
  }

  async function toggleLatteFactor(id: number) {
    const cat = categories.value?.find(c => c.id === id)
    if (cat) await db.categories.update(id, { isLatteFactor: !cat.isLatteFactor })
  }

  async function toggleHidden(id: number) {
    const cat = categories.value?.find(c => c.id === id)
    if (cat) await db.categories.update(id, { isHidden: !cat.isHidden })
  }

  return { categories, expenseTree, incomeTree, toggleLatteFactor, toggleHidden }
}