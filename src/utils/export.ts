import { db } from '@/db'

export async function exportData(): Promise<void> {
  const accounts = await db.accounts.toArray()
  const categories = await db.categories.toArray()
  const transactions = await db.transactions.toArray()
  const data = { version: 1, exportedAt: new Date().toISOString(), accounts, categories, transactions }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `钱书备份_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data.accounts || !data.categories || !data.transactions) {
    throw new Error('无效的备份文件')
  }
  await db.transaction('rw', db.accounts, db.categories, db.transactions, async () => {
    await db.accounts.clear()
    await db.categories.clear()
    await db.transactions.clear()
    await db.accounts.bulkAdd(data.accounts)
    await db.categories.bulkAdd(data.categories)
    await db.transactions.bulkAdd(data.transactions)
  })
}

export async function destroyAllData(): Promise<void> {
  await db.delete()
  const keys = await caches.keys()
  await Promise.all(keys.map(k => caches.delete(k)))
  const registrations = await navigator.serviceWorker?.getRegistrations()
  await Promise.all(registrations?.map(r => r.unregister()) ?? [])
  // Reset: reload will re-initialize
  window.location.reload()
}