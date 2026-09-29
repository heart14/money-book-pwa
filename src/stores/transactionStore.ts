import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import { liveQuery, type Table, type Transaction as DexieTransaction } from 'dexie'
import type { RecurringRule, Tag, Transaction } from '@/types'

/**
 * Ensure all tag names in the given list exist in the tags table.
 * Silently skips duplicates (unique index &name will reject them).
 * Accepts an optional explicit transaction so it can run inside a
 * Dexter transaction and stay atomic with the owning write.
 */
async function ensureTagsExist(names: string[], table: Table<Tag, number> = db.tags) {
  const unique = [...new Set(names.map((s) => s.trim()).filter(Boolean))]
  if (unique.length === 0) return
  for (const name of unique) {
    // Upsert by checking existence first to avoid noise in console
    const existing = await table.where('name').equals(name).first()
    if (!existing) {
      try {
        await table.add({ name })
      } catch {
        // race condition — another tab already added it, ignore
      }
    }
  }
}

function buildTransactionRaw(rule: Pick<RecurringRule, 'type' | 'title' | 'amount' | 'categoryId' | 'tags' | 'note'>, dateStr: string, timeStr: string): Omit<Transaction, 'id'> {
  return {
    type: rule.type,
    title: rule.title,
    amount: rule.amount,
    categoryId: rule.categoryId,
    tags: rule.tags ? [...rule.tags] : [],
    note: rule.note,
    date: dateStr,
    time: timeStr,
  }
}

export const useTransactionStore = defineStore('transactions', () => {
  // ── 全局数据版本号，每次增删改时递增 ──
  const _version = ref(0)
  const version = computed(() => _version.value)

  function bumpVersion() {
    _version.value++
  }

  async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<number> {
    // Transaction.id 可选，Omit<...,'id'> 与 Transaction 结构兼容，无需断言
    const id = await db.transactions.add(tx)
    // Sync tags to the tags table (fire-and-forget for perf, but ensure it runs)
    if (tx.tags && tx.tags.length > 0) {
      ensureTagsExist(tx.tags)
    }
    bumpVersion()
    return id
  }

  async function updateTransaction(id: number, updates: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, updates)
    // Sync tags if the update includes them
    if (updates.tags && updates.tags.length > 0) {
      ensureTagsExist(updates.tags)
    }
    bumpVersion()
  }

  async function deleteTransaction(id: number): Promise<void> {
    await db.transactions.delete(id)
    bumpVersion()
  }

  /**
   * 周期规则落账：在【单一 Dexie 事务】内完成
   *  - 写入 transactions
   *  - 同步 tags
   *  - 推进规则 lastExecuted = executedMonth
   * 从而保证“落账 + 标记已执行”原子性：
   * 任一失败则整体回滚，不会出现“已入账但未标记(下月重复)”或“未入账但已标记(漏账)”。
   * 事务提交成功后 bumpVersion，通知明细页刷新。
   */
  async function applyRecurringRule(
    rule: Pick<RecurringRule, 'id' | 'type' | 'title' | 'amount' | 'categoryId' | 'tags' | 'note'>,
    dateStr: string,
    timeStr: string,
    executedMonth: string,
  ) {
    const raw = buildTransactionRaw(rule, dateStr, timeStr)
    await db.transaction('rw', [db.transactions, db.recurringRules, db.tags], async (trx: DexieTransaction) => {
      if (rule.tags && rule.tags.length > 0) {
        await ensureTagsExist(rule.tags, trx.table<Tag, number>('tags'))
      }
      await trx.table('transactions').add(raw)
      if (rule.id != null) {
        await trx.table('recurringRules').update(rule.id, { lastExecuted: executedMonth })
      }
    })
    bumpVersion()
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
    version,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    applyRecurringRule,
    getByDateRange,
    // 供分类删除等跨 store 场景在直接写库后手动通知明细页刷新
    bumpVersion,
  }
})