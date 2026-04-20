import { Router } from 'express'
import {
  SyncBodySchema,
  SyncResponseDataSchema,
  UserIdParamsSchema,
  WeeklySummaryResponseDataSchema,
} from '@autocare/shared'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { buildWeeklySummary } from '../../../../services/weeklySummary.js'

const CORE_TAG = 'Core'

export const createCoreRouter = (): Router => {
  const router = Router()

  registerRoute(router, '/api', {
    method: 'get',
    path: '/users/:id/weekly-summary',
    tags: [CORE_TAG],
    summary: 'Get weekly summary for user',
    operationId: 'getWeeklySummary',
    params: UserIdParamsSchema,
    responses: {
      200: {
        description: 'Weekly summary payload',
        dataSchema: WeeklySummaryResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, buildWeeklySummary())
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/sync',
    tags: [CORE_TAG],
    summary: 'Sync client actions',
    operationId: 'syncClientActions',
    body: SyncBodySchema,
    responses: {
      200: {
        description: 'Sync result',
        dataSchema: SyncResponseDataSchema,
      },
    },
    handler: ({ body, res }) => {
      commonPresenter.ok(res, { synced: body.actions.length })
    },
  })

  return router
}
