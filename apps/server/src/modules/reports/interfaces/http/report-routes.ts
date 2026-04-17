import { createHash } from 'node:crypto'
import { Router } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'

export const createReportRouter = (): Router => {
  const router = Router()

  router.post('/reports/generate', (_req, res) => {
    commonPresenter.ok(res, {
      publicUrl: 'https://autocare.app/r/demo',
      reportHash: createHash('sha256').update('demo').digest('hex'),
    })
  })

  return router
}
