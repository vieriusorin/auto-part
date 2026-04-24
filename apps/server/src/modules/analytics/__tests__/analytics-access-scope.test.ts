import { describe, expect, it } from 'vitest'
import {
  resolveAnalyticsDashboardFilters,
  resolveAnalyticsResourceScope,
} from '../application/analytics-access-scope.js'

describe('analytics access scope', () => {
  it('resolves elevated scope from admin user', () => {
    const scope = resolveAnalyticsResourceScope({
      id: 'admin-1',
      role: 'admin',
      organizationId: 'org-1',
    })

    expect(scope).toEqual({
      actorId: 'admin-1',
      organizationId: 'org-1',
      isElevated: true,
    })
  })

  it('normalizes dashboard filters', () => {
    const scope = resolveAnalyticsResourceScope({
      id: 'user-1',
      role: 'user',
      organizationId: 'org-1',
    })
    const filters = resolveAnalyticsDashboardFilters({
      scope,
      requested: {
        country: ' ro ',
        platform: 'ios',
        channel: ' Organic ',
      },
    })

    expect(filters).toEqual({
      country: 'RO',
      platform: 'ios',
      channel: 'organic',
    })
  })
})

