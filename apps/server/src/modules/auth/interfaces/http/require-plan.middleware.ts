import type { PlanTier } from '@autocare/shared'
import type { RequestHandler } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { createAuthorizationService } from '../../application/authorization-service.js'

type RequirePlanInput =
  | { minimumPlan: PlanTier; allowedPlans?: never }
  | { minimumPlan?: never; allowedPlans: readonly PlanTier[] }

export const createRequirePlanMiddleware = (input: RequirePlanInput): RequestHandler => {
  const authorization = createAuthorizationService()
  return (req, res, next) => {
    const user = req.user
    if (!user) {
      commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
      return
    }

    const decision = authorization.authorizePlan({
      planTier: user.effectivePlan,
      minimumPlan: input.minimumPlan,
      allowedPlans: input.allowedPlans,
    })
    if (!decision.allow) {
      commonPresenter.error(res, 403, 'forbidden_plan', 'Current plan does not allow this endpoint')
      return
    }

    next()
  }
}
