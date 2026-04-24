import type { AuthorizationAction } from '@autocare/shared'
import type { RequestHandler } from 'express'
import { createAuthorizationService } from '../../application/authorization-service.js'
import { commonPresenter } from '../../../../presenters/common.presenter.js'

const authorization = createAuthorizationService()

export const createRequirePermissionMiddleware =
  (permission: AuthorizationAction): RequestHandler =>
  (req, res, next) => {
    const user = req.user
    if (!user) {
      commonPresenter.error(res, 401, 'unauthorized', 'Authentication required')
      return
    }
    const decision = authorization.authorize({
      action: permission,
      resourceType: 'system',
      subject: {
        userRole: user.role,
        userId: user.id,
        organizationId: user.organizationId,
        isAuthenticated: true,
      },
    })
    if (!decision.allow) {
      commonPresenter.error(res, 403, 'forbidden_permission', 'Insufficient permissions')
      return
    }
    next()
  }
