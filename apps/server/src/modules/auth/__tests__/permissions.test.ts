import { describe, expect, it } from 'vitest'
import {
  hasPermission,
  PERMISSION_WILDCARD,
  permissionsForRole,
  roleHasPermission,
} from '../application/permissions.js'

describe('permissions', () => {
  it('grants wildcard to admin', () => {
    const perms = permissionsForRole('admin')
    expect(perms).toEqual([PERMISSION_WILDCARD])
  })

  it('grants a fixed list to regular users', () => {
    const perms = permissionsForRole('user')
    expect(perms).toContain('vehicles.read')
    expect(perms).toContain('logs.create')
    expect(perms).not.toContain(PERMISSION_WILDCARD)
    expect(perms).not.toContain('admin.users.manage')
  })

  it('returns a fresh array each call (no aliasing)', () => {
    const a = permissionsForRole('user')
    const b = permissionsForRole('user')
    a.push('mutated')
    expect(b).not.toContain('mutated')
  })

  it('hasPermission respects wildcard', () => {
    expect(hasPermission(['*'], 'anything.at.all')).toBe(true)
    expect(hasPermission(['vehicles.read'], 'vehicles.read')).toBe(true)
    expect(hasPermission(['vehicles.read'], 'logs.create')).toBe(false)
    expect(hasPermission([], 'vehicles.read')).toBe(false)
  })

  it('roleHasPermission composes role + check', () => {
    expect(roleHasPermission('admin', 'admin.users.manage')).toBe(true)
    expect(roleHasPermission('admin', 'logs.create')).toBe(true)
    expect(roleHasPermission('user', 'logs.create')).toBe(true)
    expect(roleHasPermission('user', 'admin.users.manage')).toBe(false)
  })
})
