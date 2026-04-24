import type { ServerEnv } from '@autocare/config/server'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearRawEvents, listRawEvents } from '../../analytics/repository.js'
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

const isDatabaseReachable = async (connectionString: string | undefined): Promise<boolean> => {
  if (!connectionString) {
    return false
  }
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 1000,
  })
  try {
    await client.connect()
    await client.query('select 1')
    return true
  } catch {
    return false
  } finally {
    await client.end().catch(() => undefined)
  }
}

const hasReachableDatabase = await isDatabaseReachable(process.env.DATABASE_URL)

describe.skipIf(!hasReachableDatabase)('subscription HTTP integration', () => {
  beforeEach(async () => {
    await clearRawEvents()
  })

  it('returns 401 for protected subscription endpoints without auth', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const unauthenticatedRequests = [
      () => request(app).get('/api/subscription/status').set('X-Client', 'mobile'),
      () => request(app).get('/api/subscription/offers').set('X-Client', 'mobile'),
      () =>
        request(app)
          .post('/api/subscription/trial/start')
          .set('X-Client', 'mobile')
          .send({ billingCycle: 'monthly' }),
      () =>
        request(app)
          .post('/api/subscription/cancel')
          .set('X-Client', 'mobile')
          .send({ reason: 'too_expensive' }),
      () => request(app).get('/api/subscription/cancel-reasons').set('X-Client', 'mobile'),
      () => request(app).get('/api/subscription/retention-summary').set('X-Client', 'mobile'),
      () =>
        request(app)
          .post('/api/subscription/lifecycle/month2-active')
          .set('X-Client', 'mobile')
          .send({}),
    ]

    for (const run of unauthenticatedRequests) {
      const response = await run()
      expect(response.status).toBe(401)
      expect(response.body?.success).toBe(false)
      expect(typeof response.body?.error?.code).toBe('string')
    }
  })

  it('rejects trial start before value milestone is completed', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `sub-precheck-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const startTrial = await request(app)
      .post('/api/subscription/trial/start')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ billingCycle: 'monthly', variant: 'window5-guardrail' })
    expect(startTrial.status).toBe(403)
    expect(startTrial.body.error.code).toBe('paywall_not_eligible')
  })

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

    const startTrialAgain = await request(app)
      .post('/api/subscription/trial/start')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ billingCycle: 'monthly', variant: 'window3-test-repeat' })
    expect(startTrialAgain.status).toBe(409)
    expect(startTrialAgain.body.error.code).toBe('trial_not_available')

    const cancel = await request(app)
      .post('/api/subscription/cancel')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'too_expensive', feedback: 'Need more value features first' })
    expect(cancel.status).toBe(200)
    expect(cancel.body.data.canceled).toBe(true)
    expect(cancel.body.data.effectivePlan).toBe('free')
    expect(cancel.body.data.recordedReason).toBe('too_expensive')

    const month2Active = await request(app)
      .post('/api/subscription/lifecycle/month2-active')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(month2Active.status).toBe(200)

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
    expect(retentionSummary.body.data.trialStartRatePercent).toBe(100)
    expect(retentionSummary.body.data.trialToPaidPercent).toBe(100)
    expect(retentionSummary.body.data.month2PayerRetentionPercent).toBe(100)
    expect(retentionSummary.body.data.refundRatePercent).toBe(100)
    expect(['low', 'medium', 'high']).toContain(retentionSummary.body.data.confidence.trialStartRate)
    expect(['low', 'medium', 'high']).toContain(retentionSummary.body.data.confidence.trialToPaidRate)
    expect(['low', 'medium', 'high']).toContain(retentionSummary.body.data.confidence.payerLifecycleRates)
    expect(['low', 'medium', 'high']).toContain(retentionSummary.body.data.confidence.freeTierD30Delta)
    expect(retentionSummary.body.data.sampleSize.lowSampleThreshold).toBe(10)
    expect(retentionSummary.body.data.sampleSize.paywallViews).toBe(0)
    expect(retentionSummary.body.data.sampleSize.trialStarts).toBe(0)
    expect(retentionSummary.body.data.sampleSize.paidConversions).toBe(0)
    expect(typeof retentionSummary.body.data.trialStartRatePercent).toBe('number')
    expect(Array.isArray(retentionSummary.body.data.notes)).toBe(true)
  })

  it('computes retention summary metrics from multiple payer flows', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const registerUser = async (email: string) => {
      const reg = await request(app)
        .post('/auth/register')
        .set('X-Client', 'mobile')
        .send({ email, password: 'password123' })
      expect(reg.status).toBe(201)
      return reg.body.data.tokens.accessToken as string
    }

    const completeValueMilestone = async (token: string, vinSeed: string) => {
      const createdVehicle = await request(app)
        .post('/api/vehicles')
        .set('X-Client', 'mobile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          make: 'Toyota',
          model: 'Corolla',
          year: 2021,
          vin: `TY${vinSeed}`,
        })
      expect(createdVehicle.status).toBe(201)
      const vehicleId = createdVehicle.body.data.id as string

      const maintenance = await request(app)
        .post(`/api/vehicles/${vehicleId}/maintenance`)
        .set('X-Client', 'mobile')
        .set('Authorization', `Bearer ${token}`)
        .send({ odometer: 12000, category: 'Oil', description: 'Value milestone' })
      expect(maintenance.status).toBe(201)
    }

    const tokenA = await registerUser(`sub-multi-a-${Date.now()}@example.com`)
    await completeValueMilestone(tokenA, `${Date.now().toString(36)}a`)

    const statusA = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(statusA.status).toBe(200)
    expect(statusA.body.data.paywallEligible).toBe(true)

    const trialA = await request(app)
      .post('/api/subscription/trial/start')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ billingCycle: 'monthly', variant: 'multi-user-a' })
    expect(trialA.status).toBe(200)

    const month2A = await request(app)
      .post('/api/subscription/lifecycle/month2-active')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
    expect(month2A.status).toBe(200)

    const cancelA = await request(app)
      .post('/api/subscription/cancel')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ reason: 'too_expensive' })
    expect(cancelA.status).toBe(200)

    const tokenB = await registerUser(`sub-multi-b-${Date.now()}@example.com`)
    await completeValueMilestone(tokenB, `${Date.now().toString(36)}b`)

    const statusB = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenB}`)
    expect(statusB.status).toBe(200)
    expect(statusB.body.data.paywallEligible).toBe(true)

    const trialB = await request(app)
      .post('/api/subscription/trial/start')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ billingCycle: 'annual', variant: 'multi-user-b' })
    expect(trialB.status).toBe(200)

    const summary = await request(app)
      .get('/api/subscription/retention-summary')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenB}`)
    expect(summary.status).toBe(200)
    expect(summary.body.data.trialStartRatePercent).toBe(100)
    expect(summary.body.data.trialToPaidPercent).toBe(100)
    expect(summary.body.data.month2PayerRetentionPercent).toBe(0)
    expect(summary.body.data.refundRatePercent).toBe(0)
  })

  it('tracks subscription events with request analytics context', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `sub-context-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: `HC${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const createMaintenance = await request(app)
      .post(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ odometer: 17500, category: 'Oil', description: 'Value event for analytics context' })
    expect(createMaintenance.status).toBe(201)

    const status = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set('X-Platform', 'ios')
      .set('X-Country', 'ro')
      .set('X-Channel', 'referral')
      .set('X-App-Version', '1.9.0')
      .set('X-Session-Id', 'session-retention-context')
      .set('X-Device-Id', 'device-retention-context')
      .set('Authorization', `Bearer ${token}`)
    expect(status.status).toBe(200)
    expect(status.body.data.paywallEligible).toBe(true)

    const events = await listRawEvents()
    const paywallEvent = events.find((event) => event.eventName === 'subscription_paywall_viewed')
    expect(paywallEvent).toBeTruthy()
    expect(paywallEvent?.platform).toBe('ios')
    expect(paywallEvent?.country).toBe('RO')
    expect(paywallEvent?.channel).toBe('referral')
    expect(paywallEvent?.appVersion).toBe('1.9.0')
    expect(paywallEvent?.sessionId).toBe('session-retention-context')
    expect(paywallEvent?.deviceId).toBe('device-retention-context')
  })

  it('sanitizes analytics headers and falls back safely', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `sub-sanitize-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Skoda',
        model: 'Octavia',
        year: 2020,
        vin: `SK${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const createMaintenance = await request(app)
      .post(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ odometer: 21000, category: 'Oil', description: 'Value event for header sanitize test' })
    expect(createMaintenance.status).toBe(201)

    const longChannel = 'x'.repeat(100)
    const longAppVersion = 'v'.repeat(80)
    const longSessionId = 's'.repeat(180)
    const longDeviceId = 'd'.repeat(180)

    const status = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set('X-Platform', 'invalid-platform')
      .set('X-Country', 'romania')
      .set('X-Channel', longChannel)
      .set('X-App-Version', longAppVersion)
      .set('X-Session-Id', longSessionId)
      .set('X-Device-Id', longDeviceId)
      .set('Authorization', `Bearer ${token}`)
    expect(status.status).toBe(200)
    expect(status.body.data.paywallEligible).toBe(true)

    const events = await listRawEvents()
    const paywallEvent = events.find((event) => event.eventName === 'subscription_paywall_viewed')
    expect(paywallEvent).toBeTruthy()
    expect(paywallEvent?.platform).toBe('ios')
    expect(paywallEvent?.country).toBe('XX')
    expect(paywallEvent?.channel.length).toBe(64)
    expect(paywallEvent?.appVersion.length).toBe(32)
    expect(paywallEvent?.sessionId.length).toBe(128)
    expect(paywallEvent?.deviceId.length).toBe(128)
  })

  it('propagates analytics context across trial, month2, and cancel events', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `sub-lifecycle-context-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Seat',
        model: 'Leon',
        year: 2022,
        vin: `ST${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const createMaintenance = await request(app)
      .post(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ odometer: 18000, category: 'Oil', description: 'Value event for lifecycle context test' })
    expect(createMaintenance.status).toBe(201)

    const analyticsHeaders = {
      'X-Platform': 'android',
      'X-Country': 'DE',
      'X-Channel': 'paid-social',
      'X-App-Version': '2.3.1',
      'X-Session-Id': 'session-lifecycle-context',
      'X-Device-Id': 'device-lifecycle-context',
    } as const

    const status = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set(analyticsHeaders)
      .set('Authorization', `Bearer ${token}`)
    expect(status.status).toBe(200)
    expect(status.body.data.paywallEligible).toBe(true)

    const startTrial = await request(app)
      .post('/api/subscription/trial/start')
      .set('X-Client', 'mobile')
      .set(analyticsHeaders)
      .set('Authorization', `Bearer ${token}`)
      .send({ billingCycle: 'monthly', variant: 'window27-lifecycle-context' })
    expect(startTrial.status).toBe(200)

    const month2Active = await request(app)
      .post('/api/subscription/lifecycle/month2-active')
      .set('X-Client', 'mobile')
      .set(analyticsHeaders)
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(month2Active.status).toBe(200)

    const cancel = await request(app)
      .post('/api/subscription/cancel')
      .set('X-Client', 'mobile')
      .set(analyticsHeaders)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'too_expensive' })
    expect(cancel.status).toBe(200)

    const events = await listRawEvents()
    const lifecycleEvents = events.filter((event) =>
      [
        'subscription_paywall_viewed',
        'subscription_trial_started',
        'subscription_converted_to_paid',
        'subscription_month2_active',
        'subscription_refunded',
      ].includes(event.eventName),
    )
    expect(lifecycleEvents.length).toBeGreaterThanOrEqual(5)

    for (const event of lifecycleEvents) {
      expect(event.platform).toBe('android')
      expect(event.country).toBe('DE')
      expect(event.channel).toBe('paid-social')
      expect(event.appVersion).toBe('2.3.1')
      expect(event.sessionId).toBe('session-lifecycle-context')
      expect(event.deviceId).toBe('device-lifecycle-context')
    }
  })

  it('scopes retention summary to current organization users', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const app = await buildApp(db)

    const registerAndSeedValueEvent = async (email: string) => {
      const reg = await request(app)
        .post('/auth/register')
        .set('X-Client', 'mobile')
        .send({ email, password: 'password123' })
      expect(reg.status).toBe(201)
      const token = reg.body.data.tokens.accessToken as string

      const createdVehicle = await request(app)
        .post('/api/vehicles')
        .set('X-Client', 'mobile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          make: 'BMW',
          model: '320',
          year: 2021,
          vin: `BM${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        })
      expect(createdVehicle.status).toBe(201)
      const vehicleId = createdVehicle.body.data.id as string

      const maintenance = await request(app)
        .post(`/api/vehicles/${vehicleId}/maintenance`)
        .set('X-Client', 'mobile')
        .set('Authorization', `Bearer ${token}`)
        .send({ odometer: 11000, category: 'Oil', description: 'Org-scoped retention seed' })
      expect(maintenance.status).toBe(201)
      return token
    }

    const tokenA = await registerAndSeedValueEvent(`sub-org-a-${Date.now()}@example.com`)
    const tokenB = await registerAndSeedValueEvent(`sub-org-b-${Date.now()}@example.com`)

    // Org A emits paywall + trial (+ converted event)
    const statusA = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(statusA.status).toBe(200)
    expect(statusA.body.data.paywallEligible).toBe(true)

    const trialA = await request(app)
      .post('/api/subscription/trial/start')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ billingCycle: 'monthly', variant: 'window30-org-a' })
    expect(trialA.status).toBe(200)

    // Org B emits only paywall-viewed (no trial)
    const statusB = await request(app)
      .get('/api/subscription/status')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenB}`)
    expect(statusB.status).toBe(200)
    expect(statusB.body.data.paywallEligible).toBe(true)

    const summaryB = await request(app)
      .get('/api/subscription/retention-summary')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${tokenB}`)
    expect(summaryB.status).toBe(200)
    expect(summaryB.body.data.trialStartRatePercent).toBe(0)
    expect(summaryB.body.data.trialToPaidPercent).toBe(0)
    expect(summaryB.body.data.month2PayerRetentionPercent).toBe(0)
    expect(summaryB.body.data.refundRatePercent).toBe(0)
    expect(summaryB.body.data.freeTierD30RetentionDeltaPercent).toBe(0)
    expect(summaryB.body.data.notes[0]).toBe(
      'Detailed sample size fields are hidden for non-elevated report readers.',
    )
  })
})
