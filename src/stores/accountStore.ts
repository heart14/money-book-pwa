import { defineStore } from 'pinia'
import { ref, computed, watchEffect } from 'vue'
import { db } from '@/db'
import { liveQuery } from 'dexie'
import type { Account } from '@/types'

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])

  watchEffect((onCleanup) => {
    const observable = liveQuery(() =>
      db.accounts.toArray().then(arr => arr.sort((a, b) => a.sort - b.sort))
    )
    const sub = observable.subscribe({
      next: (result) => {
        accounts.value = result
      },
    })
    onCleanup(() => sub.unsubscribe())
  })

  /** 总资产 = 所有账户余额之和 */
  const totalBalance = computed(() => {
    return accounts.value.reduce((sum, a) => sum + a.balance, 0)
  })

  async function addAccount(account: Omit<Account, 'id'>): Promise<number> {
    return db.accounts.add(account as Account)
  }

  async function updateAccount(id: number, changes: Partial<Account>): Promise<number> {
    return db.accounts.update(id, changes)
  }

  async function deleteAccount(id: number): Promise<void> {
    await db.accounts.delete(id)
  }

  return {
    accounts,
    totalBalance,
    addAccount,
    updateAccount,
    deleteAccount,
  }
})