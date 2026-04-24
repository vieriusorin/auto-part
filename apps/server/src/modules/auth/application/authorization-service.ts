import {
  AuthorizationActions,
  type AuthorizationAction,
  type AuthorizationDecision,
  type AuthorizationInput,
  type Permission,
  type AuthorizationSubjectAttributes,
  type PlanTier,
  type UserRole,
} from '@autocare/shared'

const PERMISSION_WILDCARD = '*'

const USER_ACTIONS: AuthorizationAction[] = [
  AuthorizationActions.vehiclesRead,
  AuthorizationActions.vehiclesCreate,
  AuthorizationActions.vehiclesUpdate,
  AuthorizationActions.logsRead,
  AuthorizationActions.logsCreate,
  AuthorizationActions.logsUpdate,
  AuthorizationActions.reportsRead,
  AuthorizationActions.auditReadSelf,
]

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  premium: 1,
}

export type AuthorizationService = {
  permissionsForRole: (role: UserRole) => Permission[]
  hasPermission: (granted: readonly Permission[], required: AuthorizationAction) => boolean
  authorize: (input: AuthorizationInput) => AuthorizationDecision
  authorizePlan: (input: {
    planTier: PlanTier
    minimumPlan?: PlanTier
    allowedPlans?: readonly PlanTier[]
  }) => AuthorizationDecision
  canManageOrganizationInvites: (
    subject: Pick<AuthorizationSubjectAttributes, 'userRole' | 'organizationId' | 'organizationRole'>,
    organizationId: string,
  ) => boolean
  authorizeTrustWrite: (input: { actorRole: 'member' | 'admin' | 'service'; isLocked: boolean }) => AuthorizationDecision
}

export const createAuthorizationService = (): AuthorizationService => {
  const permissionsForRole = (role: UserRole): Permission[] => {
    if (role === 'admin') return [PERMISSION_WILDCARD]
    return [...USER_ACTIONS]
  }

  const hasPermission = (granted: readonly Permission[], required: AuthorizationAction): boolean => {
    if (granted.includes(PERMISSION_WILDCARD)) return true
    return granted.includes(required)
  }

  const authorizePlan: AuthorizationService['authorizePlan'] = ({ planTier, minimumPlan, allowedPlans }) => {
    const allow = minimumPlan
      ? PLAN_RANK[planTier] >= PLAN_RANK[minimumPlan]
      : allowedPlans?.includes(planTier) ?? false
    return {
      allow,
      reasonCode: allow ? 'NONE' : 'FORBIDDEN_PLAN',
    }
  }

  const canManageOrganizationInvites: AuthorizationService['canManageOrganizationInvites'] = (
    subject,
    organizationId,
  ) => {
    if (subject.userRole === 'admin') return true
    if (subject.organizationId !== organizationId) return false
    return subject.organizationRole === 'owner' || subject.organizationRole === 'admin'
  }

  const authorizeTrustWrite: AuthorizationService['authorizeTrustWrite'] = ({ actorRole, isLocked }) => {
    if (isLocked && actorRole !== 'admin' && actorRole !== 'service') {
      return { allow: false, reasonCode: 'LOCK_OVERRIDE_REQUIRED' }
    }
    return { allow: true, reasonCode: 'NONE' }
  }

  const authorize: AuthorizationService['authorize'] = (input) => {
    if (!input.subject.isAuthenticated) {
      return { allow: false, reasonCode: 'FORBIDDEN_PERMISSION' }
    }
    const granted = permissionsForRole(input.subject.userRole)
    const permissionAllowed = hasPermission(granted, input.action)
    if (!permissionAllowed) {
      return { allow: false, reasonCode: 'FORBIDDEN_PERMISSION' }
    }
    if (input.context?.minimumPlan || input.context?.allowedPlans) {
      return authorizePlan({
        planTier: input.context.planTier ?? 'free',
        minimumPlan: input.context.minimumPlan,
        allowedPlans: input.context.allowedPlans,
      })
    }
    if (input.context?.lockState) {
      return authorizeTrustWrite(input.context.lockState)
    }
    return { allow: true, reasonCode: 'NONE' }
  }

  return {
    permissionsForRole,
    hasPermission,
    authorize,
    authorizePlan,
    canManageOrganizationInvites,
    authorizeTrustWrite,
  }
}

