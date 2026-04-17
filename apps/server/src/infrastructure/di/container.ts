import { Container } from 'inversify'
import { createAiRouter } from '../../modules/ai/interfaces/http/ai-routes.js'
import { createAnalyticsRouter } from '../../modules/analytics/interfaces/http/analytics-routes.js'
import { createAuditRouter } from '../../modules/audit/interfaces/http/audit-routes.js'
import { createCoreRouter } from '../../modules/core/interfaces/http/core-routes.js'
import { createReportRouter } from '../../modules/reports/interfaces/http/report-routes.js'
import { createTrustRouter } from '../../modules/trust/interfaces/http/trust-routes.js'
import { createUtilityRouter } from '../../modules/utility/interfaces/http/utility-routes.js'
import { createVehicleRouter } from '../../modules/vehicles/interfaces/http/vehicle-routes.js'
import type { ApiRouteModule } from '../../interfaces/http/route-module.types.js'
import { GetHealthUseCase } from '../../application/system/get-health-use-case.js'
import { diTokens } from './tokens.js'

export const createAppContainer = (): Container => {
  const container = new Container({ defaultScope: 'Singleton' })

  container
    .bind<GetHealthUseCase>(diTokens.getHealthUseCase)
    .toDynamicValue(() => new GetHealthUseCase())

  const apiRouteModules: ApiRouteModule[] = [
    { name: 'core', router: createCoreRouter() },
    { name: 'analytics', router: createAnalyticsRouter() },
    { name: 'trust', router: createTrustRouter() },
    { name: 'vehicles', router: createVehicleRouter() },
    { name: 'ai', router: createAiRouter() },
    { name: 'reports', router: createReportRouter() },
    { name: 'audit', router: createAuditRouter() },
    { name: 'utility', router: createUtilityRouter() },
  ]

  for (const routeModule of apiRouteModules) {
    container.bind<ApiRouteModule>(diTokens.apiRouteModules).toConstantValue(routeModule)
  }

  return container
}
