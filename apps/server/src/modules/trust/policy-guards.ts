type TrustWriteInput = {
  actorRole: 'member' | 'admin' | 'service'
  isLocked: boolean
}

type TrustPolicyResult = {
  allowed: boolean
  reasonCode: 'LOCK_OVERRIDE_REQUIRED' | 'NONE'
}

export const assertTrustWriteAllowed = (input: TrustWriteInput): TrustPolicyResult => {
  if (input.isLocked && input.actorRole !== 'admin' && input.actorRole !== 'service') {
    return { allowed: false, reasonCode: 'LOCK_OVERRIDE_REQUIRED' }
  }
  return { allowed: true, reasonCode: 'NONE' }
}
