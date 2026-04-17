import { type GarageRole, hasPermission } from '@autocare/auth'
import type { RequestHandler } from 'express'

type AuthedRequest = {
  userRole?: GarageRole
}

export const requirePermission = (permission: string): RequestHandler => {
  return (req, res, next) => {
    const role = (req as typeof req & AuthedRequest).userRole ?? 'member'
    if (!hasPermission(role, permission)) {
      res.status(403).json({ message: 'Forbidden' })
      return
    }
    next()
  }
}
