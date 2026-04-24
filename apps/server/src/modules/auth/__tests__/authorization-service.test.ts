import { AuthorizationActions } from '@autocare/shared'
import { describe, expect, it } from 'vitest'
import { createAuthorizationService } from '../application/authorization-service.js'

describe('authorization-service', () => {
  const authorization = createAuthorizationService()

  it('allows admin wildcard access for protected actions', () => {
    const decision = authorization.authorize({
      action: AuthorizationActions.adminUsersManage,
      resourceType: 'system',
      subject: {
        userRole: 'admin',
        isAuthenticated: true,
      },
    })
    expect(decision).toEqual({ allow: true, reasonCode: 'NONE' })
  })

  it('denies user access to admin-only actions', () => {
    const decision = authorization.authorize({
      action: AuthorizationActions.adminUsersManage,
      resourceType: 'system',
      subject: {
        userRole: 'user',
        isAuthenticated: true,
      },
    })
    expect(decision).toEqual({ allow: false, reasonCode: 'FORBIDDEN_PERMISSION' })
  })

  it('applies plan policies with explicit reason code', () => {
    expect(
      authorization.authorizePlan({
        planTier: 'free',
        minimumPlan: 'premium',
      }),
    ).toEqual({ allow: false, reasonCode: 'FORBIDDEN_PLAN' })
    expect(
      authorization.authorizePlan({
        planTier: 'premium',
        minimumPlan: 'premium',
      }),
    ).toEqual({ allow: true, reasonCode: 'NONE' })
  })

  it('enforces trust lock override policy centrally', () => {
    expect(authorization.authorizeTrustWrite({ actorRole: 'member', isLocked: true })).toEqual({
      allow: false,
      reasonCode: 'LOCK_OVERRIDE_REQUIRED',
    })
    expect(authorization.authorizeTrustWrite({ actorRole: 'admin', isLocked: true })).toEqual({
      allow: true,
      reasonCode: 'NONE',
    })
  })
})

