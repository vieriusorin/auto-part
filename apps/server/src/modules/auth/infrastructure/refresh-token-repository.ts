import { refreshTokens, users } from '@autocare/db'
import type { ClientKind } from '@autocare/shared'
import { and, eq, isNull } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { RefreshTokenRecord } from '../domain/types.js'

export type InsertRefreshTokenInput = {
  id?: string
  userId: string
  familyId: string
  tokenHash: string
  issuedAt: Date
  expiresAt: Date
  absoluteExpiresAt: Date
  userAgent?: string | null
  ipAddress?: string | null
  clientKind: ClientKind | 'unknown'
}

export type RefreshTokenRepository = {
  insert: (input: InsertRefreshTokenInput) => Promise<RefreshTokenRecord>
  findByHash: (tokenHash: string) => Promise<RefreshTokenRecord | null>
  markRotated: (oldTokenId: string, replacedByTokenId: string, at: Date) => Promise<void>
  markRevoked: (tokenId: string, reason: string, at: Date) => Promise<void>
  revokeFamily: (familyId: string, reason: string, at: Date) => Promise<void>
  revokeAllForUser: (userId: string, reason: string, at: Date) => Promise<void>
  touchLastUsed: (tokenId: string, at: Date) => Promise<void>
  deleteExpired: (before: Date) => Promise<number>
}

const mapRow = (row: typeof refreshTokens.$inferSelect): RefreshTokenRecord => ({
  id: row.id,
  userId: row.userId,
  familyId: row.familyId,
  tokenHash: row.tokenHash,
  issuedAt: row.issuedAt,
  lastUsedAt: row.lastUsedAt,
  expiresAt: row.expiresAt,
  absoluteExpiresAt: row.absoluteExpiresAt,
  replacedByTokenId: row.replacedByTokenId,
  revokedAt: row.revokedAt,
  revokedReason: row.revokedReason,
  userAgent: row.userAgent,
  ipAddress: row.ipAddress,
  clientKind: (row.clientKind as ClientKind | 'unknown') ?? 'unknown',
})

const resolveUserIntId = async (
  db: NodePgDatabase,
  userId: string,
): Promise<number> => {
  const rows = await db
    .select({ idInt: users.idInt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const idInt = rows[0]?.idInt
  if (idInt === null || idInt === undefined) {
    throw new Error('user_not_found_for_refresh_token')
  }
  return idInt
}

export const createRefreshTokenRepository = (db: NodePgDatabase): RefreshTokenRepository => ({
  insert: async (input) => {
    const userIdInt = await resolveUserIntId(db, input.userId)
    const [row] = await db
      .insert(refreshTokens)
      .values({
        id: input.id,
        userId: input.userId,
        userIdInt,
        familyId: input.familyId,
        tokenHash: input.tokenHash,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        absoluteExpiresAt: input.absoluteExpiresAt,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        clientKind: input.clientKind,
      })
      .returning()
    if (!row) {
      throw new Error('Failed to insert refresh token')
    }
    return mapRow(row)
  },
  findByHash: async (tokenHash) => {
    const rows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  },
  markRotated: async (oldTokenId, replacedByTokenId, at) => {
    await db
      .update(refreshTokens)
      .set({ replacedByTokenId, revokedAt: at, revokedReason: 'rotated', lastUsedAt: at })
      .where(eq(refreshTokens.id, oldTokenId))
  },
  markRevoked: async (tokenId, reason, at) => {
    await db
      .update(refreshTokens)
      .set({ revokedAt: at, revokedReason: reason })
      .where(and(eq(refreshTokens.id, tokenId), isNull(refreshTokens.revokedAt)))
  },
  revokeFamily: async (familyId, reason, at) => {
    await db
      .update(refreshTokens)
      .set({ revokedAt: at, revokedReason: reason })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)))
  },
  revokeAllForUser: async (userId, reason, at) => {
    await db
      .update(refreshTokens)
      .set({ revokedAt: at, revokedReason: reason })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  },
  touchLastUsed: async (tokenId, at) => {
    await db.update(refreshTokens).set({ lastUsedAt: at }).where(eq(refreshTokens.id, tokenId))
  },
  deleteExpired: async (_before) => {
    // Soft cleanup is handled via scheduled job; kept here as a no-op placeholder
    // to keep the interface stable. Implement when wiring a cron entry.
    return 0
  },
})
