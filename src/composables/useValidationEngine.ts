import type { AccountType, TransactionType } from '@/types'

export interface ValidationResult {
  forceMode: TransactionType | null
  lockMode: boolean
  showMemberPicker: boolean
  message: string | null
}

export function useValidationEngine() {
  function validateTransferEligibility(
    fromType: AccountType | null,
    toType: AccountType | null,
    _currentMode: TransactionType
  ): ValidationResult {
    const result: ValidationResult = {
      forceMode: null,
      lockMode: false,
      showMemberPicker: false,
      message: null,
    }

    // 流动性 → 负债：强制转账（还款）
    if (fromType === 'liquid' && toType === 'debt') {
      result.forceMode = 'transfer'
      result.lockMode = true
      result.message = '还信用卡/借款请使用转账模式'
      return result
    }

    // 负债 → 流动性：强制转账（收回借款）
    if (fromType === 'debt' && toType === 'liquid') {
      result.forceMode = 'transfer'
      result.lockMode = true
      result.message = '借款收回请使用转账模式'
      return result
    }

    // 负债 → 负债：强制转账
    if (fromType === 'debt' && toType === 'debt') {
      result.forceMode = 'transfer'
      result.lockMode = true
      result.message = '负债间流转请使用转账模式'
      return result
    }

    return result
  }

  function isCreditCardExpenseValid(fromType: AccountType | null, mode: TransactionType): boolean {
    return mode === 'expense' && fromType === 'debt'
  }

  return {
    validateTransferEligibility,
    isCreditCardExpenseValid,
  }
}