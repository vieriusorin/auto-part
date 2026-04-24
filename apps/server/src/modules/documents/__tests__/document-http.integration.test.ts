import type { ServerEnv } from '@autocare/config/server'
import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { errorHandler } from '../../../interfaces/http/middlewares/error-handler.middleware.js'
import { createAuthModule } from '../../auth/auth-module.js'
import {
  createFakeClock,
  createInMemoryOrganizationInviteRepo,
  createInMemoryRefreshRepo,
  createInMemoryUserRepo,
} from '../../auth/__tests__/test-helpers.js'
import { createAuthRouter } from '../../auth/interfaces/http/auth-routes.js'
import { createDocumentRouter } from '../interfaces/http/document-routes.js'

const makeEnv = (): ServerEnv =>
  ({
    NODE_ENV: 'test',
    PORT: 0,
    DATABASE_URL: 'postgres://user:pass@localhost:5432/test',
    ALLOWED_ORIGINS: undefined,
    TRUST_PROXY: 0,
    OPEN_API_DOCS: false,
    ANALYTICS_STORAGE: undefined,
    VITEST: true,
    JWT_ACCESS_SECRET: 'd'.repeat(48),
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
  }) as ServerEnv

const register = async (app: express.Express, email: string) => {
  const res = await request(app)
    .post('/auth/register')
    .set('X-Client', 'mobile')
    .send({ email, password: 'password123' })
  return {
    token: res.body.data.tokens.accessToken as string,
    userId: res.body.data.user.id as string,
  }
}

describe('documents HTTP ABAC integration', () => {
  it('filters read fields for viewer', async () => {
    const users = createInMemoryUserRepo()
    const clock = createFakeClock(new Date('2026-04-23T10:00:00.000Z'))
    const auth = await createAuthModule(makeEnv(), {
      users,
      clock,
      refreshTokens: createInMemoryRefreshRepo(),
      organizationInvites: createInMemoryOrganizationInviteRepo(),
      db: {} as never,
    })

    const app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/auth', createAuthRouter(auth))
    app.use('/api', createDocumentRouter(auth))
    app.use(errorHandler)

    const { token, userId } = await register(app, 'viewer-doc@example.com')
    users._setOrganizationRole(userId, 'manager')
    const created = await request(app)
      .post('/api/documents')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Viewer-owned document',
        content: 'Owned content',
      })
    expect(created.status).toBe(201)
    users._setOrganizationRole(userId, 'viewer')

    const list = await request(app)
      .get('/api/documents')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)

    expect(list.status).toBe(200)
    expect(list.body.data.items.length).toBeGreaterThan(0)
    const ownDocument = list.body.data.items.find(
      (item: { title?: string }) => item.title === 'Viewer-owned document',
    )
    expect(ownDocument).toBeDefined()
    expect(ownDocument.createdAt).toBeUndefined()
    expect(ownDocument.updatedAt).toBeUndefined()
  })

  it('blocks editor updates on weekends', async () => {
    const users = createInMemoryUserRepo()
    const clock = createFakeClock(new Date('2026-04-24T10:00:00.000Z'))
    const auth = await createAuthModule(makeEnv(), {
      users,
      clock,
      refreshTokens: createInMemoryRefreshRepo(),
      organizationInvites: createInMemoryOrganizationInviteRepo(),
      db: {} as never,
    })
    const app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/auth', createAuthRouter(auth))
    app.use('/api', createDocumentRouter(auth))
    app.use(errorHandler)

    const { token, userId } = await register(app, 'editor-doc@example.com')
    users._setOrganizationRole(userId, 'manager')

    const created = await request(app)
      .post('/api/documents')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Editor weekend test', content: 'Initial content' })
    expect(created.status).toBe(201)
    const id = created.body.data.id as string

    clock.setNow(new Date('2026-04-26T10:00:00.000Z'))
    const relogin = await request(app)
      .post('/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'editor-doc@example.com', password: 'password123' })
    expect(relogin.status).toBe(200)
    const weekendToken = relogin.body.data.tokens.accessToken as string

    const patch = await request(app)
      .patch(`/api/documents/${id}`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${weekendToken}`)
      .send({ content: 'Weekend edit' })

    expect(patch.status).toBe(403)
    expect(patch.body.error.code).toBe('forbidden_permission')
  })
})

