import type { AuthConfig } from '@autocare/config/server'
import {
  refreshTokenExpired,
  refreshTokenInvalid,
  refreshTokenReused,
  sessionExpired,
} from '../domain/errors.js'
import type {
  IssuedAccessToken,
  IssuedRefreshToken,
  RequestMeta,
  UserRecord,
} from '../domain/types.js'
import type { Clock } from '../infrastructure/clock.js'
import type { RefreshTokenRepository } from '../infrastructure/refresh-token-repository.js'
import type { TokenGenerator } from '../infrastructure/token-generator.js'
import type { UserRepository } from '../infrastructure/user-repository.js'
import type { SessionService } from './session-service.js'

export type RefreshUseCase = (
  rawToken: string,
  meta: RequestMeta,
) => Promise<{ user: UserRecord; access: IssuedAccessToken; refresh: IssuedRefreshToken }>

export const createRefreshUseCase = (deps: {
  refreshConfig: AuthConfig['refresh']
  clock: Clock
  tokenGenerator: TokenGenerator
  refreshTokens: RefreshTokenRepository
  users: UserRepository
  sessionService: SessionService
}): RefreshUseCase => {
  return async (rawToken, meta) => {
    const now = deps.clock.now()
    const hash = deps.tokenGenerator.hash(rawToken)
    const record = await deps.refreshTokens.findByHash(hash)

    if (!record) {
      throw refreshTokenInvalid()
    }

    if (record.revokedAt) {
      // A request arrived carrying a token that had already been rotated. Two cases:
      //
      //   1. Grace window: the caller's just-rotated token is being retried
      //      because of a lost response. Accept if we're within graceSeconds
      //      of the rotation and do NOT issue yet another refresh (the new one
      //      was already handed out on the successful call); simply return
      //      fresh access token and keep the latest refresh alive.
      //
      //   2. True reuse: attacker replayed a stolen, already-rotated token.
      //      Revoke the whole family and fail.
      const revokedAtMs = record.revokedAt.getTime()
      const graceMs = deps.refreshConfig.graceSeconds * 1000
      const withinGrace = graceMs > 0 && now.getTime() - revokedAtMs < graceMs

      if (deps.refreshConfig.detectReuse && (!withinGrace || record.revokedReason !== 'rotated')) {
        await deps.refreshTokens.revokeFamily(record.familyId, 'reuse_detected', now)
        throw refreshTokenReused()
      }

      if (!withinGrace) {
        throw refreshTokenInvalid()
      }
    }

    if (record.expiresAt.getTime() <= now.getTime()) {
      throw refreshTokenExpired()
    }

    if (record.absoluteExpiresAt.getTime() <= now.getTime()) {
      throw sessionExpired()
    }

    if (record.lastUsedAt) {
      const idleMs = now.getTime() - record.lastUsedAt.getTime()
      const idleLimitMs = deps.refreshConfig.inactivityDays * 24 * 60 * 60 * 1000
      if (idleLimitMs > 0 && idleMs > idleLimitMs) {
        await deps.refreshTokens.markRevoked(record.id, 'inactivity', now)
        throw sessionExpired()
      }
    }

    const user = await deps.users.findById(record.userId)
    if (!user) {
      await deps.refreshTokens.revokeFamily(record.familyId, 'user_deleted', now)
      throw refreshTokenInvalid()
    }

    await deps.users.ensurePersonalOrganization(user.id)
    const sessionUser = (await deps.users.findById(user.id)) ?? user

    if (deps.refreshConfig.rotate) {
      const { access, refresh } = await deps.sessionService.rotate(
        sessionUser,
        record.id,
        record.familyId,
        record.absoluteExpiresAt,
        meta,
      )
      return { user: sessionUser, access, refresh }
    }

    await deps.refreshTokens.touchLastUsed(record.id, now)
    const { access, refresh } = await deps.sessionService.issue(sessionUser, meta)
    return { user: sessionUser, access, refresh }
  }
}
