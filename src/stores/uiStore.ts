import { defineStore } from 'pinia'
import { ref } from 'vue'

export type BookingMode = 'expense' | 'income' | 'transfer'

export const useUiStore = defineStore('ui', () => {
  const bookingMode = ref<BookingMode>('expense')
  const bookingAmount = ref<number>(0)
  const lastAccountId = ref<number | null>(null)
  const lastCategoryId = ref<number | null>(null)

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

  return {
    bookingMode,
    bookingAmount,
    lastAccountId,
    lastCategoryId,
    setMode,
    setAmount,
    setLastAccount,
    setLastCategory,
  }
})