const STORAGE_KEY = 'pin_hash'

/**
 * Hash a PIN string using SHA-256 via the Web Crypto API.
 * Falls back to a simple hash in insecure contexts (e.g., LAN HTTP on iOS).
 * Returns the hex-encoded hash string.
 */
export async function hashPIN(pin: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return bufferToHex(hashBuffer)
  } catch {
    // Fallback for insecure contexts (e.g., LAN IP via HTTP on iOS Safari)
    // crypto.subtle requires window.isSecureContext === true
    return simpleHash(pin)
  }
}

/**
 * Simple string hash for non-secure contexts (DJB2-style).
 * 64-bit hex output to match SHA-256 hex length for storage consistency.
 */
function simpleHash(pin: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x12345678
  for (let i = 0; i < pin.length; i++) {
    const c = pin.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 2246822507)
  }
  h1 = Math.abs(h1) | 1
  h2 = Math.abs(h2) | 1
  return (h1 >>> 0).toString(16).padStart(8, '0') +
         (h2 >>> 0).toString(16).padStart(8, '0')
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