import type { AuthConfig } from '@autocare/config/server'
import type { LoginRequest } from '@autocare/shared'
import { accountLocked, invalidCredentials } from '../domain/errors.js'
import type {
  IssuedAccessToken,
  IssuedRefreshToken,
  RequestMeta,
  UserRecord,
} from '../domain/types.js'
import type { Clock } from '../infrastructure/clock.js'
import type { PasswordHasher } from '../infrastructure/password-hasher.js'
import type { UserRepository } from '../infrastructure/user-repository.js'
import type { SessionService } from './session-service.js'

export type LoginUseCase = (
  input: LoginRequest,
  meta: RequestMeta,
) => Promise<{ user: UserRecord; access: IssuedAccessToken; refresh: IssuedRefreshToken }>

const minutesFromNow = (now: Date, minutes: number): Date =>
  new Date(now.getTime() + minutes * 60 * 1000)

export const createLoginUseCase = (deps: {
  loginConfig: AuthConfig['login']
  clock: Clock
  userRepository: UserRepository
  passwordHasher: PasswordHasher
  sessionService: SessionService
}): LoginUseCase => {
  return async (input, meta) => {
    const user = await deps.userRepository.findByEmail(input.email)
    const now = deps.clock.now()

    if (!user) {
      // Constant-time behaviour: still run argon2 verify with a dummy hash to
      // reduce timing signal, but without adding the dummy hash to responses.
      await deps.passwordHasher.verify(
        '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$mJJ6K1i2D8T7W9rDq7Vp4RxLy0EjXk3gO9lK1mBNoPQ',
        input.password,
      )
      throw invalidCredentials()
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      const remainingMs = user.lockedUntil.getTime() - now.getTime()
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000))
      throw accountLocked(remainingMinutes)
    }

    const passwordValid = await deps.passwordHasher.verify(user.passwordHash, input.password)
    if (!passwordValid) {
      const nextAttempt = user.failedLoginAttempts + 1
      const shouldLock = nextAttempt >= deps.loginConfig.maxFailedAttempts
      await deps.userRepository.recordFailedLogin(
        user.id,
        shouldLock ? minutesFromNow(now, deps.loginConfig.lockoutMinutes) : null,
      )
      throw invalidCredentials()
    }

    await deps.userRepository.recordSuccessfulLogin(user.id, now)

    if (deps.passwordHasher.needsRehash(user.passwordHash)) {
      const rehashed = await deps.passwordHasher.hash(input.password)
      await deps.userRepository.updatePasswordHash(user.id, rehashed)
    }

    await deps.userRepository.ensurePersonalOrganization(user.id)
    const reloaded = await deps.userRepository.findById(user.id)
    const sessionUser = reloaded ?? user

    const { access, refresh } = await deps.sessionService.issue(sessionUser, meta)
    return { user: sessionUser, access, refresh }
  }
}
