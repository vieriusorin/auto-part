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
      'getSubscriptionStatus',
      'listSubscriptionOffers',
      'startSubscriptionTrial',
      'cancelSubscription',
      'markSubscriptionMonth2Active',
      'listSubscriptionCancelReasons',
      'getSubscriptionRetentionSummary',
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

  it('includes contract for month2 lifecycle subscription endpoint', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const lifecyclePath = document.paths?.['/api/subscription/lifecycle/month2-active']
    expect(lifecyclePath).toBeTruthy()
    expect(lifecyclePath?.post?.operationId).toBe('markSubscriptionMonth2Active')
    const schema = lifecyclePath?.post?.responses?.['200']?.content?.['application/json']?.schema as
      | {
          properties?: {
            data?: {
              properties?: {
                recorded?: {
                  enum?: unknown[]
                }
              }
            }
          }
        }
      | undefined
    expect(schema?.properties?.data?.properties?.recorded?.enum).toEqual([true])
  })

  it('documents trial-start negative responses for eligibility and plan state', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const trialStartPath = document.paths?.['/api/subscription/trial/start']?.post
    expect(trialStartPath).toBeTruthy()
    expect(trialStartPath?.responses?.['403']).toBeTruthy()
    expect(trialStartPath?.responses?.['409']).toBeTruthy()
  })

  it('uses canonical API error schema for trial-start 401/403/409 responses', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const trialStartPath = document.paths?.['/api/subscription/trial/start']?.post
    expect(trialStartPath).toBeTruthy()

    const statuses = ['401', '403', '409'] as const
    for (const status of statuses) {
      const schema = trialStartPath?.responses?.[status]?.content?.['application/json']?.schema as
        | {
            properties?: {
              success?: { enum?: unknown[] }
              error?: {
                type?: string
                required?: string[]
                properties?: {
                  code?: { type?: string }
                  message?: { type?: string }
                }
              }
            }
            required?: string[]
          }
        | undefined

      expect(schema).toBeTruthy()
      expect(schema?.required).toEqual(expect.arrayContaining(['success', 'error']))
      expect(schema?.properties?.success?.enum).toEqual([false])
      expect(schema?.properties?.error?.type).toBe('object')
      expect(schema?.properties?.error?.required).toEqual(expect.arrayContaining(['code', 'message']))
      expect(schema?.properties?.error?.properties?.code?.type).toBe('string')
      expect(schema?.properties?.error?.properties?.message?.type).toBe('string')
    }
  })

  it('documents 401 responses for protected subscription endpoints', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const protectedOperations = [
      document.paths?.['/api/subscription/status']?.get,
      document.paths?.['/api/subscription/offers']?.get,
      document.paths?.['/api/subscription/trial/start']?.post,
      document.paths?.['/api/subscription/cancel']?.post,
      document.paths?.['/api/subscription/cancel-reasons']?.get,
      document.paths?.['/api/subscription/retention-summary']?.get,
      document.paths?.['/api/subscription/lifecycle/month2-active']?.post,
    ]

    for (const operation of protectedOperations) {
      expect(operation).toBeTruthy()
      expect(operation?.responses?.['401']).toBeTruthy()
    }
  })

  it('documents 403 plan-gated responses for reports premium endpoints', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const reportGenerate = document.paths?.['/api/reports/generate']?.post
    const spendKpis = document.paths?.['/api/v1/kpis/spend']?.get
    expect(reportGenerate).toBeTruthy()
    expect(spendKpis).toBeTruthy()
    expect(reportGenerate?.responses?.['403']).toBeTruthy()
    expect(spendKpis?.responses?.['403']).toBeTruthy()
  })

  it('documents 401 auth responses for reports premium endpoints', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const reportGenerate = document.paths?.['/api/reports/generate']?.post
    const spendKpis = document.paths?.['/api/v1/kpis/spend']?.get
    expect(reportGenerate).toBeTruthy()
    expect(spendKpis).toBeTruthy()
    expect(reportGenerate?.responses?.['401']).toBeTruthy()
    expect(spendKpis?.responses?.['401']).toBeTruthy()
  })
})
