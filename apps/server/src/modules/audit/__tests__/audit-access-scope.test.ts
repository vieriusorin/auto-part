import { describe, expect, it } from 'vitest'
import { filterAuditLogsByScope, resolveAuditResourceScope } from '../application/audit-access-scope.js'

describe('audit access scope', () => {
  it('returns all logs for elevated users', () => {
    const scope = resolveAuditResourceScope({
      id: 'admin-1',
      role: 'admin',
      organizationId: 'org-1',
    })
    const logs = [
      {
        entityType: 'document',
        entityId: 'doc-1',
        action: 'create',
        oldValues: null,
        newValues: { title: 'A' },
        userId: 'user-1',
      },
      {
        entityType: 'maintenance_log',
        entityId: 'm-1',
        action: 'update',
        oldValues: { odometer: 1000 },
        newValues: { odometer: 1200 },
        userId: 'user-2',
      },
    ] as const

    expect(filterAuditLogsByScope([...logs], scope)).toHaveLength(2)
  })

  it('filters logs to actor for non-elevated scope', () => {
    const scope = resolveAuditResourceScope({
      id: 'user-1',
      role: 'user',
      organizationId: 'org-1',
    })
    const logs = [
      {
        entityType: 'document',
        entityId: 'doc-1',
        action: 'create',
        oldValues: null,
        newValues: { title: 'A' },
        userId: 'user-1',
      },
      {
        entityType: 'maintenance_log',
        entityId: 'm-1',
        action: 'update',
        oldValues: { odometer: 1000 },
        newValues: { odometer: 1200 },
        userId: 'user-2',
      },
    ] as const

    const filtered = filterAuditLogsByScope([...logs], scope)
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.userId).toBe('user-1')
  })
})

