import { drizzle } from 'drizzle-orm/node-postgres'
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

const auditEvents = pgTable('audit_events', {
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

export type TrustAuditEntry = {
  actorType: 'user' | 'admin' | 'system'
  actorId: string
  action: string
  resourceType: string
  resourceId: string
  requestId: string
  source: 'api' | 'job' | 'middleware'
  reasonCode: string | null
  occurredAt: string
  metadataJson?: Record<string, unknown>
}

type AuditStorage = {
  append: (input: Omit<TrustAuditEntry, 'occurredAt'>) => Promise<TrustAuditEntry>
  list: () => Promise<TrustAuditEntry[]>
  clear: () => Promise<void>
}

const inMemoryAuditStore: TrustAuditEntry[] = []

const inMemoryStorage: AuditStorage = {
  append: async (input) => {
    const entry: TrustAuditEntry = { ...input, occurredAt: new Date().toISOString() }
    inMemoryAuditStore.push(entry)
    return entry
  },
  list: async () => inMemoryAuditStore,
  clear: async () => {
    inMemoryAuditStore.length = 0
  },
}

const isTestRuntime = (): boolean =>
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

const createDbStorage = (): AuditStorage => {
  if (isTestRuntime()) {
    return inMemoryStorage
  }

  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is required for trust audit runtime path')
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const db = drizzle(pool)

  return {
    append: async (input) => {
      const [created] = await db
        .insert(auditEvents)
        .values({
          id: crypto.randomUUID(),
          actorType: input.actorType,
          actorId: input.actorId,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          requestId: input.requestId,
          source: input.source,
          reasonCode: input.reasonCode,
          metadataJson: input.metadataJson ?? null,
        })
        .returning()
      return {
        actorType: created.actorType as 'user' | 'admin' | 'system',
        actorId: created.actorId,
        action: created.action,
        resourceType: created.resourceType,
        resourceId: created.resourceId,
        requestId: created.requestId,
        source: created.source as 'api' | 'job' | 'middleware',
        reasonCode: created.reasonCode,
        metadataJson:
          created.metadataJson !== null && typeof created.metadataJson === 'object'
            ? (created.metadataJson as Record<string, unknown>)
            : undefined,
        occurredAt: created.occurredAt.toISOString(),
      }
    },
    list: async () => {
      const rows = await db.select().from(auditEvents)
      return rows.map((row) => ({
        actorType: row.actorType as 'user' | 'admin' | 'system',
        actorId: row.actorId,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        requestId: row.requestId,
        source: row.source as 'api' | 'job' | 'middleware',
        reasonCode: row.reasonCode,
        metadataJson:
          row.metadataJson !== null && typeof row.metadataJson === 'object'
            ? (row.metadataJson as Record<string, unknown>)
            : undefined,
        occurredAt: row.occurredAt.toISOString(),
      }))
    },
    clear: async () => {
      await db.delete(auditEvents)
    },
  }
}

let auditStorage: AuditStorage = createDbStorage()

export const appendTrustAuditEvent = async (
  input: Omit<TrustAuditEntry, 'occurredAt'>,
): Promise<TrustAuditEntry> => auditStorage.append(input)

export const listTrustAuditEvents = async (): Promise<TrustAuditEntry[]> => auditStorage.list()

export const resetTrustAuditStore = async (): Promise<void> => {
  await auditStorage.clear()
}

export const setTrustAuditStorageForTests = (storage: AuditStorage): void => {
  auditStorage = storage
}

export const resetTrustAuditStorageForTests = (): void => {
  auditStorage = createDbStorage()
}
