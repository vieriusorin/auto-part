import { createUserAccessScopeFromAuthUser } from '../../auth/application/access-scope.js'

type AuthUserLike = {
  id: string
  role: 'user' | 'admin'
  organizationId: string | null
}

export type TrustResourceScope = {
  actorId: string
  isElevated: boolean
}

export const resolveTrustResourceScope = (user: AuthUserLike): TrustResourceScope => {
  const scope = createUserAccessScopeFromAuthUser(user)
  return {
    actorId: scope.actorId,
    isElevated: scope.isElevated,
  }
}

export const canAccessTrustUserTarget = (
  scope: TrustResourceScope,
  targetUserId: string,
): boolean => scope.isElevated || scope.actorId === targetUserId

