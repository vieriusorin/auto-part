import type { Clock } from '../infrastructure/clock.js'
import type { RefreshTokenRepository } from '../infrastructure/refresh-token-repository.js'
import type { TokenGenerator } from '../infrastructure/token-generator.js'

export type LogoutUseCase = (rawToken: string | undefined) => Promise<void>
export type LogoutAllUseCase = (userId: string) => Promise<void>

export const createLogoutUseCase = (deps: {
  refreshTokens: RefreshTokenRepository
  tokenGenerator: TokenGenerator
  clock: Clock
}): LogoutUseCase => {
  return async (rawToken) => {
    if (!rawToken) {
      return
    }
    const hash = deps.tokenGenerator.hash(rawToken)
    const record = await deps.refreshTokens.findByHash(hash)
    if (record && !record.revokedAt) {
      await deps.refreshTokens.markRevoked(record.id, 'logout', deps.clock.now())
    }
  }
}

export const createLogoutAllUseCase = (deps: {
  refreshTokens: RefreshTokenRepository
  clock: Clock
}): LogoutAllUseCase => {
  return async (userId) => {
    await deps.refreshTokens.revokeAllForUser(userId, 'logout_all', deps.clock.now())
  }
}
