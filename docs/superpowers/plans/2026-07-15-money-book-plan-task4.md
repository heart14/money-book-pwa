# Task 4: Pinia Stores + Utils 详细实现

## Store: accountStore

`src/stores/accountStore.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import { liveQuery } from 'dexie'
import { useObservable } from '@vueuse/core'
import type { Account, AccountGroupId } from '@/types'

export const useAccountStore = defineStore('accounts', () => {
  const accounts = useObservable<Account[]>(
    liveQuery(() => db.accounts.orderBy('sort').toArray())
  )
  const netWorth = ref(0)
  const totalAssets = ref(0)
  const totalLiabilities = ref(0)

  function calcNetWorth() {
    const list = accounts.value || []
    let assets = 0; let liab = 0
    for (const acc of list) {
      if (acc.groupId === 'debt') liab += Math.abs(acc.balance)
      else assets += acc.balance
    }
    totalAssets.value = assets
    totalLiabilities.value = liab
    netWorth.value = assets - liab
  }

  function getAccountsByGroup(groupId: AccountGroupId): Account[] {
    return (accounts.value || []).filter(a => a.groupId === groupId)
  }

  async function addAccount(account: Omit<Account, 'id'>) { await db.accounts.add(account) }
  async function updateAccount(id: number, changes: Partial<Account>) { await db.accounts.update(id, changes) }

  async function deleteAccount(id: number) {
    const count = await db.transactions.where('fromAccountId').equals(id).or('toAccountId').equals(id).count()
    if (count > 0) throw new Error('该账户已有流水记录，无法删除')
    await db.accounts.delete(id)
  }

  return { accounts, netWorth, totalAssets, totalLiabilities, calcNetWorth, getAccountsByGroup, addAccount, updateAccount, deleteAccount }
})
```

## Store: categoryStore

`src/stores/categoryStore.ts` — 使用 liveQuery 获取全部，提供 `getByType(type)`, `getParents(type)`, `getChildren(parentId)`, `addCategory`, `deleteCategory`（删除一级同时删子级）。

## Store: transactionStore

`src/stores/transactionStore.ts` — 核心逻辑：

**addTransaction:** 在 `db.transaction('rw', ...)` 中：
1. `db.transactions.add(tx)`
2. expense：`fromAccount.balance -= amount`
3. income：`toAccount.balance += amount`
4. transfer：`from.balance -= amount`, `to.balance += amount`

**deleteTransaction:** 读取旧 tx → `reverseTransaction(tx)` 反向还原 → 删除

**reverseTransaction:** expense 加回余额，income 减回，transfer 双向还原

**getByDateRange:** 返回 `liveQuery(() => db.transactions.where('date').between(start, end).reverse().toArray())`

## Store: uiStore

`src/stores/uiStore.ts` — bookingMode('expense'|'income'|'transfer'), bookingAmount(分), lastAccountId, lastCategoryId

## Utils

### format.ts
- `formatCurrency(n: number)` → `¥1,280.00`
- `formatDate(dateStr: string)` → `今天` / `昨天` / `7月15日 周三`
- `toDateString(d: Date)` → `2026-07-15`
- `formatTimeLabel(dateStr, timeStr)` → `今天 12:30`

### crypto.ts
- `hashPIN(pin: string)` → SHA-256 hex
- `getStoredPINHash()` / `setStoredPINHash(hash)` / `clearPIN()` → localStorage

### export.ts
- `exportData()` → JSON blob 下载
- `importData(file: File)` → 清空 4 张表 + bulkAdd
- `destroyAllData()` → 清空表 + 注销 SW + 清 Cache