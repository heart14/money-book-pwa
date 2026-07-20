import { defineStore } from 'pinia'
import { db } from '@/db'
import { liveQuery } from 'dexie'
import type { Transaction } from '@/types'

export const useTransactionStore = defineStore('transactions', () => {
  async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<number> {
    return db.transactions.add(tx as Transaction)
  }

  async function updateTransaction(id: number, updates: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, updates as any)
  }

  async function deleteTransaction(id: number): Promise<void> {
    await db.transactions.delete(id)
  }

  function getByDateRange(start: string, end: string) {
    return liveQuery(() =>
      db.transactions
        .where('date')
        .between(start, end, true, true)
        .reverse()
        .toArray(),
    )
  }

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getByDateRange,
  }
})