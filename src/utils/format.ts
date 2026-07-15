const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * Format a number (in 分/cents) to currency string.
 * Example: 128000 → "¥1,280.00"
 */
export function formatCurrency(n: number): string {
  const yuan = n / 100
  return `¥${yuan.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable label.
 * - Today → "今天"
 * - Yesterday → "昨天"
 * - Other → "7月15日 周三"
 */
export function formatDate(dateStr: string): string {
  const now = new Date()
  const todayStr = toDateString(now)

  if (dateStr === todayStr) return '今天'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === toDateString(yesterday)) return '昨天'

  const d = parseDateStr(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const wd = WEEKDAY_NAMES[d.getDay()]
  return `${month}月${day}日 ${wd}`
}

/**
 * Convert a Date to "YYYY-MM-DD" string.
 */
export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Format a combined date+time label.
 * - If date is today → "今天 12:30"
 * - If date is yesterday → "昨天 12:30"
 * - Otherwise → "7月15日 周三 12:30"
 */
export function formatTimeLabel(dateStr: string, timeStr: string): string {
  const timePart = timeStr.slice(0, 5)
  const dateLabel = formatDate(dateStr)
  return `${dateLabel} ${timePart}`
}

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}