import { describe, expect, it } from 'vitest'
import { createAuthorizationService } from '../application/authorization-service.js'

describe('permissions', () => {
  const service = createAuthorizationService()
  const wildcard = '*'

  it('grants wildcard to admin', () => {
    const perms = service.permissionsForRole('admin')
    expect(perms).toEqual([wildcard])
  })

  it('grants a fixed list to regular users', () => {
    const perms = service.permissionsForRole('user')
    expect(perms).toContain('vehicles.read')
    expect(perms).toContain('logs.create')
    expect(perms).not.toContain(wildcard)
    expect(perms).not.toContain('admin.users.manage')
  })

  it('returns a fresh array each call (no aliasing)', () => {
    const a = service.permissionsForRole('user')
    const b = service.permissionsForRole('user')
    ;(a as unknown as string[]).push('mutated')
    expect(b).not.toContain('mutated')
  })

  it('hasPermission respects wildcard', () => {
    expect(service.hasPermission(['*'], 'vehicles.read')).toBe(true)
    expect(service.hasPermission(['vehicles.read'], 'vehicles.read')).toBe(true)
    expect(service.hasPermission(['vehicles.read'], 'logs.create')).toBe(false)
    expect(service.hasPermission([], 'vehicles.read')).toBe(false)
  })

  it('roleHasPermission composes role + check', () => {
    const adminPerms = service.permissionsForRole('admin')
    const userPerms = service.permissionsForRole('user')
    expect(service.hasPermission(adminPerms, 'admin.users.manage')).toBe(true)
    expect(service.hasPermission(adminPerms, 'logs.create')).toBe(true)
    expect(service.hasPermission(userPerms, 'logs.create')).toBe(true)
    expect(service.hasPermission(userPerms, 'admin.users.manage')).toBe(false)
  })
})
