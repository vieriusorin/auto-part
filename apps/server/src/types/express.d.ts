import type { ClientKind, Permission, PlanTier, UserRole } from '@autocare/shared'

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string
      email: string
      role: UserRole
      organizationId: string | null
      organizationPlan: PlanTier
      planOverride: PlanTier | null
      effectivePlan: PlanTier
      permissions: Permission[]
      tokenId: string
    }

    interface Request {
      user?: AuthenticatedUser
      clientKind?: ClientKind
    }
  }
}
