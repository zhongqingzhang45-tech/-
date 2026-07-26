import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

export interface ProviderConfigCryptoOptions {
  masterKey: Buffer
  previousMasterKey?: Buffer
}

const VERSION_PREFIX = 'v1'
const HKDF_SALT = Buffer.from('provider-config-v1', 'utf8')
const HKDF_INFO = Buffer.from('provider-config-encryption', 'utf8')
const KEY_LEN = 32
const IV_LEN = 12
const TAG_LEN = 16
const ENCRYPTED_MARKER = '__encrypted__'

function assertMasterKeyLength(label: string, key: Buffer): void {
  if (key.length !== KEY_LEN)
    throw new Error(`${label} must be exactly 32 bytes (got ${key.length})`)
}

function deriveAesKey(masterKey: Buffer): Buffer {
  return Buffer.from(hkdfSync('sha256', masterKey, HKDF_SALT, HKDF_INFO, KEY_LEN))
}

function encodeAad(configId: string, ownerId: string): Buffer {
  return Buffer.from(`${configId}|${ownerId}`, 'utf8')
}

export function createProviderConfigCrypto(options: ProviderConfigCryptoOptions) {
  assertMasterKeyLength('masterKey', options.masterKey)
  if (options.previousMasterKey != null)
    assertMasterKeyLength('previousMasterKey', options.previousMasterKey)

  const currentAesKey = deriveAesKey(options.masterKey)
  const previousAesKey = options.previousMasterKey ? deriveAesKey(options.previousMasterKey) : undefined

  function encryptWith(aesKey: Buffer, plaintext: Buffer, aadBytes: Buffer): { iv: Buffer, ct: Buffer, tag: Buffer } {
    const iv = randomBytes(IV_LEN)
    const cipher = createCipheriv('aes-256-gcm', aesKey, iv, { authTagLength: TAG_LEN })
    cipher.setAAD(aadBytes, { plaintextLength: plaintext.length })
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const tag = cipher.getAuthTag()
    return { iv, ct, tag }
  }

  function decryptWith(aesKey: Buffer, iv: Buffer, ct: Buffer, tag: Buffer, aadBytes: Buffer): Buffer {
    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv, { authTagLength: TAG_LEN })
    decipher.setAAD(aadBytes, { plaintextLength: ct.length })
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()])
  }

  function encryptConfig(config: Record<string, unknown>, configId: string, ownerId: string): Record<string, unknown> {
    const plaintext = Buffer.from(JSON.stringify(config), 'utf8')
    const aadBytes = encodeAad(configId, ownerId)
    const { iv, ct, tag } = encryptWith(currentAesKey, plaintext, aadBytes)
    const ciphertext = [
      VERSION_PREFIX,
      iv.toString('base64url'),
      ct.toString('base64url'),
      tag.toString('base64url'),
    ].join('.')
    return { [ENCRYPTED_MARKER]: ciphertext }
  }

  function decryptConfig(
    storedConfig: Record<string, unknown> | null | undefined,
    configId: string,
    ownerId: string,
  ): Record<string, unknown> | null {
    if (!storedConfig || typeof storedConfig !== 'object')
      return null

    const ciphertext = storedConfig[ENCRYPTED_MARKER]
    if (typeof ciphertext !== 'string')
      return null

    if (!ciphertext.startsWith('v1.'))
      return null

    const parts = ciphertext.split('.')
    if (parts.length !== 4)
      return null

    const [version, ivB64, ctB64, tagB64] = parts
    if (version !== VERSION_PREFIX)
      return null

    let iv: Buffer
    let ct: Buffer
    let tag: Buffer
    try {
      iv = Buffer.from(ivB64, 'base64url')
      ct = Buffer.from(ctB64, 'base64url')
      tag = Buffer.from(tagB64, 'base64url')
    }
    catch {
      return null
    }

    const aadBytes = encodeAad(configId, ownerId)

    try {
      const plaintext = decryptWith(currentAesKey, iv, ct, tag, aadBytes)
      return JSON.parse(plaintext.toString('utf8'))
    }
    catch {
      if (previousAesKey == null)
        return null

      try {
        const plaintext = decryptWith(previousAesKey, iv, ct, tag, aadBytes)
        return JSON.parse(plaintext.toString('utf8'))
      }
      catch {
        return null
      }
    }
  }

  function isEncrypted(config: Record<string, unknown> | null | undefined): boolean {
    if (!config || typeof config !== 'object')
      return false
    return typeof config[ENCRYPTED_MARKER] === 'string'
  }

  function decryptIfNeeded(
    storedConfig: Record<string, unknown> | null | undefined,
    configId: string,
    ownerId: string,
  ): Record<string, unknown> {
    if (!storedConfig)
      return {}
    if (isEncrypted(storedConfig)) {
      const decrypted = decryptConfig(storedConfig, configId, ownerId)
      return decrypted ?? {}
    }
    return storedConfig
  }

  return { encryptConfig, decryptConfig, isEncrypted, decryptIfNeeded }
}

export type ProviderConfigCrypto = ReturnType<typeof createProviderConfigCrypto>
