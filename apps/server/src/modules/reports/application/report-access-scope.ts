import { createUserAccessScopeFromAuthUser } from '../../auth/application/access-scope.js'

type AuthUserLike = {
  id: string
  role: 'user' | 'admin'
  organizationId: string | null
}

export type ReportResourceScope = {
  actorId: string
  organizationId: string | null
  isElevated: boolean
}

export const resolveReportResourceScope = (user: AuthUserLike): ReportResourceScope => {
  const scope = createUserAccessScopeFromAuthUser(user)
  return {
    actorId: scope.actorId,
    organizationId: scope.organizationId,
    isElevated: scope.isElevated,
  }
}

export const resolveOrganizationIdForReports = (user: AuthUserLike): string | null =>
  resolveReportResourceScope(user).organizationId

export const reportPolicyConditions = (
  scope: ReportResourceScope,
): Array<Record<string, unknown>> => {
  if (!scope.organizationId) {
    return []
  }
  return [{ organizationId: scope.organizationId }]
}

