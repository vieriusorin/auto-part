import { createHash, randomBytes } from 'node:crypto'
import type { OrganizationInviteRole } from '@autocare/shared'
import {
  emailAlreadyRegistered,
  inviteExpired,
  inviteEmailMismatch,
  inviteForbidden,
  inviteInvalid,
  inviteOrganizationConflict,
  inviteResendCooldown,
  inviteRevoked,
} from '../domain/errors.js'
import type { IssuedAccessToken, IssuedRefreshToken, RequestMeta, UserRecord } from '../domain/types.js'
import type { Clock } from '../infrastructure/clock.js'
import type {
  OrganizationInviteRecord,
} from '../domain/types.js'
import type {
  OrganizationInviteRepository,
} from '../infrastructure/organization-invite-repository.js'
import type { PasswordHasher, PasswordPolicy } from '../infrastructure/password-hasher.js'
import type { UserRepository } from '../infrastructure/user-repository.js'
import type { AuthorizationService } from './authorization-service.js'
import type { SessionService } from './session-service.js'

export type CreateOrganizationInviteUseCase = (
  input: {
    organizationId: string
    email: string
    role: OrganizationInviteRole
    expiresInDays?: number
  },
  actor: UserRecord,
) => Promise<{ invite: OrganizationInviteRecord; rawToken: string }>

export type ListOrganizationInvitesUseCase = (
  organizationId: string,
  actor: UserRecord,
) => Promise<OrganizationInviteRecord[]>

export type RevokeOrganizationInviteUseCase = (
  inviteId: string,
  organizationId: string,
  actor: UserRecord,
) => Promise<OrganizationInviteRecord>

export type ResendOrganizationInviteUseCase = (
  inviteId: string,
  organizationId: string,
  actor: UserRecord,
) => Promise<{ invite: OrganizationInviteRecord; rawToken: string }>

export type PreviewInviteUseCase = (
  rawToken: string,
) => Promise<OrganizationInviteRecord>

export type AcceptInviteAndRegisterUseCase = (
  input: { token: string; password: string },
  meta: RequestMeta,
) => Promise<{ user: UserRecord; access: IssuedAccessToken; refresh: IssuedRefreshToken }>

export type AcceptInviteUseCase = (
  input: { token: string },
  user: UserRecord,
) => Promise<OrganizationInviteRecord>

const hashInviteToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken).digest('hex')

export const createOrganizationInviteUseCase = (deps: {
  invites: OrganizationInviteRepository
  clock: Clock
  defaultExpiresDays: number
  authorization: AuthorizationService
}): CreateOrganizationInviteUseCase => {
  return async (input, actor) => {
    if (
      !deps.authorization.canManageOrganizationInvites(
        {
          userRole: actor.role,
          organizationId: actor.organizationId,
          organizationRole: actor.organizationRole,
        },
        input.organizationId,
      )
    ) {
      throw inviteForbidden()
    }
    const rawToken = randomBytes(32).toString('base64url')
    const tokenHash = hashInviteToken(rawToken)
    const now = deps.clock.now()
    const expiresInDays = input.expiresInDays ?? deps.defaultExpiresDays
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
    const invite = await deps.invites.create({
      organizationId: input.organizationId,
      email: input.email,
      role: input.role,
      tokenHash,
      expiresAt,
      invitedBy: actor.id,
    })
    return { invite, rawToken }
  }
}

export const createListOrganizationInvitesUseCase = (deps: {
  invites: OrganizationInviteRepository
  authorization: AuthorizationService
}): ListOrganizationInvitesUseCase => {
  return async (organizationId, actor) => {
    if (
      !deps.authorization.canManageOrganizationInvites(
        {
          userRole: actor.role,
          organizationId: actor.organizationId,
          organizationRole: actor.organizationRole,
        },
        organizationId,
      )
    ) {
      throw inviteForbidden()
    }
    return deps.invites.listForOrganization(organizationId)
  }
}

export const createRevokeOrganizationInviteUseCase = (deps: {
  invites: OrganizationInviteRepository
  clock: Clock
  authorization: AuthorizationService
}): RevokeOrganizationInviteUseCase => {
  return async (inviteId, organizationId, actor) => {
    if (
      !deps.authorization.canManageOrganizationInvites(
        {
          userRole: actor.role,
          organizationId: actor.organizationId,
          organizationRole: actor.organizationRole,
        },
        organizationId,
      )
    ) {
      throw inviteForbidden()
    }
    const invite = await deps.invites.findById(inviteId)
    if (!invite || invite.organizationId !== organizationId) {
      throw inviteInvalid()
    }
    if (invite.acceptedAt) {
      throw inviteInvalid()
    }
    const revoked = await deps.invites.revoke(invite.id, deps.clock.now())
    if (!revoked) {
      throw inviteRevoked()
    }
    return revoked
  }
}

export const createResendOrganizationInviteUseCase = (deps: {
  invites: OrganizationInviteRepository
  clock: Clock
  defaultExpiresDays: number
  resendCooldownMs: number
  resendCooldownOwnerMs: number
  resendCooldownAdminMs: number
  authorization: AuthorizationService
}): ResendOrganizationInviteUseCase => {
  return async (inviteId, organizationId, actor) => {
    if (
      !deps.authorization.canManageOrganizationInvites(
        {
          userRole: actor.role,
          organizationId: actor.organizationId,
          organizationRole: actor.organizationRole,
        },
        organizationId,
      )
    ) {
      throw inviteForbidden()
    }
    const existing = await deps.invites.findById(inviteId)
    if (!existing || existing.organizationId !== organizationId) {
      throw inviteInvalid()
    }
    if (existing.acceptedAt) {
      throw inviteInvalid()
    }
    if (existing.revokedAt) {
      throw inviteRevoked()
    }
    const now = deps.clock.now()
    const roleCooldownMs =
      actor.organizationRole === 'owner'
        ? deps.resendCooldownOwnerMs
        : actor.organizationRole === 'admin'
          ? deps.resendCooldownAdminMs
          : deps.resendCooldownMs
    const elapsedMs = Math.max(0, now.getTime() - existing.createdAt.getTime())
    if (elapsedMs < roleCooldownMs) {
      throw inviteResendCooldown()
    }
    const rawToken = randomBytes(32).toString('base64url')
    const tokenHash = hashInviteToken(rawToken)
    const expiresAt = new Date(now.getTime() + deps.defaultExpiresDays * 24 * 60 * 60 * 1000)
    const invite = await deps.invites.rotateToken(existing.id, tokenHash, expiresAt, now)
    if (!invite) {
      throw inviteInvalid()
    }
    return { invite, rawToken }
  }
}

export const createPreviewInviteUseCase = (deps: {
  invites: OrganizationInviteRepository
  clock: Clock
}): PreviewInviteUseCase => {
  return async (rawToken) => {
    const invite = await deps.invites.findActiveByTokenHash(hashInviteToken(rawToken))
    if (!invite) {
      throw inviteInvalid()
    }
    if (invite.revokedAt) {
      throw inviteRevoked()
    }
    if (invite.expiresAt.getTime() <= deps.clock.now().getTime()) {
      throw inviteExpired()
    }
    return invite
  }
}

export const createAcceptInviteAndRegisterUseCase = (deps: {
  invites: OrganizationInviteRepository
  users: UserRepository
  passwordHasher: PasswordHasher
  passwordPolicy: PasswordPolicy
  sessionService: SessionService
  clock: Clock
}): AcceptInviteAndRegisterUseCase => {
  return async (input, meta) => {
    deps.passwordPolicy.validate(input.password)
    const invite = await deps.invites.findActiveByTokenHash(hashInviteToken(input.token))
    if (!invite) {
      throw inviteInvalid()
    }
    if (invite.revokedAt) {
      throw inviteRevoked()
    }
    if (invite.expiresAt.getTime() <= deps.clock.now().getTime()) {
      throw inviteExpired()
    }
    const existing = await deps.users.findByEmail(invite.email)
    if (existing) {
      throw emailAlreadyRegistered()
    }

    const passwordHash = await deps.passwordHasher.hash(input.password)
    const user = await deps.users.create({
      email: invite.email,
      passwordHash,
      organizationId: invite.organizationId,
      organizationRole: invite.role,
    })
    await deps.invites.markAccepted(invite.id, user.id, deps.clock.now())
    const { access, refresh } = await deps.sessionService.issue(user, meta)
    return { user, access, refresh }
  }
}

export const createAcceptInviteUseCase = (deps: {
  invites: OrganizationInviteRepository
  users: UserRepository
  clock: Clock
}): AcceptInviteUseCase => {
  return async (input, user) => {
    const invite = await deps.invites.findActiveByTokenHash(hashInviteToken(input.token))
    if (!invite) {
      throw inviteInvalid()
    }
    if (invite.revokedAt) {
      throw inviteRevoked()
    }
    if (invite.expiresAt.getTime() <= deps.clock.now().getTime()) {
      throw inviteExpired()
    }
    if (invite.email !== user.email) {
      throw inviteEmailMismatch()
    }
    if (user.organizationId && user.organizationId !== invite.organizationId) {
      throw inviteOrganizationConflict()
    }
    await deps.users.updateOrganizationMembership(user.id, invite.organizationId, invite.role)
    const accepted = await deps.invites.markAccepted(invite.id, user.id, deps.clock.now())
    if (!accepted) {
      throw inviteInvalid()
    }
    return accepted
  }
}
