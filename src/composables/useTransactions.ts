import { ref, onUnmounted } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/db'
import type { Transaction } from '@/types'

function useLiveQuery<T>(querier: () => Promise<T>) {
  const data = ref<T>() as import('vue').Ref<T>
  const subscription = liveQuery(querier).subscribe({
    next: (result) => { data.value = result as T },
    error: (err) => { console.error(err) },
  })
  onUnmounted(() => subscription.unsubscribe())
  return data
}

export function useTransactions() {
  const transactions = useLiveQuery(() =>
    db.transactions.orderBy('date').reverse().toArray()
  )

  async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
    const now = new Date().toISOString()
    await db.transaction('rw', db.transactions, db.accounts, async () => {
      const id = await db.transactions.add({ ...tx, createdAt: now } as Transaction)
      if (tx.fromAccountId) {
        const from = await db.accounts.get(tx.fromAccountId)
        if (from) await db.accounts.update(tx.fromAccountId, { balance: +(from.balance - tx.amount).toFixed(2) })
      }
      if (tx.toAccountId) {
        const to = await db.accounts.get(tx.toAccountId)
        if (to) await db.accounts.update(tx.toAccountId, { balance: +(to.balance + tx.amount).toFixed(2) })
      }
      return id
    })
  }

  async function deleteTransaction(id: number) {
    await db.transaction('rw', db.transactions, db.accounts, async () => {
      const tx = await db.transactions.get(id)
      if (!tx) return
      if (tx.fromAccountId) {
        const a = await db.accounts.get(tx.fromAccountId)
        if (a) await db.accounts.update(tx.fromAccountId, { balance: +(a.balance + tx.amount).toFixed(2) })
      }
      if (tx.toAccountId) {
        const a = await db.accounts.get(tx.toAccountId)
        if (a) await db.accounts.update(tx.toAccountId, { balance: +(a.balance - tx.amount).toFixed(2) })
      }
      await db.transactions.delete(id)
    })
  }

  return { transactions, addTransaction, deleteTransaction }
}