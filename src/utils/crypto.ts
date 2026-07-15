const STORAGE_KEY = 'pin_hash'

/**
 * Hash a PIN string using SHA-256 via the Web Crypto API.
 * Returns the hex-encoded hash string.
 */
export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return bufferToHex(hashBuffer)
}

/**
 * Retrieve the stored PIN hash from localStorage.
 * Returns null if no hash has been stored.
 */
export function getStoredPINHash(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

/**
 * Store a PIN hash in localStorage.
 */
export function setStoredPINHash(hash: string): void {
  localStorage.setItem(STORAGE_KEY, hash)
}

/**
 * Remove the stored PIN hash from localStorage.
 */
export function clearPIN(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}