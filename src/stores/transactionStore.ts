import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/db'
import type { Transaction, TransactionType } from '@/types'

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])

  const subscription = liveQuery(() => db.transactions.orderBy('date').reverse().toArray()).subscribe({
    next: (data) => { transactions.value = data },
    error: (err) => { console.error(err) },
  })

  const currentFilterType = ref<TransactionType | 'all'>('all')
  const currentMonth = ref(new Date().toISOString().slice(0, 7))

  const filteredTransactions = computed(() =>
    transactions.value.filter(t =>
      (currentFilterType.value === 'all' || t.type === currentFilterType.value) &&
      t.date.startsWith(currentMonth.value)
    )
  )

  const monthlyTransactions = computed(() =>
    transactions.value.filter(t => t.date.startsWith(currentMonth.value))
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

  return { transactions, filteredTransactions, monthlyTransactions, currentFilterType, currentMonth, addTransaction, deleteTransaction, subscription }
})