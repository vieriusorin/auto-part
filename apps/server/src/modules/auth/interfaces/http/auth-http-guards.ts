import type { PlanTier } from '@autocare/shared'
import type { RequestHandler } from 'express'
import type { AuthModule } from '../../auth-module.js'
import { createRequireAuthMiddleware } from './require-auth.middleware.js'
import { createRequirePermissionMiddleware } from './require-permission.middleware.js'
import { createRequirePlanMiddleware } from './require-plan.middleware.js'

type RequirePlanInput =
  | { minimumPlan: PlanTier; allowedPlans?: never }
  | { minimumPlan?: never; allowedPlans: readonly PlanTier[] }

export type AuthHttpGuards = {
  requireAuth: RequestHandler
  requirePermission: (permission: string) => RequestHandler
  requirePlan: (input: RequirePlanInput) => RequestHandler
}

export const createAuthHttpGuards = (authModule: AuthModule): AuthHttpGuards => {
  const requireAuth = createRequireAuthMiddleware({
    jwtSigner: authModule.jwtSigner,
    cookieConfig: authModule.cookieConfig,
    users: authModule.users,
  })

  return {
    requireAuth,
    requirePermission: (permission) => {
      const permissionCheck = createRequirePermissionMiddleware(permission)
      return (req, res, next) => {
        requireAuth(req, res, (authErr) => {
          if (authErr) return next(authErr)
          if (res.headersSent) return
          permissionCheck(req, res, next)
        })
      }
    },
    requirePlan: (input) => {
      const planCheck = createRequirePlanMiddleware(input)
      return (req, res, next) => {
        requireAuth(req, res, (authErr) => {
          if (authErr) return next(authErr)
          if (res.headersSent) return
          planCheck(req, res, next)
        })
      }
    },
  }
}
