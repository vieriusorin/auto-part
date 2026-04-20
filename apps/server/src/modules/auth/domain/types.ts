import type { ClientKind, OrganizationInviteRole, PlanTier, UserRole } from '@autocare/shared'

export type AuthenticatedUser = {
  id: string
  email: string
  role: UserRole
  organizationId: string | null
  organizationPlan: PlanTier
  planOverride: PlanTier | null
  effectivePlan: PlanTier
  permissions: string[]
  tokenId: string
}

export type UserRecord = {
  id: string
  email: string
  passwordHash: string
  role: UserRole
  organizationId: string | null
  organizationPlan: PlanTier
  planOverride: PlanTier | null
  effectivePlan: PlanTier
  organizationRole: OrganizationInviteRole
  emailVerifiedAt: Date | null
  failedLoginAttempts: number
  lockedUntil: Date | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type OrganizationInviteRecord = {
  id: string
  organizationId: string
  email: string
  role: OrganizationInviteRole
  tokenHash: string
  expiresAt: Date
  acceptedAt: Date | null
  revokedAt: Date | null
  invitedBy: string
  acceptedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export type RefreshTokenRecord = {
  id: string
  userId: string
  familyId: string
  tokenHash: string
  issuedAt: Date
  lastUsedAt: Date | null
  expiresAt: Date
  absoluteExpiresAt: Date
  replacedByTokenId: string | null
  revokedAt: Date | null
  revokedReason: string | null
  userAgent: string | null
  ipAddress: string | null
  clientKind: ClientKind | 'unknown'
}

export type IssuedAccessToken = {
  token: string
  jti: string
  expiresAt: Date
}

export type IssuedRefreshToken = {
  id: string
  rawToken: string
  tokenHash: string
  familyId: string
  expiresAt: Date
  absoluteExpiresAt: Date
}

export type RequestMeta = {
  userAgent?: string
  ipAddress?: string
  clientKind: ClientKind | 'unknown'
}
