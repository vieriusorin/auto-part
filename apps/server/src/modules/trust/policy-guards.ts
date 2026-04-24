import { createAuthorizationService } from '../auth/application/authorization-service.js'

type TrustWriteInput = {
  actorRole: 'member' | 'admin' | 'service'
  isLocked: boolean
}

type TrustPolicyResult = {
  allowed: boolean
  reasonCode: 'LOCK_OVERRIDE_REQUIRED' | 'NONE'
}

export const assertTrustWriteAllowed = (input: TrustWriteInput): TrustPolicyResult => {
  const authorization = createAuthorizationService()
  const decision = authorization.authorizeTrustWrite(input)
  return {
    allowed: decision.allow,
    reasonCode: decision.reasonCode === 'LOCK_OVERRIDE_REQUIRED' ? 'LOCK_OVERRIDE_REQUIRED' : 'NONE',
  }
}
