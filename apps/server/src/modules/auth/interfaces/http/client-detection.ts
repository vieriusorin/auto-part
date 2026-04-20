import type { ClientKind } from '@autocare/shared'
import type { Request } from 'express'

const isClientKind = (value: string): value is ClientKind =>
  value === 'web' || value === 'mobile' || value === 'server'

/**
 * Client detection order:
 *   1. Explicit X-Client header (trusted when present; mobile/server must set it)
 *   2. Inferred as 'web' when Origin header is present (browser CORS)
 *   3. 'unknown' fallback (curl, custom tooling, CI)
 */
export const detectClientKind = (req: Request): ClientKind | 'unknown' => {
  const header = req.headers['x-client']
  const raw = Array.isArray(header) ? header[0] : header
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (isClientKind(normalized)) {
      return normalized
    }
  }
  if (typeof req.headers.origin === 'string' && req.headers.origin.length > 0) {
    return 'web'
  }
  return 'unknown'
}
