import { type GarageRole, hasPermission } from '@autocare/auth'
import type { RequestHandler } from 'express'
import { commonPresenter } from '../../../presenters/common.presenter.js'

type AuthedRequest = {
  userRole?: GarageRole
}

export const requirePermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
    const role = (req as typeof req & AuthedRequest).userRole ?? 'member'
    if (!hasPermission(role, permission)) {
      commonPresenter.error(res, 403, 'forbidden', 'Forbidden')
      return
    }
    next()
  }
}
