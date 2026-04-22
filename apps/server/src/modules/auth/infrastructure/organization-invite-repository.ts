import { organizationInvite, users } from '@autocare/db'
import type { OrganizationInviteRole } from '@autocare/shared'
import { and, desc, eq, isNull } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { OrganizationInviteRecord } from '../domain/types.js'

export type CreateOrganizationInviteInput = {
  organizationId: string
  email: string
  role: OrganizationInviteRole
  tokenHash: string
  expiresAt: Date
  invitedBy: string
}

export type OrganizationInviteRepository = {
  create: (input: CreateOrganizationInviteInput) => Promise<OrganizationInviteRecord>
  listForOrganization: (organizationId: string) => Promise<OrganizationInviteRecord[]>
  findActiveByTokenHash: (tokenHash: string) => Promise<OrganizationInviteRecord | null>
  findById: (id: string) => Promise<OrganizationInviteRecord | null>
  revoke: (id: string, at: Date) => Promise<OrganizationInviteRecord | null>
  markAccepted: (id: string, acceptedBy: string, at: Date) => Promise<OrganizationInviteRecord | null>
  rotateToken: (
    id: string,
    tokenHash: string,
    expiresAt: Date,
    at: Date,
  ) => Promise<OrganizationInviteRecord | null>
}

const mapRow = (row: typeof organizationInvite.$inferSelect): OrganizationInviteRecord => ({
  id: row.id,
  organizationId: row.organizationId,
  email: row.email,
  role: row.role as OrganizationInviteRole,
  tokenHash: row.tokenHash,
  expiresAt: row.expiresAt,
  acceptedAt: row.acceptedAt,
  revokedAt: row.revokedAt,
  invitedBy: row.invitedBy,
  acceptedBy: row.acceptedBy,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const resolveUserIntId = async (db: NodePgDatabase, userId: string): Promise<number> => {
  const rows = await db
    .select({ idInt: users.idInt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const idInt = rows[0]?.idInt
  if (idInt === null || idInt === undefined) {
    throw new Error('invite_user_not_found')
  }
  return idInt
}

export const createOrganizationInviteRepository = (
  db: NodePgDatabase,
): OrganizationInviteRepository => ({
  create: async (input) => {
    const invitedByInt = await resolveUserIntId(db, input.invitedBy)
    const [row] = await db
      .insert(organizationInvite)
      .values({
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        invitedBy: input.invitedBy,
        invitedByInt,
      })
      .returning()
    if (!row) {
      throw new Error('Failed to create organization invite')
    }
    return mapRow(row)
  },
  listForOrganization: async (organizationId) => {
    const rows = await db
      .select()
      .from(organizationInvite)
      .where(eq(organizationInvite.organizationId, organizationId))
      .orderBy(desc(organizationInvite.createdAt))
    return rows.map(mapRow)
  },
  findActiveByTokenHash: async (tokenHash) => {
    const rows = await db
      .select()
      .from(organizationInvite)
      .where(
        and(
          eq(organizationInvite.tokenHash, tokenHash),
          isNull(organizationInvite.revokedAt),
          isNull(organizationInvite.acceptedAt),
        ),
      )
      .limit(1)
    const row = rows[0]
    return row ? mapRow(row) : null
  },
  findById: async (id) => {
    const rows = await db.select().from(organizationInvite).where(eq(organizationInvite.id, id)).limit(1)
    const row = rows[0]
    return row ? mapRow(row) : null
  },
  revoke: async (id, at) => {
    const [row] = await db
      .update(organizationInvite)
      .set({ revokedAt: at, updatedAt: at })
      .where(and(eq(organizationInvite.id, id), isNull(organizationInvite.revokedAt)))
      .returning()
    return row ? mapRow(row) : null
  },
  markAccepted: async (id, acceptedBy, at) => {
    const acceptedByInt = await resolveUserIntId(db, acceptedBy)
    const [row] = await db
      .update(organizationInvite)
      .set({ acceptedAt: at, acceptedBy, acceptedByInt, updatedAt: at })
      .where(and(eq(organizationInvite.id, id), isNull(organizationInvite.acceptedAt)))
      .returning()
    return row ? mapRow(row) : null
  },
  rotateToken: async (id, tokenHash, expiresAt, at) => {
    const [row] = await db
      .update(organizationInvite)
      .set({
        tokenHash,
        expiresAt,
        revokedAt: null,
        acceptedAt: null,
        acceptedBy: null,
        updatedAt: at,
      })
      .where(eq(organizationInvite.id, id))
      .returning()
    return row ? mapRow(row) : null
  },
})
