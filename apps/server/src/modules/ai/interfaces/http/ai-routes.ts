import { Router } from 'express'
import {
  FairPriceBodySchema,
  FairPriceResponseDataSchema,
  ParseServiceReportResponseDataSchema,
  ScanReceiptResponseDataSchema,
} from '@autocare/shared'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { createRequirePlanMiddleware } from '../../../auth/interfaces/http/require-plan.middleware.js'
import { compareMaintenancePrice } from '../../../../services/priceComparison.js'

const AI_TAG = 'AI'

export const createAiRouter = (): Router => {
  const router = Router()
  const requirePremium = createRequirePlanMiddleware({ minimumPlan: 'premium' })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/ai/parse-service-report',
    tags: [AI_TAG],
    summary: 'Parse service report',
    operationId: 'parseServiceReport',
    middlewares: [requirePremium],
    responses: {
      200: {
        description: 'Parsed report result',
        dataSchema: ParseServiceReportResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, { items: [], model: 'gpt-4o-mini' })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/ai/scan-receipt',
    tags: [AI_TAG],
    summary: 'Scan receipt',
    operationId: 'scanReceipt',
    middlewares: [requirePremium],
    responses: {
      200: {
        description: 'Receipt parsing result',
        dataSchema: ScanReceiptResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, { items: [], model: 'gpt-4o-mini' })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/ai/fair-price',
    tags: [AI_TAG],
    summary: 'Estimate fair maintenance price',
    operationId: 'estimateFairPrice',
    body: FairPriceBodySchema,
    middlewares: [requirePremium],
    responses: {
      200: {
        description: 'Price comparison response',
        dataSchema: FairPriceResponseDataSchema,
      },
    },
    handler: ({ body, res }) => {
      commonPresenter.ok(res, compareMaintenancePrice(body.userPaid))
    },
  })

  return router
}
