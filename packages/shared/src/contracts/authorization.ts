import type { AuthorizationAction, AuthorizationResourceType, PlanTier, UserRole } from './auth.js'

export const AuthorizationActions = {
  documentRead: 'document.read',
  documentCreate: 'document.create',
  documentUpdate: 'document.update',
  vehiclesRead: 'vehicles.read',
  vehiclesCreate: 'vehicles.create',
  vehiclesUpdate: 'vehicles.update',
  vehiclesDelete: 'vehicles.delete',
  logsRead: 'logs.read',
  logsCreate: 'logs.create',
  logsUpdate: 'logs.update',
  logsDelete: 'logs.delete',
  reportsRead: 'reports.read',
  auditReadSelf: 'audit.read.self',
  auditReadAll: 'audit.read.all',
  adminUsersManage: 'admin.users.manage',
  adminAnalyticsRead: 'admin.analytics.read',
} as const satisfies Record<string, AuthorizationAction>

export const AuthorizationResourceTypes = {
  document: 'document',
  system: 'system',
  vehicle: 'vehicle',
  maintenanceLog: 'maintenance_log',
  report: 'report',
  affiliate: 'affiliate',
  organization: 'organization',
  user: 'user',
} as const satisfies Record<string, AuthorizationResourceType>

export type AuthorizationDecisionReasonCode =
  | 'NONE'
  | 'FORBIDDEN_PERMISSION'
  | 'FORBIDDEN_PLAN'
  | 'ORGANIZATION_SCOPE_REQUIRED'
  | 'LOCK_OVERRIDE_REQUIRED'

export type AuthorizationSubjectAttributes = {
  userId?: string
  userRole: UserRole
  organizationId?: string | null
  organizationRole?: 'owner' | 'admin' | 'manager' | 'driver' | 'viewer'
  isAuthenticated: boolean
}

export type AuthorizationContextAttributes = {
  planTier?: PlanTier
  minimumPlan?: PlanTier
  allowedPlans?: readonly PlanTier[]
  lockState?: { isLocked: boolean; actorRole: 'member' | 'admin' | 'service' }
  now?: Date
}

export type AuthorizationInput = {
  action: AuthorizationAction
  resourceType: AuthorizationResourceType
  subject: AuthorizationSubjectAttributes
  context?: AuthorizationContextAttributes
}

export type AuthorizationDecision = {
  allow: boolean
  reasonCode: AuthorizationDecisionReasonCode
}
