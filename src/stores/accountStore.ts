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

  const totalAssets = computed(() => {
    return accounts.value.reduce((sum: number, a: Account) => (a.groupId === 'debt' ? sum : sum + a.balance), 0)
  })

  const totalLiabilities = computed(() => {
    return accounts.value.reduce((sum: number, a: Account) => (a.groupId === 'debt' ? sum + Math.abs(a.balance) : sum), 0)
  })

  const netWorth = computed(() => totalAssets.value - totalLiabilities.value)

  function calcNetWorth(): { totalAssets: number; totalLiabilities: number; netWorth: number } {
    let assets = 0
    let liab = 0
    for (const acc of accounts.value) {
      if (acc.groupId === 'debt') liab += Math.abs(acc.balance)
      else assets += acc.balance
    }
    return { totalAssets: assets, totalLiabilities: liab, netWorth: assets - liab }
  }

  function getAccountsByGroup(groupId: Account['groupId']): Account[] {
    return accounts.value.filter((a: Account) => a.groupId === groupId)
  }

  async function addAccount(account: Omit<Account, 'id'>): Promise<number> {
    return db.accounts.add(account as Account)
  }

  async function updateAccount(id: number, changes: Partial<Account>): Promise<number> {
    return db.accounts.update(id, changes)
  }

  async function deleteAccount(id: number): Promise<void> {
    const count = await db.transactions
      .where('fromAccountId')
      .equals(id)
      .or('toAccountId')
      .equals(id)
      .count()
    if (count > 0) throw new Error('该账户已有流水记录，无法删除')
    await db.accounts.delete(id)
  }

  return {
    accounts,
    netWorth,
    totalAssets,
    totalLiabilities,
    calcNetWorth,
    getAccountsByGroup,
    addAccount,
    updateAccount,
    deleteAccount,
  }
})