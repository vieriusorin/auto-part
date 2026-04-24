import { describe, expect, it } from 'vitest'
import { canAccessDocumentResource, createUserAccessScope, documentPolicyConditions } from '../application/access-scope.js'

describe('access-scope', () => {
  it('marks global admin as elevated', () => {
    const scope = createUserAccessScope({
      id: 'u1',
      organizationId: 'org-1',
      role: 'admin',
      organizationRole: 'viewer',
    })
    expect(scope.isElevated).toBe(true)
  })

  it('returns own-resource condition for non-elevated user', () => {
    const scope = createUserAccessScope({
      id: 'u2',
      organizationId: 'org-1',
      role: 'user',
      organizationRole: 'viewer',
    })
    expect(documentPolicyConditions(scope)).toEqual([{ creatorId: 'u2' }])
    expect(canAccessDocumentResource(scope, { creatorId: 'u2' })).toBe(true)
    expect(canAccessDocumentResource(scope, { creatorId: 'u3' })).toBe(false)
  })
})

