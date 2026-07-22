/**
 * Biometric authentication (Face ID / Touch ID / Windows Hello)
 * via Web Authentication API (WebAuthn) platform authenticator.
 *
 * Credential is stored in the device's secure hardware (Secure Enclave / TPM).
 * Credential ID + enabled flag are stored in localStorage for quick sync checks.
 *
 * Reuse strategy:
 *   When enabling, if credential ID is lost (cache cleared), we attempt to
 *   discover existing credentials via empty allowCredentials, avoiding orphans.
 */

const ENABLED_KEY = 'biometric_enabled'
const CREDENTIAL_ID_KEY = 'biometric_credential_id'

// ── Helper: ArrayBuffer ←→ base64url ──

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBuffer(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    buf[i] = binary.charCodeAt(i)
  }
  return buf.buffer
}

// ── Sync localStorage helpers ──

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'true'
}

export function getBiometricCredentialId(): string | null {
  return localStorage.getItem(CREDENTIAL_ID_KEY)
}

function saveCredential(id: string) {
  localStorage.setItem(CREDENTIAL_ID_KEY, id)
  localStorage.setItem(ENABLED_KEY, 'true')
}

export function clearBiometric(): void {
  localStorage.removeItem(ENABLED_KEY)
  localStorage.removeItem(CREDENTIAL_ID_KEY)
}

// ── Platform support check ──

export async function isBiometricSupported(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// ── Authentication (verify existing credential) ──

/**
 * Attempt biometric verification using the stored credential.
 * Returns true if the user successfully authenticates.
 */
export async function authenticateBiometric(): Promise<boolean> {
  const credentialId = getBiometricCredentialId()
  if (!credentialId) return false

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [{
          id: base64UrlToBuffer(credentialId),
          type: 'public-key',
        }],
        userVerification: 'required',
      },
    })
    return credential !== null
  } catch {
    // User cancelled Face ID, or credential no longer exists on device
    return false
  }
}

// ── Registration (enable biometric) ──

/**
 * Enable biometric authentication.
 *
 * Flow:
 *   1. Try to discover an already-registered credential (empty allowCredentials).
 *      → If found, save its ID → return.
 *   2. Otherwise, create a new platform credential with residentKey: 'preferred'.
 *      → Save ID → return.
 *
 * Returns true if biometric was successfully enabled.
 */
export async function registerBiometric(): Promise<boolean> {
  // Phase 1: try to reuse existing credential (e.g., after localStorage was cleared)
  const existingId = await discoverExistingCredential()
  if (existingId) {
    saveCredential(existingId)
    return true
  }

  // Phase 2: create new credential
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { id: window.location.hostname, name: '钱书' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'money-book-user',
          displayName: '钱书用户',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })

    if (credential) {
      const rawId = (credential as PublicKeyCredential).rawId
      saveCredential(bufferToBase64Url(rawId))
      return true
    }
    return false
  } catch {
    return false
  }
}

// ── Internal: discover existing credential (empty allowCredentials) ──

async function discoverExistingCredential(): Promise<string | null> {
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [] as PublicKeyCredentialDescriptor[],
        userVerification: 'required',
      },
    })

    if (credential) {
      return bufferToBase64Url((credential as PublicKeyCredential).rawId)
    }
  } catch {
    // No discoverable credential, or user cancelled
  }
  return null
}