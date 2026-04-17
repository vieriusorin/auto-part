import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { Pool } from 'pg'
import type { z } from 'zod'
import { loadServerEnv } from '../../config/load-env.js'
import { appendTrustAuditEvent } from './audit-service.js'

loadServerEnv()

const consentLedger = pgTable('consent_ledger', {
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

type ConsentStatus = 'granted' | 'revoked' | 'expired'

const consentLedgerSelectSchema = createSelectSchema(consentLedger)
type ConsentLedgerRow = z.infer<typeof consentLedgerSelectSchema>
type ConsentEntry = Omit<ConsentLedgerRow, 'captureSource' | 'createdAt'> & {
  status: ConsentStatus
  legalBasis: 'consent' | 'legitimate_interest'
  source: 'app' | 'api' | 'admin'
  createdAt: string
}

type ConsentInput = {
  userId: string
  consentType: string
  legalBasis: 'consent' | 'legitimate_interest'
  policyVersion: string
  source: 'app' | 'api' | 'admin'
  requestId: string
}

type ConsentStorage = {
  append: (entry: ConsentInput, status: ConsentStatus) => Promise<ConsentEntry>
  listForUser: (userId: string) => Promise<ConsentEntry[]>
  clear: () => Promise<void>
}

const inMemoryStore: ConsentEntry[] = []

const appendAuditForConsent = async (input: ConsentInput, status: ConsentStatus): Promise<void> => {
  await appendTrustAuditEvent({
    actorType: 'user',
    actorId: input.userId,
    action: `consent.${status}`,
    resourceType: 'consent',
    resourceId: input.consentType,
    requestId: input.requestId,
    source: 'api',
    reasonCode: null,
    metadataJson: {
      legalBasis: input.legalBasis,
      policyVersion: input.policyVersion,
      source: input.source,
    },
  })
}

const inMemoryStorage: ConsentStorage = {
  append: async (input, status) => {
    const entry: ConsentEntry = {
      id: crypto.randomUUID(),
      ...input,
      status,
      createdAt: new Date().toISOString(),
    }
    inMemoryStore.push(entry)
    await appendAuditForConsent(input, status)
    return entry
  },
  listForUser: async (userId) => inMemoryStore.filter((entry) => entry.userId === userId),
  clear: async () => {
    inMemoryStore.length = 0
  },
}

const isTestRuntime = (): boolean =>
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

const createDbStorage = (): ConsentStorage => {
  if (isTestRuntime()) {
    return inMemoryStorage
  }

  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is required for consent storage runtime path')
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const db = drizzle(pool)

  return {
    append: async (input, status) => {
      const [created] = await db
        .insert(consentLedger)
        .values({
          id: crypto.randomUUID(),
          userId: input.userId,
          consentType: input.consentType,
          status,
          legalBasis: input.legalBasis,
          policyVersion: input.policyVersion,
          captureSource: input.source,
          requestId: input.requestId,
        })
        .returning()
      await appendAuditForConsent(input, status)
      return {
        id: created.id,
        userId: created.userId,
        consentType: created.consentType,
        status: created.status as ConsentStatus,
        legalBasis: created.legalBasis as 'consent' | 'legitimate_interest',
        policyVersion: created.policyVersion,
        source: created.captureSource as 'app' | 'api' | 'admin',
        requestId: created.requestId,
        createdAt: created.createdAt.toISOString(),
      }
    },
    listForUser: async (userId) => {
      const rows = await db.select().from(consentLedger).where(eq(consentLedger.userId, userId))
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        consentType: row.consentType,
        status: row.status as ConsentStatus,
        legalBasis: row.legalBasis as 'consent' | 'legitimate_interest',
        policyVersion: row.policyVersion,
        source: row.captureSource as 'app' | 'api' | 'admin',
        requestId: row.requestId,
        createdAt: row.createdAt.toISOString(),
      }))
    },
    clear: async () => {
      await db.delete(consentLedger)
    },
  }
}

let consentStorage: ConsentStorage = createDbStorage()

export const createConsent = (input: ConsentInput): Promise<ConsentEntry> =>
  consentStorage.append(input, 'granted')

export const revokeConsent = (input: ConsentInput): Promise<ConsentEntry> =>
  consentStorage.append(input, 'revoked')

export const listConsentsForUser = (userId: string): Promise<ConsentEntry[]> =>
  consentStorage.listForUser(userId)

export const resetConsentStore = async (): Promise<void> => {
  await consentStorage.clear()
}

export const setConsentStorageForTests = (storage: ConsentStorage): void => {
  consentStorage = storage
}

export const resetConsentStorageForTests = (): void => {
  consentStorage = createDbStorage()
}
