import type { ServerEnv } from '@autocare/config/server'
import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createAppContainer } from '../../../infrastructure/di/container.js'
import { createAuthModule } from '../../../modules/auth/auth-module.js'
import {
  createFakeClock,
  createInMemoryOrganizationInviteRepo,
  createInMemoryRefreshRepo,
  createInMemoryUserRepo,
} from '../../../modules/auth/__tests__/test-helpers.js'
import { errorHandler } from '../middlewares/error-handler.middleware.js'
import { createHttpRoutes } from '../routes.js'

const makeEnv = (overrides: Partial<ServerEnv> = {}): ServerEnv =>
  ({
    NODE_ENV: 'test',
    PORT: 0,
    DATABASE_URL: 'postgres://user:pass@localhost:5432/test',
    ALLOWED_ORIGINS: undefined,
    TRUST_PROXY: 0,
    OPEN_API_DOCS: false,
    ANALYTICS_STORAGE: undefined,
    VITEST: true,
    JWT_ACCESS_SECRET: 'x'.repeat(48),
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

const buildApp = async () => {
  const users = createInMemoryUserRepo()
  const authModule = await createAuthModule(makeEnv(), {
    clock: createFakeClock(new Date('2026-04-18T00:00:00.000Z')),
    users,
    refreshTokens: createInMemoryRefreshRepo(),
    organizationInvites: createInMemoryOrganizationInviteRepo(),
    db: {} as never,
  })
  const container = createAppContainer(authModule)

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use(createHttpRoutes(container, authModule))
  app.use(errorHandler)

  return { app, users }
}

const registerAndGetToken = async (app: express.Express, email: string) => {
  const response = await request(app)
    .post('/auth/register')
    .set('X-Client', 'mobile')
    .send({ email, password: 'password123' })
  return {
    userId: response.body.data.user.id as string,
    organizationId: response.body.data.user.organizationId as string,
    token: response.body.data.tokens.accessToken as string,
  }
}

describe('HTTP access control', () => {
  it('requires authentication by default for /api routes', async () => {
    const { app } = await buildApp()

    const response = await request(app).get('/api/wash/suggestion').set('X-Client', 'mobile')
    expect(response.status).toBe(401)
  })

  it('blocks free users on premium endpoints and allows premium plan', async () => {
    const { app, users } = await buildApp()
    const account = await registerAndGetToken(app, 'free-premium-check@example.com')

    const freeAccess = await request(app)
      .post('/api/ai/scan-receipt')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${account.token}`)
      .send({})
    expect(freeAccess.status).toBe(403)
    expect(freeAccess.body.error.code).toBe('forbidden_plan')

    users._setOrganizationPlan(account.organizationId, 'premium')
    const premiumAccess = await request(app)
      .post('/api/ai/scan-receipt')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${account.token}`)
      .send({})
    expect(premiumAccess.status).toBe(200)
  })

  it('applies user override precedence over organization plan', async () => {
    const { app, users } = await buildApp()
    const premiumUserInFreeOrg = await registerAndGetToken(app, 'override-premium@example.com')
    users._setPlanOverride(premiumUserInFreeOrg.userId, 'premium')

    const overrideAllows = await request(app)
      .post('/api/ai/scan-receipt')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${premiumUserInFreeOrg.token}`)
      .send({})
    expect(overrideAllows.status).toBe(200)

    const freeOverrideInPremiumOrg = await registerAndGetToken(app, 'override-free@example.com')
    users._setOrganizationPlan(freeOverrideInPremiumOrg.organizationId, 'premium')
    users._setPlanOverride(freeOverrideInPremiumOrg.userId, 'free')

    const overrideDenies = await request(app)
      .post('/api/ai/scan-receipt')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${freeOverrideInPremiumOrg.token}`)
      .send({})
    expect(overrideDenies.status).toBe(403)
    expect(overrideDenies.body.error.code).toBe('forbidden_plan')
  })

  it('enforces admin-only endpoints with explicit permission error', async () => {
    const { app, users } = await buildApp()
    const userAccount = await registerAndGetToken(app, 'audit-user@example.com')

    const forbidden = await request(app)
      .get('/api/audit-logs')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${userAccount.token}`)
    expect(forbidden.status).toBe(403)
    expect(forbidden.body.error.code).toBe('forbidden_permission')

    users._setRole(userAccount.userId, 'admin')
    const allowed = await request(app)
      .get('/api/audit-logs')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${userAccount.token}`)
    expect(allowed.status).toBe(200)
  })
})
