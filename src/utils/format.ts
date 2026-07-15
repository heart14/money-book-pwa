export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

export function formatDateDisplay(date: string): string {
  const d = new Date(date)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}