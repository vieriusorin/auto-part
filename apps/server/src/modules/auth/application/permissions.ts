import type { UserRole } from '@autocare/shared'

export const PERMISSION_WILDCARD = '*'

export type Permission =
  | 'vehicles.read'
  | 'vehicles.create'
  | 'vehicles.update'
  | 'vehicles.delete'
  | 'logs.read'
  | 'logs.create'
  | 'logs.update'
  | 'logs.delete'
  | 'reports.read'
  | 'audit.read.self'
  | 'audit.read.all'
  | 'admin.users.manage'
  | 'admin.analytics.read'

const USER_PERMISSIONS: Permission[] = [
  'vehicles.read',
  'vehicles.create',
  'vehicles.update',
  'logs.read',
  'logs.create',
  'logs.update',
  'reports.read',
  'audit.read.self',
]

export const permissionsForRole = (role: UserRole): string[] => {
  if (role === 'admin') return [PERMISSION_WILDCARD]
  return [...USER_PERMISSIONS]
}

export const hasPermission = (granted: readonly string[], required: string): boolean => {
  if (granted.includes(PERMISSION_WILDCARD)) return true
  return granted.includes(required)
}

export const roleHasPermission = (role: UserRole, required: string): boolean =>
  hasPermission(permissionsForRole(role), required)
