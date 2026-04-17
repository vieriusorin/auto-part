import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  actorType: text('actor_type').notNull(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  reasonCode: text('reason_code'),
  source: text('source').notNull(),
  requestId: text('request_id').notNull(),
  metadataJson: jsonb('metadata_json'),
})
