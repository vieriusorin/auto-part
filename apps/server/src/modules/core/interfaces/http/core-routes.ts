import { Router } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { buildWeeklySummary } from '../../../../services/weeklySummary.js'

export const createCoreRouter = (): Router => {
  const router = Router()

  router.get('/users/:id/weekly-summary', (_req, res) => {
    commonPresenter.ok(res, buildWeeklySummary())
  })

  router.post('/sync', (req, res) => {
    const actions = Array.isArray(req.body?.actions) ? req.body.actions : []
    commonPresenter.ok(res, { synced: actions.length })
  })

  return router
}
