import { db } from '@/db'

/**
 * Export all data (accounts, categories, transactions, recurring rules)
 * as a JSON file download.
 */
export async function exportData(): Promise<void> {
  const [accounts, categories, transactions, recurringRules] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
    db.transactions.toArray(),
    db.recurringRules.toArray(),
  ])

  const data = { accounts, categories, transactions, recurringRules }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `money-book-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import data from a JSON file.
 * Clears all 4 tables first, then bulk-adds the imported data.
 */
export async function importData(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text)

  const accounts = data.accounts ?? []
  const categories = data.categories ?? []
  const transactions = data.transactions ?? []
  const recurringRules = data.recurringRules ?? []

  await db.transaction('rw', db.accounts, db.categories, db.transactions, db.recurringRules, async () => {
    await Promise.all([
      db.accounts.clear(),
      db.categories.clear(),
      db.transactions.clear(),
      db.recurringRules.clear(),
    ])

    await Promise.all([
      db.accounts.bulkAdd(accounts),
      db.categories.bulkAdd(categories),
      db.transactions.bulkAdd(transactions),
      db.recurringRules.bulkAdd(recurringRules),
    ])
  })
}

/**
 * Destroy all data: clear all tables, delete all caches, and unregister service workers.
 */
export async function destroyAllData(): Promise<void> {
  await db.transaction('rw', db.accounts, db.categories, db.transactions, db.recurringRules, async () => {
    await Promise.all([
      db.accounts.clear(),
      db.categories.clear(),
      db.transactions.clear(),
      db.recurringRules.clear(),
    ])
  })

  // Clear all caches
  const cacheKeys = await caches.keys()
  await Promise.all(cacheKeys.map(key => caches.delete(key)))

  // Unregister all service workers
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(reg => reg.unregister()))
}