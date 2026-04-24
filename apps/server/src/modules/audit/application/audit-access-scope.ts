import { createUserAccessScopeFromAuthUser } from '../../auth/application/access-scope.js'
import type { listAuditLogs } from '../../../services/auditLog.js'

type AuthUserLike = {
  id: string
  role: 'user' | 'admin'
  organizationId: string | null
}

export type AuditResourceScope = {
  actorId: string | null
  organizationId: string | null
  isElevated: boolean
}

type AuditLogEntry = ReturnType<typeof listAuditLogs>[number]

export const resolveAuditResourceScope = (user?: AuthUserLike | null): AuditResourceScope => {
  if (!user) {
    return {
      actorId: null,
      organizationId: null,
      isElevated: false,
    }
  }
  const scope = createUserAccessScopeFromAuthUser(user)
  return {
    actorId: scope.actorId,
    organizationId: scope.organizationId,
    isElevated: scope.isElevated,
  }
}

export const filterAuditLogsByScope = (
  logs: AuditLogEntry[],
  scope: AuditResourceScope,
): AuditLogEntry[] => {
  if (scope.isElevated || !scope.actorId) {
    return logs
  }
  // We currently only have actor-level metadata on audit entries.
  return logs.filter((entry) => entry.userId === scope.actorId)
}

