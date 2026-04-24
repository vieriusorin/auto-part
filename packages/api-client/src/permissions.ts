import type { AuthorizationAction, Permission } from '@autocare/shared'

export const PERMISSION_WILDCARD = '*'

export const hasPermission = (
  granted: readonly (Permission | string)[] | undefined | null,
  required: AuthorizationAction | string,
): boolean => {
  if (!granted || granted.length === 0) return false
  if (granted.includes(PERMISSION_WILDCARD)) return true
  return granted.includes(required)
}

export const hasAnyPermission = (
  granted: readonly (Permission | string)[] | undefined | null,
  required: readonly (AuthorizationAction | string)[],
): boolean => required.some((perm) => hasPermission(granted, perm))

export const hasAllPermissions = (
  granted: readonly (Permission | string)[] | undefined | null,
  required: readonly (AuthorizationAction | string)[],
): boolean => required.every((perm) => hasPermission(granted, perm))
