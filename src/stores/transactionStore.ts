import { defineStore } from 'pinia'
import { db } from '@/db'
import { liveQuery } from 'dexie'
import type { Transaction } from '@/types'

/**
 * Ensure all tag names in the given list exist in the tags table.
 * Silently skips duplicates (unique index &name will reject them).
 */
async function ensureTagsExist(names: string[]) {
  const unique = [...new Set(names.map((s) => s.trim()).filter(Boolean))]
  if (unique.length === 0) return
  for (const name of unique) {
    // Upsert by checking existence first to avoid noise in console
    const existing = await db.tags.where('name').equals(name).first()
    if (!existing) {
      try {
        await db.tags.add({ name })
      } catch {
        // race condition — another tab already added it, ignore
      }
    }
  }
}

export const useTransactionStore = defineStore('transactions', () => {
  async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<number> {
    const id = await db.transactions.add(tx as Transaction)
    // Sync tags to the tags table (fire-and-forget for perf, but ensure it runs)
    if (tx.tags && tx.tags.length > 0) {
      ensureTagsExist(tx.tags)
    }
    return id
  }

  async function updateTransaction(id: number, updates: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, updates as any)
    // Sync tags if the update includes them
    if (updates.tags && updates.tags.length > 0) {
      ensureTagsExist(updates.tags)
    }
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