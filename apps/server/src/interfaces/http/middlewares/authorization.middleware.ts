import type { NextFunction, Request, Response } from 'express'
import { commonPresenter } from '../../../presenters/common.presenter.js'

export const authorize = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const roleHeader = req.headers['x-role']
    const currentRole = typeof roleHeader === 'string' ? roleHeader : undefined

    if (currentRole === undefined || !requiredRoles.includes(currentRole)) {
      commonPresenter.error(res, 403, 'insufficient_permissions', 'Insufficient permissions.')
      return
    }

    next()
  }
}
