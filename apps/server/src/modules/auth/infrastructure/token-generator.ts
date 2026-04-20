import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Opaque refresh token:
 *   raw: 48-byte URL-safe base64 string sent to the client
 *   hash: sha256(raw) stored in DB (never log or return the raw hash alongside)
 *
 * We don't include any secret pepper because the hash is already irreversible
 * without bcrypt-style cost; refresh tokens are high-entropy random, so a fast
 * hash is appropriate. The real threat (DB dump) is mitigated by reuse
 * detection + rotation, not by making hashing slow.
 */
export type TokenGenerator = {
  create: () => { raw: string; hash: string }
  hash: (raw: string) => string
  equals: (storedHash: string, candidateHash: string) => boolean
}

const TOKEN_BYTES = 48

export const createTokenGenerator = (): TokenGenerator => {
  const hashRaw = (raw: string): string => createHash('sha256').update(raw, 'utf8').digest('hex')

  return {
    create: () => {
      const raw = randomBytes(TOKEN_BYTES).toString('base64url')
      return { raw, hash: hashRaw(raw) }
    },
    hash: hashRaw,
    equals: (a, b) => {
      if (a.length !== b.length) {
        return false
      }
      return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
    },
  }
}
