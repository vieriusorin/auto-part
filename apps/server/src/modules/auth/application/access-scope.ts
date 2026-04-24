import type { UserRecord } from '../domain/types.js'

export type UserAccessScope = {
  actorId: string
  organizationId: string | null
  organizationRole: UserRecord['organizationRole']
  isElevated: boolean
}

export const createUserAccessScope = (user: Pick<UserRecord, 'id' | 'organizationId' | 'role' | 'organizationRole'>): UserAccessScope => {
  const isElevated =
    user.role === 'admin' || user.organizationRole === 'owner' || user.organizationRole === 'admin'
  return {
    actorId: user.id,
    organizationId: user.organizationId,
    organizationRole: user.organizationRole,
    isElevated,
  }
}

export const createUserAccessScopeFromAuthUser = (user: {
  id: string
  organizationId: string | null
  role: UserRecord['role']
}): UserAccessScope =>
  createUserAccessScope({
    ...user,
    organizationRole: 'viewer',
  })

export const documentPolicyConditions = (scope: UserAccessScope): Array<Record<string, unknown>> => {
  if (scope.isElevated) {
    return [{}]
  }
  return [{ creatorId: scope.actorId }]
}

export const canAccessDocumentResource = (
  scope: UserAccessScope,
  resource: { creatorId: string },
): boolean => scope.isElevated || resource.creatorId === scope.actorId

export const resolveTrustActorRole = (scope: UserAccessScope): 'member' | 'admin' | 'service' =>
  scope.isElevated ? 'admin' : 'member'

