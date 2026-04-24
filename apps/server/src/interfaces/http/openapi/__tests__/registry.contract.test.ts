import { beforeAll, describe, expect, it } from 'vitest'
import { createAiRouter } from '../../../../modules/ai/interfaces/http/ai-routes.js'
import { createAnalyticsRouter } from '../../../../modules/analytics/interfaces/http/analytics-routes.js'
import { createAffiliateRouter } from '../../../../modules/affiliate/interfaces/http/affiliate-routes.js'
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
      authorization: {
        permissionsForRole: () => [],
      },
    } as unknown as AuthModule

    createCoreRouter()
    createAnalyticsRouter()
    createAffiliateRouter(stubAuthModule)
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
      'listAffiliateOffers',
      'getAffiliateMetrics',
      'getAffiliateImpact',
      'getAffiliateDashboard',
      'getAffiliateTrends',
      'getAffiliateDisclosureAudit',
      'getAffiliateKpiGates',
      'getAffiliatePhaseExitReadiness',
      'trackAffiliateClick',
      'trackAffiliateExposure',
      'reportAffiliateComplaint',
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

  it('documents affiliate offers disclosure label as fixed sponsored copy', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const affiliateOffers = document.paths?.['/api/affiliate/offers']?.get
    expect(affiliateOffers).toBeTruthy()

    const schema = affiliateOffers?.responses?.['200']?.content?.['application/json']?.schema as
      | {
          properties?: {
            data?: {
              properties?: {
                items?: {
                  items?: {
                    properties?: {
                      disclosureLabel?: { enum?: unknown[] }
                    }
                  }
                }
              }
            }
          }
        }
      | undefined

    expect(schema?.properties?.data?.properties?.items?.items?.properties?.disclosureLabel?.enum).toEqual([
      'Sponsored recommendation',
    ])
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

  it('documents analytics-context headers on instrumented subscription endpoints', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const expectedHeaderNames = [
      'x-platform',
      'x-country',
      'x-channel',
      'x-app-version',
      'x-session-id',
      'x-device-id',
    ]

    const instrumentedOperations = [
      document.paths?.['/api/subscription/status']?.get,
      document.paths?.['/api/subscription/trial/start']?.post,
      document.paths?.['/api/subscription/cancel']?.post,
      document.paths?.['/api/subscription/lifecycle/month2-active']?.post,
    ]

    for (const operation of instrumentedOperations) {
      expect(operation).toBeTruthy()
      const parameters = operation?.parameters ?? []
      const headerParameterNames = parameters
        .filter((parameter) => 'in' in parameter && parameter.in === 'header' && 'name' in parameter)
        .map((parameter) => ('name' in parameter ? parameter.name : ''))
      for (const headerName of expectedHeaderNames) {
        expect(
          headerParameterNames.includes(headerName),
          `missing header ${headerName}`,
        ).toBe(true)
      }
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

  it('documents retention summary sample-size metadata fields', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const retention = document.paths?.['/api/subscription/retention-summary']?.get
    expect(retention).toBeTruthy()

    const dataSchema = retention?.responses?.['200']?.content?.['application/json']?.schema as
      | {
          properties?: {
            data?: {
              properties?: {
                sampleSize?: {
                  properties?: Record<string, unknown>
                }
              }
            }
          }
        }
      | undefined

    const sampleSizeProps = dataSchema?.properties?.data?.properties?.sampleSize?.properties
    expect(sampleSizeProps).toBeTruthy()
    expect(sampleSizeProps).toHaveProperty('paywallViews')
    expect(sampleSizeProps).toHaveProperty('trialStarts')
    expect(sampleSizeProps).toHaveProperty('paidConversions')
    expect(sampleSizeProps).toHaveProperty('lowSampleThreshold')
  })

  it('documents retention summary confidence tiers', () => {
    const document = buildOpenApiDocument({
      title: 'Autocare API',
      version: '0.0.0-test',
      description: 'test',
      serverUrl: '/api',
    })

    const retention = document.paths?.['/api/subscription/retention-summary']?.get
    expect(retention).toBeTruthy()

    const dataSchema = retention?.responses?.['200']?.content?.['application/json']?.schema as
      | {
          properties?: {
            data?: {
              properties?: {
                confidence?: {
                  properties?: Record<string, { enum?: unknown[] }>
                }
              }
            }
          }
        }
      | undefined

    const confidenceProps = dataSchema?.properties?.data?.properties?.confidence?.properties
    expect(confidenceProps).toBeTruthy()
    expect(confidenceProps).toHaveProperty('trialStartRate')
    expect(confidenceProps).toHaveProperty('trialToPaidRate')
    expect(confidenceProps).toHaveProperty('payerLifecycleRates')
    expect(confidenceProps).toHaveProperty('freeTierD30Delta')
    expect(confidenceProps?.trialStartRate?.enum).toEqual(['low', 'medium', 'high'])
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
