import { defineStore } from 'pinia'
import { computed } from 'vue'
import { db } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import type { Account } from '@/types'

export const useAccountStore = defineStore('accounts', () => {
  const accounts = useLiveQuery(
    () => db.accounts.toArray().then(arr => arr.sort((a, b) => a.sort - b.sort)),
    [] as Account[],
  )

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