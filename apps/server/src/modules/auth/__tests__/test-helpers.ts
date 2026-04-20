import { randomUUID } from 'node:crypto'
import type { ClientKind, OrganizationInviteRole, PlanTier, UserRole } from '@autocare/shared'
import type { RefreshTokenRecord, UserRecord } from '../domain/types.js'
import type { Clock } from '../infrastructure/clock.js'
import type { OrganizationInviteRepository } from '../infrastructure/organization-invite-repository.js'
import type { RefreshTokenRepository } from '../infrastructure/refresh-token-repository.js'
import type { UserRepository } from '../infrastructure/user-repository.js'

export const createFakeClock = (
  start: Date = new Date('2026-01-01T00:00:00.000Z'),
): Clock & {
  advance: (ms: number) => void
  setNow: (d: Date) => void
} => {
  let current = new Date(start)
  return {
    now: () => new Date(current),
    advance: (ms) => {
      current = new Date(current.getTime() + ms)
    },
    setNow: (d) => {
      current = new Date(d)
    },
  }
}

export const createInMemoryUserRepo = (): UserRepository & {
  _all: () => UserRecord[]
  _setRole: (id: string, role: UserRole) => void
  _setOrganizationRole: (id: string, role: 'owner' | 'admin' | 'manager' | 'driver' | 'viewer') => void
  _setOrganizationId: (id: string, organizationId: string | null) => void
  _setOrganizationPlan: (organizationId: string, plan: PlanTier) => void
  _setPlanOverride: (id: string, planOverride: PlanTier | null) => void
} => {
  const byId = new Map<string, UserRecord>()
  const orgPlans = new Map<string, PlanTier>()

  const hydratePlan = (user: UserRecord): UserRecord => {
    const organizationPlan =
      (user.organizationId ? orgPlans.get(user.organizationId) : null) ?? user.organizationPlan ?? 'free'
    const planOverride = user.planOverride ?? null
    return {
      ...user,
      organizationPlan,
      planOverride,
      effectivePlan: planOverride ?? organizationPlan,
    }
  }
  return {
    findByEmail: async (email) => {
      for (const row of byId.values()) {
        if (row.email === email) return hydratePlan(row)
      }
      return null
    },
    findById: async (id) => {
      const row = byId.get(id)
      return row ? hydratePlan(row) : null
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
      const now = new Date()
      const id = randomUUID()
      const orgId = organizationId ?? id
      const orgPlan = organizationPlan ?? orgPlans.get(orgId) ?? 'free'
      orgPlans.set(orgId, orgPlan)
      const user: UserRecord = {
        id,
        email,
        passwordHash,
        role: (role ?? 'user') as UserRole,
        organizationId: orgId,
        organizationPlan: orgPlan,
        planOverride: planOverride ?? null,
        effectivePlan: planOverride ?? orgPlan,
        organizationRole: (organizationRole ?? 'owner') as OrganizationInviteRole,
        emailVerifiedAt: emailVerifiedAt ?? null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      }
      byId.set(user.id, user)
      return hydratePlan(user)
    },
    ensurePersonalOrganization: async (userId) => {
      const u = byId.get(userId)
      if (u && u.organizationId === null) {
        if (!orgPlans.has(userId)) {
          orgPlans.set(userId, 'free')
        }
        byId.set(userId, { ...u, organizationId: userId, updatedAt: new Date() })
      }
    },
    updatePasswordHash: async (id, passwordHash) => {
      const u = byId.get(id)
      if (u) byId.set(id, { ...u, passwordHash, updatedAt: new Date() })
    },
    updateOrganizationMembership: async (id, organizationId, organizationRole) => {
      const u = byId.get(id)
      if (u) {
        if (!orgPlans.has(organizationId)) {
          orgPlans.set(organizationId, 'free')
        }
        byId.set(id, { ...u, organizationId, organizationRole, updatedAt: new Date() })
      }
    },
    updateOrganizationPlan: async (organizationId, plan) => {
      orgPlans.set(organizationId, plan)
    },
    updatePlanOverride: async (id, planOverride) => {
      const u = byId.get(id)
      if (u) {
        byId.set(id, { ...u, planOverride, updatedAt: new Date() })
      }
    },
    recordSuccessfulLogin: async (id, at) => {
      const u = byId.get(id)
      if (u) {
        byId.set(id, {
          ...u,
          lastLoginAt: at,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: at,
        })
      }
    },
    recordFailedLogin: async (id, lockedUntil) => {
      const u = byId.get(id)
      if (u) {
        byId.set(id, {
          ...u,
          failedLoginAttempts: u.failedLoginAttempts + 1,
          lockedUntil,
          updatedAt: new Date(),
        })
      }
    },
    resetFailedAttempts: async (id) => {
      const u = byId.get(id)
      if (u)
        byId.set(id, { ...u, failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    },
    _all: () => Array.from(byId.values()),
    _setOrganizationRole: (id, role) => {
      const user = byId.get(id)
      if (!user) return
      byId.set(id, { ...user, organizationRole: role, updatedAt: new Date() })
    },
    _setRole: (id, role) => {
      const user = byId.get(id)
      if (!user) return
      byId.set(id, { ...user, role, updatedAt: new Date() })
    },
    _setOrganizationId: (id, organizationId) => {
      const user = byId.get(id)
      if (!user) return
      if (organizationId && !orgPlans.has(organizationId)) {
        orgPlans.set(organizationId, 'free')
      }
      byId.set(id, { ...user, organizationId, updatedAt: new Date() })
    },
    _setOrganizationPlan: (organizationId, plan) => {
      orgPlans.set(organizationId, plan)
    },
    _setPlanOverride: (id, planOverride) => {
      const user = byId.get(id)
      if (!user) return
      byId.set(id, { ...user, planOverride, updatedAt: new Date() })
    },
  }
}

export const createInMemoryRefreshRepo = (): RefreshTokenRepository & {
  _all: () => RefreshTokenRecord[]
  _byId: (id: string) => RefreshTokenRecord | undefined
} => {
  const byId = new Map<string, RefreshTokenRecord>()

  const insertImpl: RefreshTokenRepository['insert'] = async (input) => {
    const id = input.id ?? randomUUID()
    const rec: RefreshTokenRecord = {
      id,
      userId: input.userId,
      familyId: input.familyId,
      tokenHash: input.tokenHash,
      issuedAt: input.issuedAt,
      lastUsedAt: null,
      expiresAt: input.expiresAt,
      absoluteExpiresAt: input.absoluteExpiresAt,
      replacedByTokenId: null,
      revokedAt: null,
      revokedReason: null,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      clientKind: (input.clientKind as ClientKind | 'unknown') ?? 'unknown',
    }
    byId.set(id, rec)
    return rec
  }

  return {
    insert: insertImpl,
    findByHash: async (hash) => {
      for (const rec of byId.values()) {
        if (rec.tokenHash === hash) return rec
      }
      return null
    },
    markRotated: async (oldId, replacedById, at) => {
      const rec = byId.get(oldId)
      if (rec) {
        byId.set(oldId, {
          ...rec,
          revokedAt: at,
          revokedReason: 'rotated',
          replacedByTokenId: replacedById,
          lastUsedAt: at,
        })
      }
    },
    markRevoked: async (id, reason, at) => {
      const rec = byId.get(id)
      if (rec && !rec.revokedAt) {
        byId.set(id, { ...rec, revokedAt: at, revokedReason: reason })
      }
    },
    revokeFamily: async (familyId, reason, at) => {
      for (const [id, rec] of byId) {
        if (rec.familyId === familyId && !rec.revokedAt) {
          byId.set(id, { ...rec, revokedAt: at, revokedReason: reason })
        }
      }
    },
    revokeAllForUser: async (userId, reason, at) => {
      for (const [id, rec] of byId) {
        if (rec.userId === userId && !rec.revokedAt) {
          byId.set(id, { ...rec, revokedAt: at, revokedReason: reason })
        }
      }
    },
    touchLastUsed: async (id, at) => {
      const rec = byId.get(id)
      if (rec) byId.set(id, { ...rec, lastUsedAt: at })
    },
    deleteExpired: async () => 0,
    _all: () => Array.from(byId.values()),
    _byId: (id) => byId.get(id),
  }
}

export const createInMemoryOrganizationInviteRepo = (): OrganizationInviteRepository => {
  const byId = new Map<
    string,
    {
      id: string
      organizationId: string
      email: string
      role: 'owner' | 'admin' | 'manager' | 'driver' | 'viewer'
      tokenHash: string
      expiresAt: Date
      acceptedAt: Date | null
      revokedAt: Date | null
      invitedBy: string
      acceptedBy: string | null
      createdAt: Date
      updatedAt: Date
    }
  >()

  return {
    create: async (input) => {
      const now = new Date()
      const row = {
        id: randomUUID(),
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        acceptedAt: null,
        revokedAt: null,
        invitedBy: input.invitedBy,
        acceptedBy: null,
        createdAt: now,
        updatedAt: now,
      }
      byId.set(row.id, row)
      return row
    },
    listForOrganization: async (organizationId) =>
      Array.from(byId.values())
        .filter((row) => row.organizationId === organizationId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    findActiveByTokenHash: async (tokenHash) => {
      const row = Array.from(byId.values()).find(
        (candidate) =>
          candidate.tokenHash === tokenHash && !candidate.acceptedAt && !candidate.revokedAt,
      )
      return row ?? null
    },
    findById: async (id) => byId.get(id) ?? null,
    revoke: async (id, at) => {
      const row = byId.get(id)
      if (!row || row.revokedAt) return null
      const next = { ...row, revokedAt: at, updatedAt: at }
      byId.set(id, next)
      return next
    },
    markAccepted: async (id, acceptedBy, at) => {
      const row = byId.get(id)
      if (!row || row.acceptedAt) return null
      const next = { ...row, acceptedAt: at, acceptedBy, updatedAt: at }
      byId.set(id, next)
      return next
    },
    rotateToken: async (id, tokenHash, expiresAt, at) => {
      const row = byId.get(id)
      if (!row) return null
      const next = {
        ...row,
        tokenHash,
        expiresAt,
        revokedAt: null,
        acceptedAt: null,
        acceptedBy: null,
        updatedAt: at,
      }
      byId.set(id, next)
      return next
    },
  }
}
