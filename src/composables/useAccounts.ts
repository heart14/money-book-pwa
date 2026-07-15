import { ref, onUnmounted } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/db'
import type { Account } from '@/types'

function useLiveQuery<T>(querier: () => Promise<T>) {
  const data = ref<T>() as import('vue').Ref<T>
  const subscription = liveQuery(querier).subscribe({
    next: (result) => { data.value = result as T },
    error: (err) => { console.error(err) },
  })
  onUnmounted(() => subscription.unsubscribe())
  return data
}

export function useAccounts() {
  const accounts = useLiveQuery(() =>
    db.accounts.orderBy('sort').toArray()
  )

  async function addAccount(account: Omit<Account, 'id'>) {
    return db.accounts.add(account as Account)
  }

  async function updateBalance(id: number, newBalance: number) {
    return db.accounts.update(id, { balance: newBalance })
  }

  async function deleteAccount(id: number) {
    return db.accounts.delete(id)
  }

  return { accounts, addAccount, updateBalance, deleteAccount }
}