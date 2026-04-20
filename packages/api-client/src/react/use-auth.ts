import { useCallback, useMemo } from 'react'
import type { ApiError } from '../client.js'
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../permissions.js'
import { useLogin, useLogout, useMe, useRegister } from './auth-hooks.js'

export type UseAuthResult = {
  user: ReturnType<typeof useMe>['data'] | undefined
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  error: ApiError | null
  login: ReturnType<typeof useLogin>
  register: ReturnType<typeof useRegister>
  logout: ReturnType<typeof useLogout>
  refetch: ReturnType<typeof useMe>['refetch']
  can: (permission: string) => boolean
  canAny: (permissions: readonly string[]) => boolean
  canAll: (permissions: readonly string[]) => boolean
}

export const useAuth = (options?: { enabled?: boolean }): UseAuthResult => {
  const meQuery = useMe({ enabled: options?.enabled ?? true })
  const login = useLogin()
  const register = useRegister()
  const logout = useLogout()

  const user = meQuery.data
  const permissions = useMemo(() => user?.permissions ?? [], [user])
  const isAuthenticated = Boolean(user)

  const can = useCallback(
    (permission: string) => hasPermission(permissions, permission),
    [permissions],
  )
  const canAny = useCallback(
    (perms: readonly string[]) => hasAnyPermission(permissions, perms),
    [permissions],
  )
  const canAll = useCallback(
    (perms: readonly string[]) => hasAllPermissions(permissions, perms),
    [permissions],
  )

  return {
    user,
    permissions,
    isAuthenticated,
    isLoading: meQuery.isPending,
    error: (meQuery.error as ApiError | null) ?? null,
    login,
    register,
    logout,
    refetch: meQuery.refetch,
    can,
    canAny,
    canAll,
  }
}

export const usePermissions = () => {
  const { permissions, can, canAny, canAll } = useAuth()
  return { permissions, can, canAny, canAll }
}
