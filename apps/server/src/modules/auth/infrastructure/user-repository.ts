import { organizationPlans, users } from '@autocare/db'
import type { OrganizationInviteRole, PlanTier, UserRole } from '@autocare/shared'
import { randomUUID } from 'node:crypto'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { UserRecord } from '../domain/types.js'

export type CreateUserInput = {
  email: string
  passwordHash: string
  role?: UserRole
  organizationId?: string | null
  organizationPlan?: PlanTier
  planOverride?: PlanTier | null
  organizationRole?: OrganizationInviteRole
  emailVerifiedAt?: Date | null
}

export type UserRepository = {
  findByEmail: (email: string) => Promise<UserRecord | null>
  findById: (id: string) => Promise<UserRecord | null>
  create: (input: CreateUserInput) => Promise<UserRecord>
  ensurePersonalOrganization: (userId: string) => Promise<void>
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>
  updateOrganizationMembership: (
    userId: string,
    organizationId: string,
    organizationRole: OrganizationInviteRole,
  ) => Promise<void>
  updateOrganizationPlan: (organizationId: string, plan: PlanTier) => Promise<void>
  updatePlanOverride: (userId: string, planOverride: PlanTier | null) => Promise<void>
  recordSuccessfulLogin: (userId: string, at: Date) => Promise<void>
  recordFailedLogin: (userId: string, lockedUntil: Date | null) => Promise<void>
  resetFailedAttempts: (userId: string) => Promise<void>
}

const mapRow = (
  row: typeof users.$inferSelect & { organizationPlan: PlanTier | null },
): UserRecord => {
  const organizationPlan = row.organizationPlan ?? 'free'
  const planOverride = row.planOverride as PlanTier | null
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as UserRole,
    organizationId: row.organizationId,
    organizationPlan,
    planOverride,
    effectivePlan: planOverride ?? organizationPlan,
    organizationRole: row.organizationRole as OrganizationInviteRole,
    emailVerifiedAt: row.emailVerifiedAt,
    failedLoginAttempts: row.failedLoginAttempts,
    lockedUntil: row.lockedUntil,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const withPlan = (db: NodePgDatabase) =>
  db
    .select({
      id: users.id,
      idInt: users.idInt,
      email: users.email,
      passwordHash: users.passwordHash,
      role: users.role,
      organizationId: users.organizationId,
      planOverride: users.planOverride,
      organizationRole: users.organizationRole,
      emailVerifiedAt: users.emailVerifiedAt,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      organizationPlan: organizationPlans.plan,
    })
    .from(users)
    .leftJoin(organizationPlans, eq(users.organizationId, organizationPlans.organizationId))

export const createUserRepository = (db: NodePgDatabase): UserRepository => ({
  findByEmail: async (email) => {
    const rows = await withPlan(db).where(eq(users.email, email)).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  },
  findById: async (id) => {
    const rows = await withPlan(db).where(eq(users.id, id)).limit(1)
    return rows[0] ? mapRow(rows[0]) : null
  },
  create: async ({
    email,
    passwordHash,
    role,
    organizationId,
    organizationPlan,
    planOverride,
    organizationRole,
    emailVerifiedAt,
  }) => {
    const id = randomUUID()
    const orgId = organizationId ?? id
    const now = new Date()
    const [row] = await db
      .insert(users)
      .values({
        id,
        email,
        passwordHash,
        role: role ?? 'user',
        organizationId: orgId,
        planOverride: planOverride ?? null,
        organizationRole: organizationRole ?? 'owner',
        emailVerifiedAt: emailVerifiedAt ?? null,
      })
      .returning()
    await db
      .insert(organizationPlans)
      .values({
        organizationId: orgId,
        plan: organizationPlan ?? 'free',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: organizationPlans.organizationId })
    if (!row) {
      throw new Error('Failed to create user')
    }
    const hydrated = await withPlan(db).where(eq(users.id, row.id)).limit(1)
    if (!hydrated[0]) {
      throw new Error('Failed to load created user')
    }
    return mapRow(hydrated[0])
  },
  ensurePersonalOrganization: async (userId) => {
    await db
      .update(users)
      .set({ organizationId: userId, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.organizationId)))
  },
  updatePasswordHash: async (userId, passwordHash) => {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId))
  },
  updateOrganizationMembership: async (userId, organizationId, organizationRole) => {
    const now = new Date()
    await db
      .update(users)
      .set({ organizationId, organizationRole, updatedAt: now })
      .where(eq(users.id, userId))
    await db
      .insert(organizationPlans)
      .values({
        organizationId,
        plan: 'free',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: organizationPlans.organizationId })
  },
  updateOrganizationPlan: async (organizationId, plan) => {
    const now = new Date()
    await db
      .insert(organizationPlans)
      .values({
        organizationId,
        plan,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: organizationPlans.organizationId,
        set: { plan, updatedAt: now },
      })
  },
  updatePlanOverride: async (userId, planOverride) => {
    await db.update(users).set({ planOverride, updatedAt: new Date() }).where(eq(users.id, userId))
  },
  recordSuccessfulLogin: async (userId, at) => {
    await db
      .update(users)
      .set({
        lastLoginAt: at,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: at,
      })
      .where(eq(users.id, userId))
  },
  recordFailedLogin: async (userId, lockedUntil) => {
    await db
      .update(users)
      .set({
        failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
  },
  resetFailedAttempts: async (userId) => {
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(users.id, userId))
  },
})
