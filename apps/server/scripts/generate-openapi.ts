#!/usr/bin/env tsx
/**
 * Generates `apps/server/openapi.json` and per-domain specs under
 * `apps/server/openapi/*.json` from the Zod contracts registered by each
 * module router. Intended for client codegen (web, mobile) and CI diff checks.
 * Runs without the DB or network.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'
process.env.VITEST = process.env.VITEST ?? 'true'

import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createAiRouter } from '../src/modules/ai/interfaces/http/ai-routes.js'
import { createAnalyticsRouter } from '../src/modules/analytics/interfaces/http/analytics-routes.js'
import { createAffiliateRouter } from '../src/modules/affiliate/interfaces/http/affiliate-routes.js'
import { createAuditRouter } from '../src/modules/audit/interfaces/http/audit-routes.js'
import { createBannerRouter } from '../src/modules/banners/interfaces/http/banner-routes.js'
import type { AuthModule } from '../src/modules/auth/auth-module.js'
import { createAuthorizationService } from '../src/modules/auth/application/authorization-service.js'
import { createAuthRouter } from '../src/modules/auth/interfaces/http/auth-routes.js'
import { createCoreRouter } from '../src/modules/core/interfaces/http/core-routes.js'
import { createReportRouter } from '../src/modules/reports/interfaces/http/report-routes.js'
import { createTrustRouter } from '../src/modules/trust/interfaces/http/trust-routes.js'
import { createUtilityRouter } from '../src/modules/utility/interfaces/http/utility-routes.js'
import { createVehicleRouter } from '../src/modules/vehicles/interfaces/http/vehicle-routes.js'
import { buildOpenApiDocumentsByDomain } from '../src/interfaces/http/openapi/index.js'

const main = (): void => {
  const stubAuthModule = {
    jwtSigner: { verify: async () => ({}) as never, sign: async () => ({}) as never },
    cookieConfig: {
      accessCookieName: 'autocare.access',
      refreshCookieName: 'autocare.refresh',
    },
    csrfConfig: { cookieName: 'autocare.csrf', headerName: 'x-csrf-token' },
    db: {} as import('drizzle-orm/node-postgres').NodePgDatabase,
    authorization: createAuthorizationService(),
    useCases: {} as never,
    users: {} as never,
  } as unknown as AuthModule

  createCoreRouter()
  createAnalyticsRouter()
  createTrustRouter()
  createAffiliateRouter(stubAuthModule)
  createVehicleRouter(stubAuthModule)
  createAiRouter()
  createReportRouter(stubAuthModule)
  createAuditRouter()
  createBannerRouter(stubAuthModule)
  createUtilityRouter()
  createAuthRouter(stubAuthModule)

  const options = {
    title: 'Autocare API',
    version: '0.1.0',
    description:
      'API documentation for Autocare server endpoints. Generated from Zod contracts in @autocare/shared.',
    serverUrl: '/api',
  } as const

  const { merged, byDomain } = buildOpenApiDocumentsByDomain(options)

  const domainDir = resolve(process.cwd(), 'openapi')
  mkdirSync(domainDir, { recursive: true })

  for (const name of readdirSync(domainDir)) {
    if (name.endsWith('.json')) {
      unlinkSync(join(domainDir, name))
    }
  }

  const domainPaths: string[] = []
  for (const [slug, document] of Object.entries(byDomain)) {
    const path = join(domainDir, `${slug}.json`)
    writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`)
    domainPaths.push(path)
  }

  const mergedPath = resolve(process.cwd(), 'openapi.json')
  writeFileSync(mergedPath, `${JSON.stringify(merged, null, 2)}\n`)

  // eslint-disable-next-line no-console
  console.log(`OpenAPI document written to ${mergedPath}`)
  for (const p of domainPaths.sort()) {
    // eslint-disable-next-line no-console
    console.log(`OpenAPI domain spec written to ${p}`)
  }
}

main()
