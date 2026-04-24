import { drizzle } from 'drizzle-orm/node-postgres'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { Pool } from 'pg'
import type { z } from 'zod'
import { loadServerEnv } from '../../config/load-env.js'
import type { NormalizedAnalyticsEvent } from './schemas.js'
import { buildSqlFilterFromPolicies } from '../auth/application/policy-sql.js'

loadServerEnv()

const analyticsEventsRaw = pgTable('analytics_events_raw', {
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

const analyticsDailyRollups = pgTable('analytics_daily_rollups', {
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

const analyticsUserCohorts = pgTable('analytics_user_cohorts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  signupDate: text('signup_date').notNull(),
  country: text('country').notNull(),
  platform: text('platform').notNull(),
  channel: text('channel').notNull(),
})

const analyticsDailyRollupSchema = createSelectSchema(analyticsDailyRollups)
const analyticsUserCohortSchema = createSelectSchema(analyticsUserCohorts)

export type PersistedRollupRow = Omit<z.infer<typeof analyticsDailyRollupSchema>, 'id'>
export type PersistedCohortRow = Omit<z.infer<typeof analyticsUserCohortSchema>, 'id'>

type SegmentFilter = {
  country?: string
  platform?: 'ios' | 'android'
  channel?: string
}

type AnalyticsStorage = {
  appendRawEvent: (event: NormalizedAnalyticsEvent) => Promise<void>
  listRawEvents: () => Promise<NormalizedAnalyticsEvent[]>
  clearRawEvents: () => Promise<void>
  replaceDailyRollups: (rows: PersistedRollupRow[]) => Promise<void>
  listDailyRollups: (filter?: SegmentFilter) => Promise<PersistedRollupRow[]>
  replaceUserCohorts: (rows: PersistedCohortRow[]) => Promise<void>
}

const inMemoryState = {
  rawEvents: [] as NormalizedAnalyticsEvent[],
  dailyRollups: [] as PersistedRollupRow[],
  userCohorts: [] as PersistedCohortRow[],
}

const inMemoryStorage: AnalyticsStorage = {
  appendRawEvent: async (event) => {
    inMemoryState.rawEvents.push(event)
  },
  listRawEvents: async () => inMemoryState.rawEvents,
  clearRawEvents: async () => {
    inMemoryState.rawEvents.length = 0
    inMemoryState.dailyRollups.length = 0
    inMemoryState.userCohorts.length = 0
  },
  replaceDailyRollups: async (rows) => {
    inMemoryState.dailyRollups = [...rows]
  },
  listDailyRollups: async (filter) =>
    inMemoryState.dailyRollups.filter((row) => {
      if (filter?.country !== undefined && row.country !== filter.country) {
        return false
      }
      if (filter?.platform !== undefined && row.platform !== filter.platform) {
        return false
      }
      if (filter?.channel !== undefined && row.channel !== filter.channel) {
        return false
      }
      return true
    }),
  replaceUserCohorts: async (rows) => {
    inMemoryState.userCohorts = [...rows]
  },
}

const isTestRuntime = (): boolean =>
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

const shouldRequireDatabaseUrl = (): boolean =>
  process.env.NODE_ENV === 'production' || process.env.ANALYTICS_STORAGE === 'db'

const createDbStorage = (): AnalyticsStorage => {
  if (isTestRuntime()) {
    return inMemoryStorage
  }

  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    if (shouldRequireDatabaseUrl()) {
      throw new Error('DATABASE_URL is required for analytics storage runtime path')
    }

    // In local development we allow a memory fallback to keep the API runnable.
    console.warn(
      '[analytics] DATABASE_URL missing, using in-memory analytics storage. Set ANALYTICS_STORAGE=db to enforce DB mode.',
    )
    return inMemoryStorage
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const db = drizzle(pool)

  return {
    appendRawEvent: async (event) => {
      await db.insert(analyticsEventsRaw).values({
        id: crypto.randomUUID(),
        eventId: event.eventId,
        eventName: event.eventName,
        occurredAtClient: new Date(event.occurredAtClient),
        receivedAtServer: new Date(event.receivedAtServer),
        userId: event.userId,
        sessionId: event.sessionId,
        deviceId: event.deviceId,
        platform: event.platform,
        country: event.country,
        channel: event.channel,
        appVersion: event.appVersion,
        schemaVersion: event.schemaVersion,
        integrityValid: 1,
      })
    },
    listRawEvents: async () => {
      const rows = await db.select().from(analyticsEventsRaw)
      return rows.map((row) => ({
        eventId: row.eventId,
        eventName: row.eventName,
        occurredAtClient: row.occurredAtClient.toISOString(),
        receivedAtServer: row.receivedAtServer.toISOString(),
        userId: row.userId,
        sessionId: row.sessionId,
        deviceId: row.deviceId,
        platform: row.platform as 'ios' | 'android',
        country: row.country,
        channel: row.channel,
        appVersion: row.appVersion,
        schemaVersion: row.schemaVersion,
      }))
    },
    clearRawEvents: async () => {
      await db.delete(analyticsEventsRaw)
      await db.delete(analyticsDailyRollups)
      await db.delete(analyticsUserCohorts)
    },
    replaceDailyRollups: async (rows) => {
      await db.delete(analyticsDailyRollups)
      if (rows.length > 0) {
        await db.insert(analyticsDailyRollups).values(
          rows.map((row) => ({
            id: crypto.randomUUID(),
            date: row.date,
            country: row.country,
            platform: row.platform,
            channel: row.channel,
            activationCount: row.activationCount,
            d1Retained: row.d1Retained,
            d7Retained: row.d7Retained,
            d30Retained: row.d30Retained,
            wau: row.wau,
            mau: row.mau,
            maintenanceActionsCompleted: row.maintenanceActionsCompleted,
          })),
        )
      }
    },
    listDailyRollups: async (filter) => {
      const policyWhere = buildSqlFilterFromPolicies(
        [
          {
            country: filter?.country,
            platform: filter?.platform,
            channel: filter?.channel,
          },
        ],
        {
          country: analyticsDailyRollups.country,
          platform: analyticsDailyRollups.platform,
          channel: analyticsDailyRollups.channel,
        },
      )
      const rows = policyWhere
        ? await db.select().from(analyticsDailyRollups).where(policyWhere)
        : await db.select().from(analyticsDailyRollups)
      return rows.map((row) => ({
        date: row.date,
        country: row.country,
        platform: row.platform as 'ios' | 'android',
        channel: row.channel,
        activationCount: row.activationCount,
        d1Retained: row.d1Retained,
        d7Retained: row.d7Retained,
        d30Retained: row.d30Retained,
        wau: row.wau,
        mau: row.mau,
        maintenanceActionsCompleted: row.maintenanceActionsCompleted,
      }))
    },
    replaceUserCohorts: async (rows) => {
      await db.delete(analyticsUserCohorts)
      if (rows.length > 0) {
        await db.insert(analyticsUserCohorts).values(
          rows.map((row) => ({
            id: crypto.randomUUID(),
            userId: row.userId,
            signupDate: row.signupDate,
            country: row.country,
            platform: row.platform,
            channel: row.channel,
          })),
        )
      }
    },
  }
}

let storage: AnalyticsStorage = createDbStorage()

export const setAnalyticsStorageForTests = (nextStorage: AnalyticsStorage): void => {
  storage = nextStorage
}

export const resetAnalyticsStorageForTests = (): void => {
  storage = createDbStorage()
}

export const appendRawEvent = async (event: NormalizedAnalyticsEvent): Promise<void> => {
  await storage.appendRawEvent(event)
}

export const listRawEvents = async (): Promise<NormalizedAnalyticsEvent[]> =>
  storage.listRawEvents()

export const clearRawEvents = async (): Promise<void> => {
  await storage.clearRawEvents()
}

export const replaceDailyRollups = async (rows: PersistedRollupRow[]): Promise<void> => {
  await storage.replaceDailyRollups(rows)
}

export const listDailyRollups = async (filter?: SegmentFilter): Promise<PersistedRollupRow[]> =>
  storage.listDailyRollups(filter)

export const replaceUserCohorts = async (rows: PersistedCohortRow[]): Promise<void> => {
  await storage.replaceUserCohorts(rows)
}
