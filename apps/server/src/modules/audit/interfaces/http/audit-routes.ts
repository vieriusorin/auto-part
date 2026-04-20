import { Router } from 'express'
import { ListAuditLogsResponseDataSchema } from '@autocare/shared'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { createRequirePermissionMiddleware } from '../../../auth/interfaces/http/require-permission.middleware.js'
import { listAuditLogs } from '../../../../services/auditLog.js'

const AUDIT_TAG = 'Audit'

export const createAuditRouter = (): Router => {
  const router = Router()
  const requireAuditReadAll = createRequirePermissionMiddleware('audit.read.all')

  registerRoute(router, '/api', {
    method: 'get',
    path: '/audit-logs',
    tags: [AUDIT_TAG],
    summary: 'List audit logs',
    operationId: 'listAuditLogs',
    middlewares: [requireAuditReadAll],
    responses: {
      200: {
        description: 'Audit entries',
        dataSchema: ListAuditLogsResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, { items: listAuditLogs() })
    },
  })

  return router
}
