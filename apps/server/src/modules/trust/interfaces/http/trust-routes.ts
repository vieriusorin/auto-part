import { Router } from 'express'
import {
  createConsentController,
  deleteConsentDataController,
  exportConsentDataController,
  revokeConsentController,
} from '../../consent-controller.js'

export const createTrustRouter = (): Router => {
  const router = Router()

  router.post('/v1/consent', createConsentController)
  router.post('/v1/consent/revoke', revokeConsentController)
  router.post('/v1/consent/export', exportConsentDataController)
  router.post('/v1/consent/delete', deleteConsentDataController)

  return router
}
