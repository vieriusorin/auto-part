import { beforeAll, describe, expect, it } from 'vitest'
import { createAiRouter } from '../../../../modules/ai/interfaces/http/ai-routes.js'
import { createAnalyticsRouter } from '../../../../modules/analytics/interfaces/http/analytics-routes.js'
import { createAuditRouter } from '../../../../modules/audit/interfaces/http/audit-routes.js'
import type { AuthModule } from '../../../../modules/auth/auth-module.js'
import { createCoreRouter } from '../../../../modules/core/interfaces/http/core-routes.js'
import { createReportRouter } from '../../../../modules/reports/interfaces/http/report-routes.js'
import { createTrustRouter } from '../../../../modules/trust/interfaces/http/trust-routes.js'
import { createUtilityRouter } from '../../../../modules/utility/interfaces/http/utility-routes.js'
import { createVehicleRouter } from '../../../../modules/vehicles/interfaces/http/vehicle-routes.js'
import { createAuthRouter } from '../../../../modules/auth/interfaces/http/auth-routes.js'
import { buildOpenApiDocument } from '../build-document.js'
import { apiRegistry } from '../registry.js'

type RegisteredPath = {
  route: { method: string; path: string; operationId?: string; tags?: string[] }
}

const getRegisteredPaths = (): RegisteredPath[] =>
  apiRegistry.definitions.filter((def) => def.type === 'route') as RegisteredPath[]

describe('OpenAPI registry contract', () => {
  beforeAll(() => {
    const stubAuthModule = {
      jwtSigner: { verify: async () => ({}) as never, sign: async () => ({}) as never },
      cookieConfig: {
        accessCookieName: 'autocare.access',
        refreshCookieName: 'autocare.refresh',
      },
      csrfConfig: { cookieName: 'autocare.csrf', headerName: 'x-csrf-token' },
      db: {} as import('drizzle-orm/node-postgres').NodePgDatabase,
      useCases: {} as never,
      users: {} as never,
    } as unknown as AuthModule

    createCoreRouter()
    createAnalyticsRouter()
    createTrustRouter()
    createVehicleRouter(stubAuthModule)
    createAiRouter()
    createReportRouter(stubAuthModule)
    createAuditRouter()
    createUtilityRouter()
    createAuthRouter(stubAuthModule)
  })

  it('registers every expected operationId', () => {
    const operationIds = new Set(
      getRegisteredPaths()
        .map((def) => def.route.operationId)
        .filter((value): value is string => typeof value === 'string'),
    )

    const expected = [
      'getWeeklySummary',
      'syncClientActions',
      'ingestAnalyticsEvents',
      'getAnalyticsDashboard',
      'createConsent',
      'revokeConsent',
      'exportConsentData',
      'deleteConsentData',
      'listVehicles',
      'createVehicle',
      'getVehicle',
      'updateVehicle',
      'listMaintenanceLogs',
      'lockVehicle',
      'createMaintenanceLog',
      'updateMaintenanceLog',
      'createUpload',
      'listFuelEntries',
      'scanVehicleDocument',
      'parseServiceReport',
      'scanReceipt',
      'estimateFairPrice',
      'generateReport',
      'getSpendKpis',
      'listAuditLogs',
      'getWashSuggestion',
      'checkLezRule',
      'listTireRecommendations',
      'authRegister',
      'authLogin',
      'authRefresh',
      'authLogout',
      'authLogoutAll',
      'authMe',
      'authChangePassword',
    ] as const

    for (const opId of expected) {
      expect(operationIds, `missing operationId ${opId}`).toContain(opId)
    }
  })

  it('mounts every path under /api or /auth', () => {
    const paths = getRegisteredPaths().map((def) => def.route.path)
    expect(paths.length).toBeGreaterThan(0)
    for (const path of paths) {
      expect(path.startsWith('/api/') || path.startsWith('/auth/')).toBe(true)
    }
  })

  it('produces a valid OpenAPI 3.1 document', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    expect(document.openapi).toBe('3.1.0')
    expect(document.paths).toBeTruthy()
    expect(Object.keys(document.paths ?? {}).length).toBeGreaterThan(0)
  })
})
