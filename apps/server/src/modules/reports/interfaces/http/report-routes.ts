import { createHash } from 'node:crypto'
import { Router } from 'express'
import {
  GenerateReportResponseDataSchema,
  SpendKpisQuerySchema,
  SpendKpisResponseDataSchema,
} from '@autocare/shared'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import type { AuthModule } from '../../../auth/auth-module.js'
import { createRequirePermissionMiddleware } from '../../../auth/interfaces/http/require-permission.middleware.js'
import { createRequirePlanMiddleware } from '../../../auth/interfaces/http/require-plan.middleware.js'
import { computePreviousWindow, buildSpendKpis } from '../../application/spend-kpis.js'
import { createVehicleRepository } from '../../../vehicles/infrastructure/vehicle-repository.js'

const REPORTS_TAG = 'Reports'

export const createReportRouter = (authModule?: AuthModule): Router => {
  const router = Router()
  const requireReportsRead = createRequirePermissionMiddleware('reports.read')
  const requirePremium = createRequirePlanMiddleware({ minimumPlan: 'premium' })
  const vehicleRepo = authModule ? createVehicleRepository(authModule.db) : null

  registerRoute(router, '/api', {
    method: 'post',
    path: '/reports/generate',
    tags: [REPORTS_TAG],
    summary: 'Generate report',
    operationId: 'generateReport',
    middlewares: [requireReportsRead, requirePremium],
    responses: {
      200: {
        description: 'Report link and hash',
        dataSchema: GenerateReportResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, {
        publicUrl: 'https://autocare.app/r/demo',
        reportHash: createHash('sha256').update('demo').digest('hex'),
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/v1/kpis/spend',
    tags: [REPORTS_TAG],
    summary: 'Get spend KPIs',
    operationId: 'getSpendKpis',
    query: SpendKpisQuerySchema,
    middlewares: [requireReportsRead, requirePremium],
    responses: {
      200: {
        description: 'Spend KPI payload',
        dataSchema: SpendKpisResponseDataSchema,
      },
    },
    handler: async ({ req, res, query }) => {
      const orgId = req.user?.organizationId
      if (!orgId || !vehicleRepo) {
        commonPresenter.ok(res, {
          range: {
            from: query!.from,
            to: query!.to,
            granularity: query!.granularity,
          },
          totals: {
            totalSpend: 0,
            maintenanceSpend: 0,
            fuelSpend: 0,
          },
          byPeriod: [],
          byCategory: [],
          byVehicle: [],
          advanced: {
            trendDeltaPercent: 0,
            forecastNextPeriodSpend: 0,
            anomalies: [],
          },
        })
        return
      }

      const from = new Date(query!.from)
      const to = new Date(query!.to)
      const previousWindow = computePreviousWindow(query!)

      const [currentRows, previousRows] = await Promise.all([
        vehicleRepo.listMaintenanceForOrganizationInRange({
          organizationId: orgId,
          from,
          to,
          vehicleIds: query!.vehicleIds,
          categories: query!.categories,
        }),
        vehicleRepo.listMaintenanceForOrganizationInRange({
          organizationId: orgId,
          from: previousWindow.from,
          to: previousWindow.to,
          vehicleIds: query!.vehicleIds,
          categories: query!.categories,
        }),
      ])

      commonPresenter.ok(
        res,
        buildSpendKpis({
          query: query!,
          currentRows,
          previousRows,
        }),
      )
    },
  })

  return router
}
