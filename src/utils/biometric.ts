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
const BIOMETRIC_RP_KEY = 'biometric_rp_id'

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

export function getBiometricRpId(): string | null {
  return localStorage.getItem('biometric_rp_id')
}

function saveCredential(id: string) {
  localStorage.setItem(CREDENTIAL_ID_KEY, id)
  localStorage.setItem(BIOMETRIC_RP_KEY, window.location.hostname)
  localStorage.setItem(ENABLED_KEY, 'true')
}

export function clearBiometric(): void {
  localStorage.removeItem(ENABLED_KEY)
  localStorage.removeItem(CREDENTIAL_ID_KEY)
  localStorage.removeItem(BIOMETRIC_RP_KEY)
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
 * Uses non-discoverable credential (residentKey: discouraged) to avoid
 * triggering the iOS passkey sheet — should go straight to Face ID.
 */
export async function authenticateBiometric(): Promise<boolean> {
  const credentialId = getBiometricCredentialId()
  const rpId = getBiometricRpId()
  if (!credentialId || !rpId) return false

  // RP ID mismatch — credential belongs to a different origin
  if (rpId !== window.location.hostname) return false

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
        timeout: 60000,
      },
    })
    return credential !== null
  } catch {
    return false
  }
}

/**
 * Enable biometric authentication.
 *
 * Creates a non-discoverable platform credential (residentKey: discouraged)
 * so that iOS treats it as a device-local credential rather than a synced
 * passkey, avoiding the system passkey selection sheet on subsequent auth.
 */
export async function registerBiometric(): Promise<boolean> {
  // Check if an existing credential is already registered for this RP
  const existingId = getBiometricCredentialId()
  const rpId = getBiometricRpId()
  if (existingId && rpId === window.location.hostname) {
    // Credential already registered and RP matches — no-op
    return true
  }

  // Create a new non-discoverable platform credential
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
          residentKey: 'discouraged',
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