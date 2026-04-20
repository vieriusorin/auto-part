import type { RequestHandler } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { roleHasPermission } from '../../application/permissions.js'

export const createRequirePermissionMiddleware =
  (permission: string): RequestHandler =>
  (req, res, next) => {
    const user = req.user
    if (!user) {
      commonPresenter.error(res, 401, 'unauthorized', 'Authentication required')
      return
    }
    if (!roleHasPermission(user.role, permission)) {
      commonPresenter.error(res, 403, 'forbidden_permission', 'Insufficient permissions')
      return
    }
    next()
  }
