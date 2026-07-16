import { defineStore } from 'pinia'
import { db } from '@/db'
import { liveQuery } from 'dexie'
import type { Transaction } from '@/types'

export const useTransactionStore = defineStore('transactions', () => {
  async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<number> {
    return db.transaction('rw', db.transactions, db.accounts, async () => {
      const id = await db.transactions.add(tx as Transaction)

      if (tx.type === 'expense' && tx.fromAccountId != null) {
        const account = await db.accounts.get(tx.fromAccountId)
        if (account) {
          account.balance -= tx.amount
          await db.accounts.put(account)
        }
      } else if (tx.type === 'income' && tx.toAccountId != null) {
        const account = await db.accounts.get(tx.toAccountId)
        if (account) {
          account.balance += tx.amount
          await db.accounts.put(account)
        }
      } else if (tx.type === 'transfer') {
        if (tx.fromAccountId != null) {
          const from = await db.accounts.get(tx.fromAccountId)
          if (from) {
            from.balance -= tx.amount
            await db.accounts.put(from)
          }
        }
        if (tx.toAccountId != null) {
          const to = await db.accounts.get(tx.toAccountId)
          if (to) {
            to.balance += tx.amount
            await db.accounts.put(to)
          }
        }
      }

      return id
    })
  }

  async function updateTransaction(id: number, updates: Partial<Transaction>): Promise<void> {
    await db.transaction('rw', db.transactions, db.accounts, async () => {
      const old = await db.transactions.get(id)
      if (!old) throw new Error('交易记录不存在')

      // If amount changed, reverse old balance and apply new
      if (updates.amount !== undefined && updates.amount !== old.amount) {
        // Reverse old
        await _reverse(old)
        // Apply new
        const merged = { ...old, ...updates, amount: updates.amount }
        await _apply(merged)
      }

      // Update record fields
      await db.transactions.update(id, updates as any)
    })
  }

  async function _reverse(tx: Transaction): Promise<void> {
    if (tx.type === 'expense' && tx.fromAccountId != null) {
      const account = await db.accounts.get(tx.fromAccountId)
      if (account) { account.balance += tx.amount; await db.accounts.put(account) }
    } else if (tx.type === 'income' && tx.toAccountId != null) {
      const account = await db.accounts.get(tx.toAccountId)
      if (account) { account.balance -= tx.amount; await db.accounts.put(account) }
    } else if (tx.type === 'transfer') {
      if (tx.fromAccountId != null) {
        const from = await db.accounts.get(tx.fromAccountId)
        if (from) { from.balance += tx.amount; await db.accounts.put(from) }
      }
      if (tx.toAccountId != null) {
        const to = await db.accounts.get(tx.toAccountId)
        if (to) { to.balance -= tx.amount; await db.accounts.put(to) }
      }
    }
  }

  async function _apply(tx: Transaction): Promise<void> {
    if (tx.type === 'expense' && tx.fromAccountId != null) {
      const account = await db.accounts.get(tx.fromAccountId)
      if (account) { account.balance -= tx.amount; await db.accounts.put(account) }
    } else if (tx.type === 'income' && tx.toAccountId != null) {
      const account = await db.accounts.get(tx.toAccountId)
      if (account) { account.balance += tx.amount; await db.accounts.put(account) }
    } else if (tx.type === 'transfer') {
      if (tx.fromAccountId != null) {
        const from = await db.accounts.get(tx.fromAccountId)
        if (from) { from.balance -= tx.amount; await db.accounts.put(from) }
      }
      if (tx.toAccountId != null) {
        const to = await db.accounts.get(tx.toAccountId)
        if (to) { to.balance += tx.amount; await db.accounts.put(to) }
      }
    }
  }

  async function reverseTransaction(tx: Transaction): Promise<void> {
    return _reverse(tx)
  }

  async function deleteTransaction(id: number): Promise<void> {
    await db.transaction('rw', db.transactions, db.accounts, async () => {
      const tx = await db.transactions.get(id)
      if (!tx) throw new Error('交易记录不存在')
      await reverseTransaction(tx)
      await db.transactions.delete(id)
    })
  }

  function getByDateRange(start: string, end: string) {
    return liveQuery(() =>
      db.transactions
        .where('date')
        .between(start, end)
        .reverse()
        .toArray(),
    )
  }

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    reverseTransaction,
    getByDateRange,
  }
})