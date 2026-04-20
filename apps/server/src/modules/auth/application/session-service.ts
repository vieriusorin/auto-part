import { randomUUID } from 'node:crypto'
import type { AuthConfig } from '@autocare/config/server'
import type { ClientKind } from '@autocare/shared'
import type {
  IssuedAccessToken,
  IssuedRefreshToken,
  RequestMeta,
  UserRecord,
} from '../domain/types.js'
import type { Clock } from '../infrastructure/clock.js'
import type { JwtSigner } from '../infrastructure/jwt-signer.js'
import type { RefreshTokenRepository } from '../infrastructure/refresh-token-repository.js'
import type { TokenGenerator } from '../infrastructure/token-generator.js'

export type SessionService = {
  issue: (
    user: UserRecord,
    meta: RequestMeta,
  ) => Promise<{ access: IssuedAccessToken; refresh: IssuedRefreshToken }>
  rotate: (
    user: UserRecord,
    previousTokenId: string,
    familyId: string,
    absoluteExpiresAt: Date,
    meta: RequestMeta,
  ) => Promise<{ access: IssuedAccessToken; refresh: IssuedRefreshToken }>
}

const daysFromNow = (now: Date, days: number): Date =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

export const createSessionService = (deps: {
  config: AuthConfig
  jwtSigner: JwtSigner
  tokenGenerator: TokenGenerator
  refreshTokens: RefreshTokenRepository
  clock: Clock
}): SessionService => {
  const { config, jwtSigner, tokenGenerator, refreshTokens, clock } = deps

  const createRefreshToken = async (
    userId: string,
    familyId: string,
    absoluteExpiresAt: Date,
    meta: RequestMeta,
  ): Promise<IssuedRefreshToken> => {
    const now = clock.now()
    const { raw, hash } = tokenGenerator.create()
    const id = randomUUID()
    const expiresAt = daysFromNow(now, config.refresh.ttlDays)
    const effectiveAbsolute = new Date(
      Math.min(
        absoluteExpiresAt.getTime(),
        daysFromNow(now, config.refresh.absoluteMaxDays).getTime(),
      ),
    )
    await refreshTokens.insert({
      id,
      userId,
      familyId,
      tokenHash: hash,
      issuedAt: now,
      expiresAt,
      absoluteExpiresAt: effectiveAbsolute,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      clientKind: (meta.clientKind as ClientKind | 'unknown') ?? 'unknown',
    })
    return {
      id,
      rawToken: raw,
      tokenHash: hash,
      familyId,
      expiresAt,
      absoluteExpiresAt: effectiveAbsolute,
    }
  }

  return {
    issue: async (user, meta) => {
      const access = await jwtSigner.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      })
      const familyId = randomUUID()
      const absoluteExpiresAt = daysFromNow(clock.now(), config.refresh.absoluteMaxDays)
      const refresh = await createRefreshToken(user.id, familyId, absoluteExpiresAt, meta)
      return { access, refresh }
    },
    rotate: async (user, previousTokenId, familyId, absoluteExpiresAt, meta) => {
      const access = await jwtSigner.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      })
      const refresh = await createRefreshToken(user.id, familyId, absoluteExpiresAt, meta)
      const now = clock.now()
      await refreshTokens.markRotated(previousTokenId, refresh.id, now)
      return { access, refresh }
    },
  }
}
