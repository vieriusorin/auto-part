import { Router } from 'express'
import { AuthorizationActions, ListAuditLogsResponseDataSchema } from '@autocare/shared'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { createRequirePermissionMiddleware } from '../../../auth/interfaces/http/require-permission.middleware.js'
import { filterAuditLogsByScope, resolveAuditResourceScope } from '../../application/audit-access-scope.js'
import { listAuditLogs } from '../../../../services/auditLog.js'

const AUDIT_TAG = 'Audit'

export const createAuditRouter = (): Router => {
  const router = Router()
  const requireAuditReadAll = createRequirePermissionMiddleware(AuthorizationActions.auditReadAll)

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
    handler: ({ req, res }) => {
      const scope = resolveAuditResourceScope(req.user)
      commonPresenter.ok(res, { items: filterAuditLogsByScope(listAuditLogs(), scope) })
    },
  })

  return router
}
