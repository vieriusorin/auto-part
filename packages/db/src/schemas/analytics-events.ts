import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const analyticsEventsRaw = pgTable('analytics_events_raw', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: text('event_id').notNull(),
  eventName: text('event_name').notNull(),
  occurredAtClient: timestamp('occurred_at_client', { withTimezone: true }).notNull(),
  receivedAtServer: timestamp('received_at_server', { withTimezone: true }).notNull(),
  userId: text('user_id'),
  sessionId: text('session_id').notNull(),
  deviceId: text('device_id').notNull(),
  platform: text('platform').notNull(),
  country: text('country').notNull(),
  channel: text('channel').notNull(),
  appVersion: text('app_version').notNull(),
  schemaVersion: integer('schema_version').notNull(),
  integrityValid: integer('integrity_valid').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const analyticsDailyRollups = pgTable('analytics_daily_rollups', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: text('date').notNull(),
  country: text('country').notNull(),
  platform: text('platform').notNull(),
  channel: text('channel').notNull(),
  activationCount: integer('activation_count').notNull().default(0),
  d1Retained: integer('d1_retained').notNull().default(0),
  d7Retained: integer('d7_retained').notNull().default(0),
  d30Retained: integer('d30_retained').notNull().default(0),
  wau: integer('wau').notNull().default(0),
  mau: integer('mau').notNull().default(0),
  maintenanceActionsCompleted: integer('maintenance_actions_completed').notNull().default(0),
})

export const analyticsUserCohorts = pgTable('analytics_user_cohorts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  signupDate: text('signup_date').notNull(),
  country: text('country').notNull(),
  platform: text('platform').notNull(),
  channel: text('channel').notNull(),
})
