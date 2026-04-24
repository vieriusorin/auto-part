import { randomUUID } from 'node:crypto'
import { document } from '@autocare/db'
import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { UserAccessScope } from '../../auth/application/access-scope.js'
import { canAccessDocumentResource, documentPolicyConditions } from '../../auth/application/access-scope.js'
import { buildDocumentPermissions, filterReadableDocument, filterWritablePatch, type DocumentRecord, type DocumentRole } from '../../auth/application/document-abac.js'
import { buildSqlFilterFromPolicies } from '../../auth/application/policy-sql.js'

type StoredDocument = DocumentRecord & { id: string }

const Documents = new Map<string, StoredDocument>()

const seedIfEmpty = () => {
  if (Documents.size > 0) return
  const now = new Date('2026-04-24T08:00:00.000Z')
  const first: StoredDocument = {
    id: randomUUID(),
    title: 'Maintenance policy',
    content: 'Standard maintenance checklist.',
    status: 'published',
    isLocked: false,
    creatorId: 'seed-admin',
    lastEditedById: 'seed-admin',
    createdAt: now,
    updatedAt: now,
  }
  const second: StoredDocument = {
    id: randomUUID(),
    title: 'Internal draft',
    content: 'Draft only.',
    status: 'draft',
    isLocked: true,
    creatorId: 'seed-admin',
    lastEditedById: 'seed-admin',
    createdAt: now,
    updatedAt: now,
  }
  Documents.set(first.id, first)
  Documents.set(second.id, second)
}

export type DocumentRepository = {
  listForRead: (
    role: DocumentRole,
    scope: UserAccessScope,
    now: Date,
  ) => Promise<Array<Partial<DocumentRecord> & { id: string }>>
  create: (
    role: DocumentRole,
    scope: UserAccessScope,
    now: Date,
    input: Partial<DocumentRecord>,
  ) => Promise<(Partial<DocumentRecord> & { id: string }) | null>
  update: (
    role: DocumentRole,
    scope: UserAccessScope,
    now: Date,
    id: string,
    patch: Partial<DocumentRecord>,
  ) => Promise<(Partial<DocumentRecord> & { id: string }) | null>
}

const hasQueryableDb = (db: unknown): db is NodePgDatabase => {
  const candidate = db as { select?: unknown; insert?: unknown; update?: unknown }
  return (
    typeof candidate?.select === 'function' &&
    typeof candidate?.insert === 'function' &&
    typeof candidate?.update === 'function'
  )
}

const toStored = (row: typeof document.$inferSelect): StoredDocument => ({
  id: row.id,
  title: row.title,
  content: row.content,
  status: row.status as DocumentRecord['status'],
  isLocked: row.isLocked,
  creatorId: row.creatorId,
  lastEditedById: row.lastEditedById,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

export const createDocumentRepository = (db?: unknown): DocumentRepository => {
  seedIfEmpty()
  const useDb = hasQueryableDb(db)

  return {
    listForRead: async (role, scope, now) => {
      const permissions = buildDocumentPermissions(role, now)
      if (!useDb) {
        return [...Documents.values()]
          .filter((doc) => canAccessDocumentResource(scope, doc))
          .filter((doc) => permissions.can('document', 'read', doc))
          .map((doc) => ({ id: doc.id, ...filterReadableDocument(permissions, doc) }))
      }

      const policySql =
        buildSqlFilterFromPolicies(
          documentPolicyConditions(scope),
          { creatorId: document.creatorId },
        ) ?? eq(document.creatorId, scope.actorId)

      const rows = await db
        .select()
        .from(document)
        .where(policySql)
      return rows
        .map(toStored)
        .filter((doc) => permissions.can('document', 'read', doc))
        .map((doc) => ({ id: doc.id, ...filterReadableDocument(permissions, doc) }))
    },
    create: async (role, scope, now, input) => {
      const permissions = buildDocumentPermissions(role, now)
      if (!permissions.can('document', 'create')) {
        return null
      }
      const base: DocumentRecord = {
        title: input.title ?? '',
        content: input.content ?? '',
        status: input.status ?? 'draft',
        isLocked: input.isLocked ?? false,
        creatorId: scope.actorId,
        lastEditedById: scope.actorId,
        createdAt: now,
        updatedAt: now,
      }
      const writable = filterWritablePatch(permissions, base, {
        title: input.title,
        content: input.content,
        status: input.status,
        isLocked: input.isLocked,
      })
      const created: StoredDocument = {
        ...base,
        ...writable,
        id: randomUUID(),
      }
      if (useDb) {
        const [row] = await db
          .insert(document)
          .values({
            id: created.id,
            title: created.title,
            content: created.content,
            status: created.status,
            isLocked: created.isLocked,
            creatorId: created.creatorId,
            lastEditedById: created.lastEditedById,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          })
          .returning()
        if (!row) {
          return null
        }
        const persisted = toStored(row)
        return { id: persisted.id, ...filterReadableDocument(permissions, persisted) }
      }
      Documents.set(created.id, created)
      return { id: created.id, ...filterReadableDocument(permissions, created) }
    },
    update: async (role, scope, now, id, patch) => {
      const memoryCurrent = useDb ? null : (Documents.get(id) ?? null)
      const dbCurrent = useDb
        ? await db
            .select()
            .from(document)
            .where(eq(document.id, id))
            .limit(1)
        : []
      const resolved = memoryCurrent ?? (dbCurrent[0] ? toStored(dbCurrent[0]) : null)
      if (!resolved) {
        return null
      }
      if (!canAccessDocumentResource(scope, resolved)) {
        return null
      }
      const permissions = buildDocumentPermissions(role, now)
      if (!permissions.can('document', 'update', resolved)) {
        return null
      }
      const writable = filterWritablePatch(permissions, resolved, patch)
      const updated: StoredDocument = {
        ...resolved,
        ...writable,
        lastEditedById: scope.actorId,
        updatedAt: now,
      }
      if (useDb) {
        const [row] = await db
          .update(document)
          .set({
            title: updated.title,
            content: updated.content,
            status: updated.status,
            isLocked: updated.isLocked,
            lastEditedById: updated.lastEditedById,
            updatedAt: updated.updatedAt,
          })
          .where(eq(document.id, id))
          .returning()
        if (!row) {
          return null
        }
        const persisted = toStored(row)
        return { id: persisted.id, ...filterReadableDocument(permissions, persisted) }
      }
      Documents.set(id, updated)
      return { id: updated.id, ...filterReadableDocument(permissions, updated) }
    },
  }
}

