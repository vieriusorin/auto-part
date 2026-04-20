import { randomUUID } from 'node:crypto'
import type { IssuedAccessToken, IssuedRefreshToken, RequestMeta, UserRecord } from '../domain/types.js'
import { socialAuthDisabled } from '../domain/errors.js'
import type { PasswordHasher } from '../infrastructure/password-hasher.js'
import type { GoogleOauthClient } from '../infrastructure/google-oauth-client.js'
import type { UserRepository } from '../infrastructure/user-repository.js'
import type { SessionService } from './session-service.js'

export type SocialLoginUseCase = (
  input: {
    provider: 'google'
    code: string
    redirectUri?: string
  },
  meta: RequestMeta,
) => Promise<{ user: UserRecord; access: IssuedAccessToken; refresh: IssuedRefreshToken }>

export const createSocialLoginUseCase = (deps: {
  enabled: boolean
  users: UserRepository
  passwordHasher: PasswordHasher
  googleClient: GoogleOauthClient
  sessionService: SessionService
}): SocialLoginUseCase => {
  return async (input, meta) => {
    if (!deps.enabled) {
      throw socialAuthDisabled()
    }

    const identity = await deps.googleClient.exchangeCodeForIdentity(input.code, input.redirectUri)
    let user = await deps.users.findByEmail(identity.email)
    if (!user) {
      const randomPassword = randomUUID()
      const passwordHash = await deps.passwordHasher.hash(randomPassword)
      user = await deps.users.create({
        email: identity.email,
        passwordHash,
        emailVerifiedAt: new Date(),
      })
    }

    await deps.users.ensurePersonalOrganization(user.id)
    const reloaded = await deps.users.findById(user.id)
    const sessionUser = reloaded ?? user
    const { access, refresh } = await deps.sessionService.issue(sessionUser, meta)
    return { user: sessionUser, access, refresh }
  }
}
