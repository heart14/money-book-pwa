import { reactive } from 'vue'

/**
 * 沙盒原型共享的"编辑状态"。A/B 两个原型共用同一份 reactive 状态，
 * 这样在 A ↔ B 之间来回切换时金额、分类、模式不会丢，方便直接对比。
 * 纯演示用，不依赖 store / DB。
 */
export type Mode = 'expense' | 'income' | 'transfer'

export const bookingState = reactive<{
  mode: Mode
  input: string
  selectedParentId: number | null
  selectedChildId: number | null
  keyboardVisible: boolean
}>({
  mode: 'expense',
  input: '0',
  selectedParentId: null,
  selectedChildId: null,
  keyboardVisible: false,
})

export const modeLabel: Record<Mode, string> = {
  expense: '支出',
  income: '收入',
  transfer: '转账',
}

/** 金额显示：由输入字符串实时换算成人民币格式 */
export function displayAmount(input: string): string {
  const v = input
  if (v === '0') return '¥0.00'
  if (v.includes('.')) {
    const [i, d = ''] = v.split('.')
    const fi = i ? parseInt(i).toLocaleString('zh-CN') : '0'
    if (d === '') return `¥${fi}.00`
    return `¥${fi}.${d.padEnd(2, '0')}`
  }
  return `¥${parseInt(v).toLocaleString('zh-CN')}`
}

/** 键盘输入逻辑（真实可点） */
export function keyPress(k: string) {
  const s = bookingState
  if (k === 'del') {
    s.input = s.input.length <= 1 ? '0' : s.input.slice(0, -1)
  } else if (k === '.') {
    if (!s.input.includes('.')) s.input = s.input + '.'
  } else {
    if (s.input === '0') s.input = k
    else if (s.input.length < 10) s.input = s.input + k
  }
}

export function keyLayout(): string[] {
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']
}