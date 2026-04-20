export const PERMISSION_WILDCARD = '*'

export const hasPermission = (
  granted: readonly string[] | undefined | null,
  required: string,
): boolean => {
  if (!granted || granted.length === 0) return false
  if (granted.includes(PERMISSION_WILDCARD)) return true
  return granted.includes(required)
}

export const hasAnyPermission = (
  granted: readonly string[] | undefined | null,
  required: readonly string[],
): boolean => required.some((perm) => hasPermission(granted, perm))

export const hasAllPermissions = (
  granted: readonly string[] | undefined | null,
  required: readonly string[],
): boolean => required.every((perm) => hasPermission(granted, perm))
