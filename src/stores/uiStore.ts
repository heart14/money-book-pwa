import { defineStore } from 'pinia'
import { ref } from 'vue'

export type BookingMode = 'expense' | 'income' | 'transfer'

export const useUiStore = defineStore('ui', () => {
  // ── Booking mode state ──
  const bookingMode = ref<BookingMode>('expense')
  const bookingAmount = ref<number>(0)
  const lastAccountId = ref<number | null>(null)
  const lastCategoryId = ref<number | null>(null)

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

  function setLastAccount(id: number | null) {
    lastAccountId.value = id
  }

  function setLastCategory(id: number | null) {
    lastCategoryId.value = id
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
    bookingMode,
    bookingAmount,
    lastAccountId,
    lastCategoryId,
    bookingSaveTrigger,
    bookingCanSave,
    bookingHintVisible,
    setMode,
    setAmount,
    setLastAccount,
    setLastCategory,
    triggerBookingSave,
    showBookingHint,
    hideBookingHint,
  }
})