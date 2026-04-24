import { createUserAccessScopeFromAuthUser } from '../../auth/application/access-scope.js'

type AuthUserLike = {
  id: string
  role: 'user' | 'admin'
  organizationId: string | null
}

type CoreResourceScope = {
  actorId: string
  isElevated: boolean
}

export const resolveCoreResourceScope = (user: AuthUserLike): CoreResourceScope => {
  const scope = createUserAccessScopeFromAuthUser(user)
  return {
    actorId: scope.actorId,
    isElevated: scope.isElevated,
  }
}

export const canReadWeeklySummaryTarget = (
  scope: CoreResourceScope,
  targetUserId: string,
): boolean => scope.isElevated || scope.actorId === targetUserId

