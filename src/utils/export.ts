import { db } from '@/db'

/**
 * Export all data (accounts, categories, transactions, recurring rules)
 * as a JSON file download.
 */
export async function exportData(): Promise<void> {
  const [accounts, categories, transactions, recurringRules, quickTemplates] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
    db.transactions.toArray(),
    db.recurringRules.toArray(),
    db.quickTemplates.toArray(),
  ])

  const data = { accounts, categories, transactions, recurringRules, quickTemplates }
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
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new Error('无法读取文件，请重试')
  }

  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('文件格式无效，请选择有效的 JSON 备份文件')
  }

  const accounts = data.accounts ?? []
  const categories = data.categories ?? []
  const transactions = data.transactions ?? []
  const recurringRules = data.recurringRules ?? []
  const quickTemplates = data.quickTemplates ?? []

  await db.transaction('rw', db.accounts, db.categories, db.transactions, db.recurringRules, db.quickTemplates, async () => {
    await Promise.all([
      db.accounts.clear(),
      db.categories.clear(),
      db.transactions.clear(),
      db.recurringRules.clear(),
      db.quickTemplates.clear(),
    ])

    await Promise.all([
      db.accounts.bulkAdd(accounts),
      db.categories.bulkAdd(categories),
      db.transactions.bulkAdd(transactions),
      db.recurringRules.bulkAdd(recurringRules),
      db.quickTemplates.bulkAdd(quickTemplates),
    ])
  })
}

/**
 * Destroy all data: clear all tables, delete all caches, and unregister service workers.
 */
export async function destroyAllData(): Promise<void> {
  await db.transaction('rw', db.accounts, db.categories, db.transactions, db.recurringRules, db.quickTemplates, async () => {
    await Promise.all([
      db.accounts.clear(),
      db.categories.clear(),
      db.transactions.clear(),
      db.recurringRules.clear(),
      db.quickTemplates.clear(),
    ])
  })

  // Clear all caches (may fail in non-secure context)
  try {
    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.map(key => caches.delete(key)))
  } catch {
    // Silently skip — caches API unavailable in non-secure context (e.g., LAN HTTP on iOS)
  }

  // Unregister all service workers (may fail in non-secure context)
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(reg => reg.unregister()))
  } catch {
    // Silently skip — serviceWorker unavailable in non-secure context
  }
}