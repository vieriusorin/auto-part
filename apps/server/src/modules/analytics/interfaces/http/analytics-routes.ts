import { Router } from 'express'
import {
  AnalyticsDashboardQuerySchema,
  AnalyticsDashboardResponseDataSchema,
  IngestEventsBodySchema,
  IngestEventsResponseDataSchema,
} from '@autocare/shared'
import {
  getAnalyticsDashboardController,
  ingestAnalyticsEventsController,
} from '../../controller.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { createRequirePermissionMiddleware } from '../../../auth/interfaces/http/require-permission.middleware.js'
import { createRequirePlanMiddleware } from '../../../auth/interfaces/http/require-plan.middleware.js'

const ANALYTICS_TAG = 'Analytics'

export const createAnalyticsRouter = (): Router => {
  const router = Router()
  const requireAnalyticsRead = createRequirePermissionMiddleware('admin.analytics.read')
  const requirePremium = createRequirePlanMiddleware({ minimumPlan: 'premium' })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/v1/events/batch',
    tags: [ANALYTICS_TAG],
    summary: 'Ingest analytics events',
    operationId: 'ingestAnalyticsEvents',
    body: IngestEventsBodySchema,
    responses: {
      200: {
        description: 'Batch accepted',
        dataSchema: IngestEventsResponseDataSchema,
      },
    },
    handler: async ({ req, res }) => {
      await ingestAnalyticsEventsController(req, res)
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/v1/analytics/dashboard',
    tags: [ANALYTICS_TAG],
    summary: 'Get analytics dashboard',
    operationId: 'getAnalyticsDashboard',
    middlewares: [requireAnalyticsRead, requirePremium],
    query: AnalyticsDashboardQuerySchema,
    responses: {
      200: {
        description: 'Dashboard payload',
        dataSchema: AnalyticsDashboardResponseDataSchema,
      },
    },
    handler: async ({ req, res }) => {
      await getAnalyticsDashboardController(req, res)
    },
  })

  return router
}
