import { Container } from 'inversify'
import { GetHealthUseCase } from '../../application/system/get-health-use-case.js'
import type { ApiRouteModule } from '../../interfaces/http/route-module.types.js'
import { createAiRouter } from '../../modules/ai/interfaces/http/ai-routes.js'
import { createAnalyticsRouter } from '../../modules/analytics/interfaces/http/analytics-routes.js'
import { createAffiliateRouter } from '../../modules/affiliate/interfaces/http/affiliate-routes.js'
import { createAuditRouter } from '../../modules/audit/interfaces/http/audit-routes.js'
import { createBannerRouter } from '../../modules/banners/interfaces/http/banner-routes.js'
import type { AuthModule } from '../../modules/auth/auth-module.js'
import {
  createAuthHttpGuards,
  type AuthHttpGuards,
} from '../../modules/auth/interfaces/http/auth-http-guards.js'
import { createCoreRouter } from '../../modules/core/interfaces/http/core-routes.js'
import { createDocumentRouter } from '../../modules/documents/interfaces/http/document-routes.js'
import { createReportRouter } from '../../modules/reports/interfaces/http/report-routes.js'
import { createTrustRouter } from '../../modules/trust/interfaces/http/trust-routes.js'
import { createUtilityRouter } from '../../modules/utility/interfaces/http/utility-routes.js'
import { createVehicleRouter } from '../../modules/vehicles/interfaces/http/vehicle-routes.js'
import { diTokens } from './tokens.js'

export const createAppContainer = (authModule: AuthModule): Container => {
  const container = new Container({ defaultScope: 'Singleton' })

  container
    .bind<GetHealthUseCase>(diTokens.getHealthUseCase)
    .toDynamicValue(() => new GetHealthUseCase())

  const authHttpGuards = createAuthHttpGuards(authModule)
  container.bind<AuthHttpGuards>(diTokens.authHttpGuards).toConstantValue(authHttpGuards)

  const apiRouteModules: ApiRouteModule[] = [
    { name: 'core', router: createCoreRouter(authModule, authHttpGuards) },
    { name: 'documents', router: createDocumentRouter(authModule, authHttpGuards) },
    { name: 'analytics', router: createAnalyticsRouter() },
    { name: 'affiliate', router: createAffiliateRouter(authModule, authHttpGuards) },
    { name: 'trust', router: createTrustRouter(authModule, authHttpGuards) },
    { name: 'vehicles', router: createVehicleRouter(authModule, authHttpGuards) },
    { name: 'ai', router: createAiRouter() },
    { name: 'reports', router: createReportRouter(authModule) },
    { name: 'audit', router: createAuditRouter() },
    { name: 'banners', router: createBannerRouter(authModule, authHttpGuards) },
    { name: 'utility', router: createUtilityRouter() },
  ]

  for (const routeModule of apiRouteModules) {
    container.bind<ApiRouteModule>(diTokens.apiRouteModules).toConstantValue(routeModule)
  }

  return container
}
