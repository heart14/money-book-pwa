import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/db'
import type { Account } from '@/types'

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])

  const subscription = liveQuery(() => db.accounts.orderBy('sort').toArray()).subscribe({
    next: (data) => { accounts.value = data },
    error: (err) => { console.error(err) },
  })

  const groupedAccounts = computed(() => {
    const groupOrder = ['流动性资产', '限制性资产', '债权', '负债'] as const
    return groupOrder
      .map(g => ({ groupName: g, accounts: accounts.value.filter(a => a.groupName === g) }))
      .filter(g => g.accounts.length > 0)
  })

  const netWorth = computed(() =>
    accounts.value.reduce((sum, a) => sum + a.balance, 0)
  )

  const totalAssets = computed(() =>
    accounts.value.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0)
  )

  const totalLiabilities = computed(() =>
    Math.abs(accounts.value.filter(a => a.type === 'debt').reduce((sum, a) => sum + a.balance, 0))
  )

  return { accounts, groupedAccounts, netWorth, totalAssets, totalLiabilities, subscription }
})