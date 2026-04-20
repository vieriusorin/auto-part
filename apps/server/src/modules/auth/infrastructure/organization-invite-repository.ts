import { organizationInvite } from '@autocare/db'
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

export const createOrganizationInviteRepository = (
  db: NodePgDatabase,
): OrganizationInviteRepository => ({
  create: async (input) => {
    const [row] = await db
      .insert(organizationInvite)
      .values({
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        invitedBy: input.invitedBy,
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
    const [row] = await db
      .update(organizationInvite)
      .set({ acceptedAt: at, acceptedBy, updatedAt: at })
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
