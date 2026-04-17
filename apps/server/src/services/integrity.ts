import { createHash } from 'node:crypto'

export const computeIntegrityHash = (payload: unknown): string => {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}
