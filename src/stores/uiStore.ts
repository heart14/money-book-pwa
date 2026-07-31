import { defineStore } from 'pinia'
import { ref } from 'vue'

export type BookingMode = 'expense' | 'income' | 'transfer'
export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSizeLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const useUiStore = defineStore('ui', () => {
  // ── Theme state ──
  const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'system')

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    localStorage.setItem('theme', mode)
  }

  // ── FontSize state ──
  const fontSize = ref<FontSizeLevel>((localStorage.getItem('fontSize') as FontSizeLevel) || 'md')

  function setFontSize(level: FontSizeLevel) {
    fontSize.value = level
    localStorage.setItem('fontSize', level)
  }

  // ── PIN lock state ──
  const unlocked = ref(true)

  // ── Booking mode state ──
  const bookingMode = ref<BookingMode>('expense')
  const bookingAmount = ref<number>(0)
  
  // ── TabBar booking save bridge ──
  const bookingSaveTrigger = ref(0)
  const bookingCanSave = ref(false)
  const bookingHintVisible = ref(false)

  let hintTimer: ReturnType<typeof setTimeout> | null = null

  function setMode(mode: BookingMode) {
    bookingMode.value = mode
  }

  function setAmount(amount: number) {
    bookingAmount.value = amount
  }

  function triggerBookingSave() {
    bookingSaveTrigger.value++
  }

  function showBookingHint() {
    if (hintTimer) clearTimeout(hintTimer)
    bookingHintVisible.value = true
    hintTimer = setTimeout(() => {
      bookingHintVisible.value = false
    }, 3000)
  }

  function hideBookingHint() {
    if (hintTimer) clearTimeout(hintTimer)
    bookingHintVisible.value = false
  }

  return {
    theme,
    fontSize,
    unlocked,
    bookingMode,
    bookingAmount,
    bookingSaveTrigger,
    bookingCanSave,
    bookingHintVisible,
    setMode,
    setAmount,
    setTheme,
    setFontSize,
    triggerBookingSave,
    showBookingHint,
    hideBookingHint,
  }
})