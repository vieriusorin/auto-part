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
import type { AuthModule } from '../../../auth/auth-module.js'
import {
  createAuthHttpGuards,
  type AuthHttpGuards,
} from '../../../auth/interfaces/http/auth-http-guards.js'
import { canReadWeeklySummaryTarget, resolveCoreResourceScope } from '../../application/core-access-scope.js'

const CORE_TAG = 'Core'

export const createCoreRouter = (authModule?: AuthModule, guards?: AuthHttpGuards): Router => {
  const router = Router()
  const requireAuth = authModule
    ? (guards?.requireAuth ?? createAuthHttpGuards(authModule).requireAuth)
    : null

  registerRoute(router, '/api', {
    method: 'get',
    path: '/users/:id/weekly-summary',
    tags: [CORE_TAG],
    summary: 'Get weekly summary for user',
    operationId: 'getWeeklySummary',
    params: UserIdParamsSchema,
    middlewares: requireAuth ? [requireAuth] : [],
    responses: {
      200: {
        description: 'Weekly summary payload',
        dataSchema: WeeklySummaryResponseDataSchema,
      },
    },
    handler: ({ req, res, params }) => {
      if (!req.user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const targetUserId = params?.id
      if (!targetUserId) {
        commonPresenter.error(res, 400, 'validation_error', 'Invalid request params')
        return
      }
      const scope = resolveCoreResourceScope(req.user)
      if (!canReadWeeklySummaryTarget(scope, targetUserId)) {
        commonPresenter.error(res, 403, 'forbidden', 'Insufficient permission for target user')
        return
      }
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
