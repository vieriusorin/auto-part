import { text, timestamp } from 'drizzle-orm/pg-core'

export const trustCriticalFieldColumns = {
  contentHash: text('content_hash'),
  hashAlgorithm: text('hash_algorithm').default('sha256'),
  hashVersion: text('hash_version').default('v1'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockedBy: text('locked_by'),
  lockReason: text('lock_reason'),
}
