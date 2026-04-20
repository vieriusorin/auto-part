import type { RegisterRequest } from '@autocare/shared'
import { emailAlreadyRegistered } from '../domain/errors.js'
import type {
  IssuedAccessToken,
  IssuedRefreshToken,
  RequestMeta,
  UserRecord,
} from '../domain/types.js'
import type { PasswordHasher, PasswordPolicy } from '../infrastructure/password-hasher.js'
import type { UserRepository } from '../infrastructure/user-repository.js'
import type { SessionService } from './session-service.js'

export type RegisterUseCase = (
  input: RegisterRequest,
  meta: RequestMeta,
) => Promise<{ user: UserRecord; access: IssuedAccessToken; refresh: IssuedRefreshToken }>

export const createRegisterUseCase = (deps: {
  userRepository: UserRepository
  passwordHasher: PasswordHasher
  passwordPolicy: PasswordPolicy
  sessionService: SessionService
}): RegisterUseCase => {
  return async (input, meta) => {
    deps.passwordPolicy.validate(input.password)

    const existing = await deps.userRepository.findByEmail(input.email)
    if (existing) {
      throw emailAlreadyRegistered()
    }

    const passwordHash = await deps.passwordHasher.hash(input.password)
    const user = await deps.userRepository.create({
      email: input.email,
      passwordHash,
      organizationId: input.organizationId ?? null,
    })

    const { access, refresh } = await deps.sessionService.issue(user, meta)
    return { user, access, refresh }
  }
}
