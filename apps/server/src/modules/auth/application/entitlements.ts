import type { PlanTier } from '@autocare/shared'

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  premium: 1,
}

export const hasMinimumPlan = (effectivePlan: PlanTier, minimumPlan: PlanTier): boolean =>
  PLAN_RANK[effectivePlan] >= PLAN_RANK[minimumPlan]

export const isAllowedPlan = (effectivePlan: PlanTier, allowedPlans: readonly PlanTier[]): boolean =>
  allowedPlans.includes(effectivePlan)
