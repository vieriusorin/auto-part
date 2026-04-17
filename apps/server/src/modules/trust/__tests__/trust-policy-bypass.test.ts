import { describe, expect, it } from 'vitest'
import { assertTrustWriteAllowed } from '../policy-guards.js'

describe('trust policy bypass', () => {
  it('denies writes for locked resource without admin override', () => {
    const result = assertTrustWriteAllowed({
      actorRole: 'member',
      isLocked: true,
    })

    expect(result.allowed).toBe(false)
    expect(result.reasonCode).toBe('LOCK_OVERRIDE_REQUIRED')
  })
})
