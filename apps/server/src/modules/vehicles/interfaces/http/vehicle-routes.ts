import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { body } from 'express-validator'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { requirePermission } from '../../../../interfaces/http/middlewares/permission.middleware.js'
import { handleValidationErrors } from '../../../../interfaces/http/middlewares/security.middleware.js'
import { enforceTrustPolicy } from '../../../trust/policy-middleware.js'
import { appendAuditLog } from '../../../../services/auditLog.js'
import { computeIntegrityHash } from '../../../../services/integrity.js'

export const createVehicleRouter = (): Router => {
  const router = Router()

  router.post('/vehicles/:id/lock', (_req, res) => {
    commonPresenter.ok(res, { locked: true })
  })

  router.post(
    '/vehicles/:id/maintenance',
    requirePermission('logs.create'),
    body().isObject().withMessage('Request body must be an object'),
    handleValidationErrors,
    (req, res) => {
      const payload = req.body ?? {}
      const integrityHash = computeIntegrityHash(payload)
      appendAuditLog({
        entityType: 'maintenance_log',
        entityId: randomUUID(),
        action: 'create',
        oldValues: null,
        newValues: { ...payload, integrityHash },
        userId: 'demo-user',
      })
      commonPresenter.created(res, { integrityHash })
    },
  )

  router.put(
    '/vehicles/:id/maintenance/:maintenanceId',
    requirePermission('logs.update'),
    enforceTrustPolicy,
    (req, res) => {
      const maintenanceId = Array.isArray(req.params.maintenanceId)
        ? req.params.maintenanceId[0]
        : req.params.maintenanceId
      appendAuditLog({
        entityType: 'maintenance_log',
        entityId: maintenanceId ?? randomUUID(),
        action: 'update',
        oldValues: { placeholder: true },
        newValues: req.body ?? {},
        userId: 'demo-user',
      })
      commonPresenter.ok(res, { ok: true })
    },
  )

  router.post('/upload', (_req, res) => {
    commonPresenter.created(res, { url: 'https://example.r2.dev/file.jpg' })
  })

  router.get('/vehicles/:id/fuel', (_req, res) => {
    commonPresenter.ok(res, { items: [] })
  })

  router.post('/vehicles/scan-document', (_req, res) => {
    commonPresenter.ok(res, {
      make: 'Skoda',
      model: 'Octavia',
      year: 2020,
      vin: 'WVWZZZ1JZXW000001',
    })
  })

  return router
}
