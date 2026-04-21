import type { ServerEnv } from '@autocare/config/server'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { errorHandler } from '../../../interfaces/http/middlewares/error-handler.middleware.js'
import { createAuthModule } from '../../auth/auth-module.js'
import {
  createFakeClock,
  createInMemoryRefreshRepo,
  createInMemoryUserRepo,
} from '../../auth/__tests__/test-helpers.js'
import { getAuthDb } from '../../auth/infrastructure/db.js'
import { createAuthRouter } from '../../auth/interfaces/http/auth-routes.js'
import { createReportRouter } from '../interfaces/http/report-routes.js'
import { createVehicleRouter } from '../../vehicles/interfaces/http/vehicle-routes.js'

const makeEnv = (overrides: Partial<ServerEnv> = {}): ServerEnv =>
  ({
    NODE_ENV: 'test',
    PORT: 0,
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://user:pass@localhost:5432/test',
    ALLOWED_ORIGINS: undefined,
    TRUST_PROXY: 0,
    OPEN_API_DOCS: false,
    ANALYTICS_STORAGE: undefined,
    VITEST: true,
    JWT_ACCESS_SECRET: 'c'.repeat(48),
    JWT_ACCESS_ALG: 'HS256',
    JWT_ACCESS_PRIVATE_KEY: undefined,
    JWT_ACCESS_PUBLIC_KEY: undefined,
    JWT_ACCESS_TTL_SECONDS: 900,
    JWT_ISSUER: 'autocare-api',
    JWT_AUDIENCE: 'autocare',
    REFRESH_TTL_DAYS: 30,
    REFRESH_ROTATION: 'enabled',
    REFRESH_REUSE_DETECTION: 'enabled',
    REFRESH_INACTIVITY_DAYS: 7,
    REFRESH_ABSOLUTE_MAX_DAYS: 90,
    REFRESH_GRACE_SECONDS: 0,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_MIXED_CASE: false,
    PASSWORD_REQUIRE_DIGIT: false,
    PASSWORD_REQUIRE_SYMBOL: false,
    ARGON2_TIME_COST: 1,
    ARGON2_MEMORY_COST_KIB: 4096,
    ARGON2_PARALLELISM: 1,
    LOGIN_MAX_FAILED_ATTEMPTS: 5,
    LOGIN_LOCKOUT_MINUTES: 15,
    COOKIE_ENABLED: true,
    COOKIE_DOMAIN: undefined,
    COOKIE_SAMESITE: 'lax',
    COOKIE_SECURE: false,
    COOKIE_PATH: '/',
    COOKIE_ACCESS_NAME: undefined,
    COOKIE_REFRESH_NAME: undefined,
    CSRF_ENABLED: true,
    CSRF_COOKIE_NAME: 'autocare.csrf',
    CSRF_HEADER_NAME: 'x-csrf-token',
    CSRF_TOKEN_TTL_MINUTES: 1440,
    GOOGLE_OAUTH_ENABLED: false,
    GOOGLE_OAUTH_CLIENT_ID: undefined,
    GOOGLE_OAUTH_CLIENT_SECRET: undefined,
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    INVITE_LINK_BASE_URL: 'http://localhost:3000',
    INVITE_EMAIL_FROM: 'noreply@autocare.local',
    INVITE_DEFAULT_EXPIRES_DAYS: 7,
    INVITE_RESEND_COOLDOWN_SECONDS: 60,
    INVITE_RESEND_COOLDOWN_OWNER_SECONDS: 45,
    INVITE_RESEND_COOLDOWN_ADMIN_SECONDS: 60,
    ...overrides,
  }) as ServerEnv

const buildApp = async (db: NodePgDatabase) => {
  const authModule = await createAuthModule(makeEnv(), {
    clock: createFakeClock(new Date('2026-04-21T10:00:00.000Z')),
    users: createInMemoryUserRepo(),
    refreshTokens: createInMemoryRefreshRepo(),
    db,
  })

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', createAuthRouter(authModule))
  app.use('/api', createVehicleRouter(authModule))
  app.use('/api', createReportRouter(authModule))
  app.use(errorHandler)
  return app
}

describe.skipIf(!process.env.DATABASE_URL)('subscription HTTP integration', () => {
  it('starts trial, then cancels and records reason summary', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `sub-flow-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Mazda',
        model: '3',
        year: 2022,
        vin: `MZ${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const createMaintenance = await request(app)
      .post(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ odometer: 15000, category: 'Oil', description: 'Seed maintenance value event' })
    expect(createMaintenance.status).toBe(201)

    const statusBefore = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(statusBefore.status).toBe(200)
    expect(statusBefore.body.data.paywallEligible).toBe(true)
    expect(statusBefore.body.data.effectivePlan).toBe('free')

    const startTrial = await request(app)
      .post('/api/subscription/trial/start')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ billingCycle: 'monthly', variant: 'window3-test' })
    expect(startTrial.status).toBe(200)
    expect(startTrial.body.data.started).toBe(true)
    expect(startTrial.body.data.plan).toBe('premium')

    const cancel = await request(app)
      .post('/api/subscription/cancel')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'too_expensive', feedback: 'Need more value features first' })
    expect(cancel.status).toBe(200)
    expect(cancel.body.data.canceled).toBe(true)
    expect(cancel.body.data.effectivePlan).toBe('free')
    expect(cancel.body.data.recordedReason).toBe('too_expensive')

    const reasonSummary = await request(app)
      .get('/api/subscription/cancel-reasons')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(reasonSummary.status).toBe(200)
    expect(reasonSummary.body.data.items.some((item: { reason: string }) => item.reason === 'too_expensive')).toBe(true)

    const retentionSummary = await request(app)
      .get('/api/subscription/retention-summary')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(retentionSummary.status).toBe(200)
    expect(typeof retentionSummary.body.data.trialStartRatePercent).toBe('number')
    expect(Array.isArray(retentionSummary.body.data.notes)).toBe(true)
  })
})
