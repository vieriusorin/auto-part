import { Router } from 'express'
import {
  getAnalyticsDashboardController,
  ingestAnalyticsEventsController,
} from '../../controller.js'

export const createAnalyticsRouter = (): Router => {
  const router = Router()

  router.post('/v1/events/batch', ingestAnalyticsEventsController)
  router.get('/v1/analytics/dashboard', getAnalyticsDashboardController)

  return router
}
