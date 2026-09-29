import { ref } from 'vue'
import { db } from '@/db'
import { useTransactionStore } from '@/stores/transactionStore'
import type { RecurringRule } from '@/types'

/**
 * 周期规则执行引擎
 *
 * 负责判定哪些周期规则在当前时点「到期待入账」，并将规则落账为真实交易流水。
 *
 * - 事务原子性：落账（写流水 + 同步标签 + 推进 lastExecuted）统一走
 *   transactionStore.applyRecurringRule，在【单一 Dexie 事务】内完成，
 *   任何一步失败都会整体回滚，杜绝“已入账但未标记（下月重复）”或
 *   “未入账但已标记（漏账）”两种脏状态。
 * - 回溯补记：对 autoApply=true 的规则，应用启动时会补记上次执行后
 *   漏掉的每一个到期月份，不再局限于“当天到期”。
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

/** 生成当天日期字符串 YYYY-MM-DD */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 生成当天时间字符串 HH:MM:SS */
function timeKey(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

/** 递增一个 YYYY-MM 键到下一个月 */
function addOneMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  return `${ny}-${String(nm).padStart(2, '0')}`
}

/** 计算某月（YYYY-MM）的有效到期日 YYYY-MM-DD；dayOfMonth 超限顺延到月末 */
function effectiveDueDate(ym: string, dayOfMonth: number): string {
  const [y, m] = ym.split('-').map(Number)
  const day = Math.min(dayOfMonth, daysInMonth(y, m))
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 判定规则在给定日期（now）是否为「本月到期日」。
 * dayOfMonth 超过当月天数时顺延到月末（如 31 号 → 2 月 28/29 号）。
 * 仅用于【手动待确认】规则（方案 A）；autoApply 规则统一走回溯补记 catchUpAutoApply。
 */
export function isDueAt(rule: RecurringRule, now: Date): boolean {
  if (!rule.enabled) return false
  // 本月已执行过 → 不再待入账
  if (rule.lastExecuted === monthKey(now)) return false

  const effectiveDay = Math.min(rule.dayOfMonth, daysInMonth(now.getFullYear(), now.getMonth() + 1))
  return now.getDate() === effectiveDay
}

/**
 * 原子落账：将一条规则在指定日期记为一笔真实交易，并把 lastExecuted 推进到 executedMonth。
 * 底层复用 transactionStore.applyRecurringRule（单事务，写入+标记不分离）。
 * 落账成功后从待入账列表中移除。
 */
async function persistPeriod(rule: RecurringRule, dateStr: string, timeStr: string, executedMonth: string): Promise<void> {
  await useTransactionStore().applyRecurringRule(rule, dateStr, timeStr, executedMonth)
  if (rule.id != null) {
    dueRules.value = dueRules.value.filter((r) => r.id !== rule.id)
  }
}

/**
 * 自动入账（方案 B）：补记该规则在 lastExecuted 之后到当前为止，所有已经过期的月份。
 * - 若 lastExecuted 为 null（从未执行）：只处理当前一个月份，避免凭空补录大量历史。
 * - 逐月推进：每个月先原子落账，再把 lastExecuted 推进到该月；任一失败抛错，由调用方决定成败。
 * 仅当月「到期日已在今天或之前」的一期会被补记；若本月到期日在未来，则留待后续 isDueAt 判定。
 */
async function catchUpAutoApply(rule: RecurringRule, now: Date): Promise<void> {
  if (!rule.enabled || !rule.autoApply) return

  const todayStr = dateKey(now)
  const timeStr = timeKey(now)
  const end = monthKey(now)

  // 起始月：lastExecuted 的下一个月；从未执行则从当前月开始
  let ym = rule.lastExecuted ? addOneMonth(rule.lastExecuted) : end

  // 保守兜底：最多回溯若干个月，避免异常数据导致长时间死循环
  let guard = 0
  while (ym <= end && guard < 120) {
    guard++
    const dueDate = effectiveDueDate(ym, rule.dayOfMonth)
    // 本期到期日在未来 → 本期尚未到点，交由 isDueAt 处理今天的匹配
    if (dueDate > todayStr) break

    // 原子落账并将 lastExecuted 推进到本期月份
    try {
      await persistPeriod(rule, dueDate, timeStr, ym)
      // persistPeriod 内已通过 transactionStore 更新 lastExecuted；刷新在内存中的 rule 供循环使用
      rule.lastExecuted = ym
    } catch (e) {
      console.error('auto apply recurring rule failed', rule.id, ym, e)
      break
    }
    ym = addOneMonth(ym)
  }
}

/**
 * 扫描库中所有启用的规则，刷新当前到期待入账列表。
 * - autoApply=true 的规则：执行跨月回溯补记（含今天到期的本期）。
 * - 其余规则：若今天为本月到期日，放入 dueRules 待用户手动确认（方案 A）。
 */
export async function loadDueRules(now: Date = new Date()): Promise<void> {
  const all = await db.recurringRules.toArray()

  // 1) 自动入账：补记所有错过的已到期月份（含今天）
  for (const r of all) {
    if (!r.enabled || !r.autoApply) continue
    try {
      // 深拷贝，避免内存中的 lastExecuted 直接改到共享引用（db 记录应始终以库中最新为准）
      await catchUpAutoApply({ ...r }, now)
    } catch (e) {
      console.error('catchUpAutoApply failed', r.id, e)
    }
  }

  // 2) 待手动确认列表：非 autoApply 且今日为本月到期日
  dueRules.value = all.filter((r) => r.enabled && !r.autoApply && isDueAt(r, now))
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
  await persistPeriod(rule, dateStr, timeStr, monthKey(new Date()))
}

/**
 * 将一条规则标记为「本月已处理」（跳过，不落账）。
 * 例如：用户已手工记过账，或想忽略本月这笔。
 * 跳过的幂等由 lastExecuted = 当前月 保证，与落账互斥。
 */
export async function skipRule(rule: RecurringRule): Promise<void> {
  if (rule.id != null) {
    await db.recurringRules.update(rule.id, { lastExecuted: monthKey(new Date()) })
  }
  dueRules.value = dueRules.value.filter((r) => r.id !== rule.id)
}