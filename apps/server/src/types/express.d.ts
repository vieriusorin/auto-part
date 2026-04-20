import type { ClientKind, PlanTier, UserRole } from '@autocare/shared'

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
      permissions: string[]
      tokenId: string
    }

    interface Request {
      user?: AuthenticatedUser
      clientKind?: ClientKind
    }
  }
}
