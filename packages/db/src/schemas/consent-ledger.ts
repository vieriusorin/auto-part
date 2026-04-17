import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const consentLedger = pgTable('consent_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  consentType: text('consent_type').notNull(),
  status: text('status').notNull(),
  legalBasis: text('legal_basis').notNull(),
  policyVersion: text('policy_version').notNull(),
  captureSource: text('capture_source').notNull(),
  requestId: text('request_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
