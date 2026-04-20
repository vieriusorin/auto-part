import { banners } from '@autocare/db'
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
import { createBannerRouter } from '../interfaces/http/banner-routes.js'

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
    JWT_ACCESS_SECRET: 'b'.repeat(48),
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

const buildBannerApp = async (db: NodePgDatabase) => {
  const env = makeEnv()
  const clock = createFakeClock(new Date('2026-04-20T12:00:00.000Z'))
  const users = createInMemoryUserRepo()
  const refreshTokens = createInMemoryRefreshRepo()
  const authModule = await createAuthModule(env, { clock, users, refreshTokens, db })

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', createAuthRouter(authModule))
  app.use('/api', createBannerRouter(authModule))
  app.use(errorHandler)

  return { app, db }
}

describe('banners HTTP (auth required)', () => {
  it('returns 401 for list without bearer token', async () => {
    const authModule = await createAuthModule(makeEnv(), {
      clock: createFakeClock(),
      users: createInMemoryUserRepo(),
      refreshTokens: createInMemoryRefreshRepo(),
      db: {} as NodePgDatabase,
    })
    const app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/api', createBannerRouter(authModule))
    app.use(errorHandler)

    const res = await request(app).get('/api/banners').set('X-Client', 'mobile')
    expect(res.status).toBe(401)
  })
})

describe.skipIf(!process.env.DATABASE_URL)('banners HTTP (with database)', () => {
  it('lists visible banners and hides dismissed versions only', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildBannerApp(db)

    const unique = Date.now().toString(36)
    const v1Key = `expire-vignette:${unique}:v1`
    const v2Key = `expire-vignette:${unique}:v2`

    await db.insert(banners).values([
      {
        key: v1Key,
        title: 'Vignette expires soon',
        message: 'Renew your vignette to avoid fines.',
        severity: 'warning',
        isActive: true,
      },
      {
        key: v2Key,
        title: 'Vignette expires soon (new campaign)',
        message: 'Updated reminder campaign.',
        severity: 'warning',
        isActive: true,
      },
    ])

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `banners-${unique}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const listBefore = await request(app)
      .get('/api/banners')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(listBefore.status).toBe(200)
    expect(listBefore.body.data.items.some((item: { key: string }) => item.key === v1Key)).toBe(true)
    expect(listBefore.body.data.items.some((item: { key: string }) => item.key === v2Key)).toBe(true)

    const dismissV1 = await request(app)
      .post(`/api/banners/${encodeURIComponent(v1Key)}/dismiss`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(dismissV1.status).toBe(200)
    expect(dismissV1.body.data.dismissed).toBe(true)

    const dismissV1Again = await request(app)
      .post(`/api/banners/${encodeURIComponent(v1Key)}/dismiss`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(dismissV1Again.status).toBe(200)
    expect(dismissV1Again.body.data.dismissed).toBe(true)

    const listAfter = await request(app)
      .get('/api/banners')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(listAfter.status).toBe(200)
    expect(listAfter.body.data.items.some((item: { key: string }) => item.key === v1Key)).toBe(false)
    expect(listAfter.body.data.items.some((item: { key: string }) => item.key === v2Key)).toBe(true)
  })

  it('returns 404 for unknown banner dismiss key', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildBannerApp(db)
    const unique = Date.now().toString(36)
    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `banners-404-${unique}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const dismissMissing = await request(app)
      .post('/api/banners/does-not-exist%3Av1/dismiss')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(dismissMissing.status).toBe(404)
  })
})
