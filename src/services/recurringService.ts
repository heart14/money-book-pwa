import { ref } from 'vue'
import { db } from '@/db'
import { useTransactionStore } from '@/stores/transactionStore'
import type { RecurringRule, Transaction } from '@/types'

/**
 * 周期规则执行引擎
 *
 * 负责判定哪些周期规则在当前时点「到期待入账」，并提供将规则落账为
 * 真实交易流水的方法（复用 transactionStore，保证 tag 同步 + UI 刷新）。
 *
 * 幂等策略：用 lastExecuted 记录「YYYY-MM」，表示该规则已在某个月份执行过
 * （无论用户手动记账还是点了跳过）。同一自然月内不会重复生成账单。
 */

/** 当前待入账规则列表（响应式，供 UI 展示） */
export const dueRules = ref<RecurringRule[]>([])

/** 计算某年某月（1-based）的天数 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** 生成 YYYY-MM 键（用于幂等去重 / 标记执行月份） */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 判定规则在给定日期（now）是否为「本月到期日」。
 * dayOfMonth 超过当月天数时顺延到月末（如 31 号 → 2 月 28/29 号）。
 */
export function isDueAt(rule: RecurringRule, now: Date): boolean {
  if (!rule.enabled) return false
  // 本月已执行过 → 不再待入账
  if (rule.lastExecuted === monthKey(now)) return false

  const effectiveDay = Math.min(rule.dayOfMonth, daysInMonth(now.getFullYear(), now.getMonth() + 1))
  return now.getDate() === effectiveDay
}

/** 生成当天日期字符串 YYYY-MM-DD */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 生成当天时间字符串 HH:MM:SS */
function timeKey(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

/**
 * 扫描库中所有启用的规则，刷新当前到期待入账列表。
 * - autoApply=true 的到期规则：直接自动落账（方案 B）。
 * - 其余到期规则：放入 dueRules 待用户手动确认（方案 A）。
 */
export async function loadDueRules(now: Date = new Date()): Promise<void> {
  const all = await db.recurringRules.toArray()

  // 1) 自动入账：到期且 autoApply=true
  const autoApplyOnes = all.filter((r) => r.autoApply && isDueAt(r, now))
  for (const r of autoApplyOnes) {
    try {
      await applyRule(r, dateKey(now), timeKey(now))
    } catch (e) {
      console.error('auto apply recurring rule failed', r.id, e)
    }
  }

  // 2) 待手动确认列表（排除已自动入账的）
  const autoApplyIds = new Set(autoApplyOnes.map((r) => r.id))
  dueRules.value = all.filter((r) => !autoApplyIds.has(r.id) && isDueAt(r, now))
}

/**
 * 将一条规则落账为真实交易流水，并把 lastExecuted 标记为当前月份。
 * 调用方可传入具体的 date / time（默认取当前日期时间）。
 */
export async function applyRule(
  rule: RecurringRule,
  dateStr: string,
  timeStr: string,
): Promise<void> {
  const tx: Omit<Transaction, 'id'> = {
    type: rule.type,
    title: rule.title,
    amount: rule.amount,
    categoryId: rule.categoryId,
    tags: rule.tags ? [...rule.tags] : [],
    note: rule.note,
    date: dateStr,
    time: timeStr,
  }

  if (rule.id != null) {
    await db.recurringRules.update(rule.id, { lastExecuted: monthKey(new Date()) })
  }

  await useTransactionStore().addTransaction(tx)

  // 落账成功后从待入账列表中移除
  dueRules.value = dueRules.value.filter((r) => r.id !== rule.id)
}

/**
 * 将一条规则标记为「本月已处理」（跳过，不落账）。
 * 例如：用户已手工记过账，或想忽略本月这比。
 */
export async function skipRule(rule: RecurringRule): Promise<void> {
  if (rule.id != null) {
    await db.recurringRules.update(rule.id, { lastExecuted: monthKey(new Date()) })
  }
  dueRules.value = dueRules.value.filter((r) => r.id !== rule.id)
}