import { invalidCredentials } from '../domain/errors.js'
import type { Clock } from '../infrastructure/clock.js'
import type { PasswordHasher, PasswordPolicy } from '../infrastructure/password-hasher.js'
import type { RefreshTokenRepository } from '../infrastructure/refresh-token-repository.js'
import type { UserRepository } from '../infrastructure/user-repository.js'

export type ChangePasswordUseCase = (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => Promise<void>

export const createChangePasswordUseCase = (deps: {
  users: UserRepository
  refreshTokens: RefreshTokenRepository
  passwordHasher: PasswordHasher
  passwordPolicy: PasswordPolicy
  clock: Clock
}): ChangePasswordUseCase => {
  return async (userId, currentPassword, newPassword) => {
    const user = await deps.users.findById(userId)
    if (!user) {
      throw invalidCredentials()
    }
    const ok = await deps.passwordHasher.verify(user.passwordHash, currentPassword)
    if (!ok) {
      throw invalidCredentials()
    }
    deps.passwordPolicy.validate(newPassword)
    const hash = await deps.passwordHasher.hash(newPassword)
    await deps.users.updatePasswordHash(userId, hash)
    await deps.refreshTokens.revokeAllForUser(user.id, 'password_changed', deps.clock.now())
  }
}
