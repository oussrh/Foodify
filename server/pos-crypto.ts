// server/pos-crypto.ts
// Sealing a POS connection's credentials at rest: AES-256-GCM under POS_ENCRYPTION_KEY (lib/env.ts),
// a fresh 96-bit IV per seal, and the restaurant's id as additional data, so a sealed value copied
// onto another restaurant's row does not open. The key's id is stored beside each value: a value
// sealed under another key is refused by name rather than read as tampering, which is the path a
// rotation takes (a second key, re-seal, retire the first). A plaintext never leaves this module
// except to the adapter that needs it, and nothing here logs.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { serverEnv } from '@/lib/env'
import type { PosCredentials } from '@/lib/pos/contract'
import { POS_NOT_CONFIGURED } from '@/lib/pos/status'

/** The key credentials are sealed with: 32 bytes as base64, and its id. */
export type PosKey = { key: string; keyId: string }

/** Credentials as the row stores them: the sealed text and the id of the key that sealed it. */
export type SealedCredentials = { credentials: string; keyId: string }

/** A seal or an open that cannot be done: no key on this server, another key, or a value that was altered. */
export class PosCryptoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PosCryptoError'
  }
}

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
// GCM accepts shorter tags, and a shorter tag is easier to forge: only the full 16 bytes are taken.
const TAG_BYTES = 16
const FORMAT = 'v1'
const credentialsShape = z.record(z.string(), z.string())

/** Seals `credentials` under `key`, bound to `context` (the restaurant's id). */
export function sealWith(key: PosKey, credentials: PosCredentials, context: string): SealedCredentials {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(key.key, 'base64'), iv, { authTagLength: TAG_BYTES })
  cipher.setAAD(Buffer.from(context))
  const body = Buffer.concat([cipher.update(JSON.stringify(credentials), 'utf8'), cipher.final()])
  const sealed = [FORMAT, iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join('.')
  return { credentials: sealed, keyId: key.keyId }
}

/** Opens what `sealWith` sealed under the same key and `context`; any other key, context or altered byte is refused. */
export function openWith(key: PosKey, sealed: SealedCredentials, context: string): PosCredentials {
  if (sealed.keyId !== key.keyId) throw new PosCryptoError(`These credentials were sealed under key ${sealed.keyId}, not ${key.keyId}`)
  const [format, iv, tag, body] = sealed.credentials.split('.')
  if (format !== FORMAT || !iv || !tag || body === undefined) throw new PosCryptoError('These credentials are not in a form this server reads')
  const authTag = Buffer.from(tag, 'base64')
  if (authTag.length !== TAG_BYTES) throw new PosCryptoError('These credentials are not in a form this server reads')
  try {
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(key.key, 'base64'), Buffer.from(iv, 'base64'), { authTagLength: TAG_BYTES })
    decipher.setAAD(Buffer.from(context))
    decipher.setAuthTag(authTag)
    const plain = Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8')
    return credentialsShape.parse(JSON.parse(plain))
  } catch {
    throw new PosCryptoError('These credentials cannot be opened: altered, or sealed under another key')
  }
}

/** The server's key, or a PosCryptoError saying POS integration is not configured here. */
function serverKey(): PosKey {
  const key = serverEnv.posEncryption
  if (!key) throw new PosCryptoError(POS_NOT_CONFIGURED)
  return key
}

/** Seals `credentials` under the server's key for restaurant `restaurantId`. */
export function sealCredentials(credentials: PosCredentials, restaurantId: string): SealedCredentials {
  return sealWith(serverKey(), credentials, restaurantId)
}

/** Opens a connection's credentials with the server's key, for restaurant `restaurantId`. */
export function openCredentials(sealed: SealedCredentials, restaurantId: string): PosCredentials {
  return openWith(serverKey(), sealed, restaurantId)
}
