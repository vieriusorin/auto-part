import { describe, expect, it } from 'vitest'
import { vehicle } from '@autocare/db'
import { buildSqlFilterFromPolicies } from '../application/policy-sql.js'

describe('policy-sql', () => {
  it('returns undefined for empty policy list', () => {
    const where = buildSqlFilterFromPolicies([], {
      organizationId: vehicle.organizationId,
      isLocked: vehicle.isLocked,
    })
    expect(where).toBeUndefined()
  })

  it('builds a SQL clause when policy conditions exist', () => {
    const where = buildSqlFilterFromPolicies(
      [{ organizationId: 'org-1', isLocked: false }],
      {
        organizationId: vehicle.organizationId,
        isLocked: vehicle.isLocked,
      },
    )
    expect(where).toBeDefined()
  })
})

