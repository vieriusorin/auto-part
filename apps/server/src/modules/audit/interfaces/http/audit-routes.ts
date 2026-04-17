import { Router } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { listAuditLogs } from '../../../../services/auditLog.js'

export const createAuditRouter = (): Router => {
  const router = Router()

  router.get('/audit-logs', (_req, res) => {
    commonPresenter.ok(res, { items: listAuditLogs() })
  })

  return router
}
