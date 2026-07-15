import { ref } from 'vue'
import { hashWithSalt, generateSalt } from '@/utils/crypto'

const STORAGE_KEY = 'moneybook_pin'
const SALT_KEY = 'moneybook_pin_salt'
const QUESTION_KEY = 'moneybook_pin_question'
const ANSWER_KEY = 'moneybook_pin_answer'
const LOCKOUT_KEY = 'moneybook_pin_lockout'
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 60000 // 60s

export function usePinLock() {
  const isLocked = ref(false)
  const pinSet = ref(!!localStorage.getItem(STORAGE_KEY))

  async function setPin(pin: string, question: string, answer: string): Promise<void> {
    const salt = generateSalt()
    const hash = await hashWithSalt(pin, salt)
    localStorage.setItem(STORAGE_KEY, hash)
    localStorage.setItem(SALT_KEY, salt)
    localStorage.setItem(QUESTION_KEY, question)
    const ansSalt = generateSalt()
    const ansHash = await hashWithSalt(answer, ansSalt)
    localStorage.setItem(ANSWER_KEY, JSON.stringify({ hash: ansHash, salt: ansSalt }))
    pinSet.value = true
  }

  async function verifyPin(pin: string): Promise<boolean> {
    const stored = localStorage.getItem(STORAGE_KEY)
    const salt = localStorage.getItem(SALT_KEY)
    if (!stored || !salt) return false

    // Check lockout
    const lockout = localStorage.getItem(LOCKOUT_KEY)
    if (lockout) {
      const elapsed = Date.now() - Number(lockout)
      if (elapsed < LOCKOUT_DURATION) return false
      localStorage.removeItem(LOCKOUT_KEY)
    }

    const hash = await hashWithSalt(pin, salt)
    if (hash === stored) {
      isLocked.value = false
      localStorage.removeItem('moneybook_pin_attempts')
      return true
    }

    // Record failed attempt
    const attempts = Number(localStorage.getItem('moneybook_pin_attempts') || '0') + 1
    localStorage.setItem('moneybook_pin_attempts', String(attempts))
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, String(Date.now()))
      localStorage.removeItem('moneybook_pin_attempts')
    }
    return false
  }

  async function verifySecurityAnswer(answer: string): Promise<boolean> {
    const stored = localStorage.getItem(ANSWER_KEY)
    if (!stored) return false
    const { hash, salt } = JSON.parse(stored)
    const ansHash = await hashWithSalt(answer, salt)
    return ansHash === hash
  }

  function getSecurityQuestion(): string | null {
    return localStorage.getItem(QUESTION_KEY)
  }

  function removePin(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SALT_KEY)
    localStorage.removeItem(QUESTION_KEY)
    localStorage.removeItem(ANSWER_KEY)
    localStorage.removeItem('moneybook_pin_attempts')
    localStorage.removeItem(LOCKOUT_KEY)
    pinSet.value = false
  }

  function lock(): void {
    isLocked.value = true
  }

  return { isLocked, pinSet, setPin, verifyPin, verifySecurityAnswer, getSecurityQuestion, removePin, lock }
}