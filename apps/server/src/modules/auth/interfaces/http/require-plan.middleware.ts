import type { PlanTier } from '@autocare/shared'
import type { RequestHandler } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { hasMinimumPlan, isAllowedPlan } from '../../application/entitlements.js'

type RequirePlanInput =
  | { minimumPlan: PlanTier; allowedPlans?: never }
  | { minimumPlan?: never; allowedPlans: readonly PlanTier[] }

export const createRequirePlanMiddleware = (input: RequirePlanInput): RequestHandler => {
  return (req, res, next) => {
    const user = req.user
    if (!user) {
      commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
      return
    }

    const effectivePlan = user.effectivePlan
    const allowed = input.minimumPlan
      ? hasMinimumPlan(effectivePlan, input.minimumPlan)
      : isAllowedPlan(effectivePlan, input.allowedPlans)

    if (!allowed) {
      commonPresenter.error(res, 403, 'forbidden_plan', 'Current plan does not allow this endpoint')
      return
    }

    next()
  }
}
