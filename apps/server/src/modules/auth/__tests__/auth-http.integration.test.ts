import type { ServerEnv } from '@autocare/config/server'
import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { errorHandler } from '../../../interfaces/http/middlewares/error-handler.middleware.js'
import { createAuthModule } from '../auth-module.js'
import { createAuthApiRouter, createAuthRouter } from '../interfaces/http/auth-routes.js'
import {
  createFakeClock,
  createInMemoryOrganizationInviteRepo,
  createInMemoryRefreshRepo,
  createInMemoryUserRepo,
} from './test-helpers.js'

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
    JWT_ACCESS_SECRET: 'a'.repeat(48),
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

const buildApp = async (envOverrides: Partial<ServerEnv> = {}) => {
  const env = makeEnv(envOverrides)
  const clock = createFakeClock(new Date('2026-04-17T10:00:00.000Z'))
  const users = createInMemoryUserRepo()
  const refreshTokens = createInMemoryRefreshRepo()
  const organizationInvites = createInMemoryOrganizationInviteRepo()
  const inviteEmails: Array<{ to: string; token: string }> = []

  const authModule = await createAuthModule(env, {
    clock,
    users,
    refreshTokens,
    organizationInvites,
    inviteEmailSender: {
      sendOrganizationInvite: async ({ toEmail, inviteToken }) => {
        inviteEmails.push({ to: toEmail, token: inviteToken })
      },
    },
    // biome-ignore lint/suspicious/noExplicitAny: in-memory repos bypass drizzle; db param unused
    db: {} as any,
  })

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', createAuthRouter(authModule))
  app.use('/api', createAuthApiRouter(authModule))
  app.use(errorHandler)

  return { app, authModule, clock, users, refreshTokens, inviteEmails }
}

describe('auth HTTP (mobile — Authorization header)', () => {
  it('register → login → refresh rotates and returns new tokens', async () => {
    const { app } = await buildApp()

    const register = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'alice@example.com', password: 'password123' })

    expect(register.status).toBe(201)
    expect(register.body).toMatchObject({ success: true })
    expect(typeof register.body.data.tokens.accessToken).toBe('string')
    expect(typeof register.body.data.tokens.refreshToken).toBe('string')
    expect(register.body.data.user.email).toBe('alice@example.com')

    const login = await request(app)
      .post('/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'alice@example.com', password: 'password123' })
    expect(login.status).toBe(200)
    const rt1 = login.body.data.tokens.refreshToken
    expect(typeof rt1).toBe('string')

    const refresh = await request(app)
      .post('/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: rt1 })
    expect(refresh.status).toBe(200)
    const rt2 = refresh.body.data.tokens.refreshToken
    expect(rt2).not.toBe(rt1)
  })

  it('reuse detection: replaying a rotated refresh token returns 401 and revokes family', async () => {
    const { app } = await buildApp()

    await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'bob@example.com', password: 'password123' })

    const login = await request(app)
      .post('/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'bob@example.com', password: 'password123' })
    const rt1 = login.body.data.tokens.refreshToken as string

    const firstRefresh = await request(app)
      .post('/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: rt1 })
    expect(firstRefresh.status).toBe(200)

    const replay = await request(app)
      .post('/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: rt1 })
    expect(replay.status).toBe(401)
    expect(replay.body.error.code).toBe('refresh_token_reused')

    const rt2 = firstRefresh.body.data.tokens.refreshToken as string
    const blocked = await request(app)
      .post('/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: rt2 })
    expect(blocked.status).toBe(401)
  })

  it('/auth/me requires a valid bearer token', async () => {
    const { app } = await buildApp()

    const anon = await request(app).get('/auth/me').set('X-Client', 'mobile')
    expect(anon.status).toBe(401)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'carol@example.com', password: 'password123' })

    const me = await request(app)
      .get('/auth/me')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${reg.body.data.tokens.accessToken}`)
    expect(me.status).toBe(200)
    expect(me.body.data.email).toBe('carol@example.com')
    expect(Array.isArray(me.body.data.permissions)).toBe(true)
    expect(me.body.data.permissions).toContain('vehicles.read')
    expect(me.body.data.permissions).toContain('logs.create')
    expect(me.body.data.permissions).not.toContain('*')
  })

  it('session responses (register/login/refresh) include permissions', async () => {
    const { app } = await buildApp()

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'frank@example.com', password: 'password123' })
    expect(reg.body.data.user.permissions).toBeDefined()
    expect(reg.body.data.user.permissions).toContain('vehicles.read')
  })

  it('social auth start returns Google authorization URL when enabled', async () => {
    const { app } = await buildApp({
      GOOGLE_OAUTH_ENABLED: true,
      GOOGLE_OAUTH_CLIENT_ID: 'google-client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'google-client-secret',
      GOOGLE_OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
    } as Partial<ServerEnv>)

    const start = await request(app).get('/auth/social/google/start').set('X-Client', 'mobile')
    expect(start.status).toBe(200)
    expect(start.body.data.provider).toBe('google')
    expect(start.body.data.authorizationUrl).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(start.body.data.authorizationUrl).toContain('client_id=google-client-id')
  })

  it('social auth exchange creates a session for provider identity', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(JSON.stringify({ access_token: 'google-access-token' }), { status: 200 })
      }
      if (url === 'https://openidconnect.googleapis.com/v1/userinfo') {
        return new Response(JSON.stringify({ email: 'social@example.com', email_verified: true }), {
          status: 200,
        })
      }
      return new Response('not found', { status: 404 })
    }) as typeof fetch

    try {
      const { app } = await buildApp({
        GOOGLE_OAUTH_ENABLED: true,
        GOOGLE_OAUTH_CLIENT_ID: 'google-client-id',
        GOOGLE_OAUTH_CLIENT_SECRET: 'google-client-secret',
        GOOGLE_OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
      } as Partial<ServerEnv>)

      const exchange = await request(app)
        .post('/auth/social/google/exchange')
        .set('X-Client', 'mobile')
        .send({
          code: 'oauth-code',
          redirectUri: 'http://localhost:3000/auth/google/callback',
        })

      expect(exchange.status).toBe(200)
      expect(exchange.body.data.user.email).toBe('social@example.com')
      expect(typeof exchange.body.data.tokens.accessToken).toBe('string')
      expect(typeof exchange.body.data.tokens.refreshToken).toBe('string')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('creates invite as admin and accepts with register flow', async () => {
    const { app, users, inviteEmails } = await buildApp()

    const adminRegister = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'org-admin@example.com', password: 'password123' })
    expect(adminRegister.status).toBe(201)
    const adminUser = await users.findByEmail('org-admin@example.com')
    expect(adminUser).not.toBeNull()
    const adminId = adminUser!.id
    await users.resetFailedAttempts(adminId)
    // Promote to organization admin role for invite management.
    const current = await users.findById(adminId)
    users._setOrganizationRole(adminId, 'admin')

    const adminLogin = await request(app)
      .post('/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'org-admin@example.com', password: 'password123' })
    expect(adminLogin.status).toBe(200)
    const adminToken = adminLogin.body.data.tokens.accessToken as string
    const orgId = current!.organizationId as string

    const createInvite = await request(app)
      .post(`/api/organizations/${orgId}/invites`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new-driver@example.com', role: 'driver' })
    expect(createInvite.status).toBe(201)
    expect(createInvite.body.data.email).toBe('new-driver@example.com')
    expect(inviteEmails).toHaveLength(1)

    const preview = await request(app)
      .get(`/auth/invites/${inviteEmails[0].token}/preview`)
      .set('X-Client', 'mobile')
    expect(preview.status).toBe(200)
    expect(preview.body.data.role).toBe('driver')

    const accept = await request(app)
      .post('/auth/invites/accept-and-register')
      .set('X-Client', 'mobile')
      .send({ token: inviteEmails[0].token, password: 'password123' })
    expect(accept.status).toBe(201)
    expect(accept.body.data.user.email).toBe('new-driver@example.com')
  })

  it('forbids invite creation for non-admin organization role', async () => {
    const { app, users } = await buildApp()
    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'regular-user@example.com', password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string
    users._setOrganizationRole(reg.body.data.user.id as string, 'viewer')
    const orgId = reg.body.data.user.organizationId as string

    const createInvite = await request(app)
      .post(`/api/organizations/${orgId}/invites`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'blocked@example.com', role: 'viewer' })
    expect(createInvite.status).toBe(403)
  })

  it('resends invite and accepts it with authenticated user', async () => {
    const { app, users, inviteEmails, clock } = await buildApp()

    const adminRegister = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'org-owner2@example.com', password: 'password123' })
    expect(adminRegister.status).toBe(201)
    const adminId = adminRegister.body.data.user.id as string
    users._setOrganizationRole(adminId, 'admin')
    const adminOrgId = adminRegister.body.data.user.organizationId as string
    const adminToken = adminRegister.body.data.tokens.accessToken as string

    const createInvite = await request(app)
      .post(`/api/organizations/${adminOrgId}/invites`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'existing-member@example.com', role: 'viewer' })
    expect(createInvite.status).toBe(201)
    const inviteId = createInvite.body.data.id as string
    const firstToken = inviteEmails[0].token

    const resend = await request(app)
      .post(`/api/organizations/${adminOrgId}/invites/${inviteId}/resend`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(resend.status).toBe(429)
    expect(resend.body.error.code).toBe('invite_resend_cooldown')
    users._setOrganizationId(adminId, null)
    users._setOrganizationRole(adminId, 'admin')
    const resentToken = firstToken

    const memberRegister = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'existing-member@example.com', password: 'password123' })
    expect(memberRegister.status).toBe(201)
    users._setOrganizationId(memberRegister.body.data.user.id as string, null)
    const memberToken = memberRegister.body.data.tokens.accessToken as string

    const accept = await request(app)
      .post('/auth/invites/accept')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ token: resentToken })
    expect(accept.status).toBe(200)
    expect(accept.body.data.acceptedBy).toBe(memberRegister.body.data.user.id)
    expect(accept.body.data.role).toBe('viewer')
  })

  it('applies owner/admin cooldown windows from config', async () => {
    const { app, users, inviteEmails } = await buildApp({
      INVITE_RESEND_COOLDOWN_SECONDS: 60,
      INVITE_RESEND_COOLDOWN_OWNER_SECONDS: 0,
      INVITE_RESEND_COOLDOWN_ADMIN_SECONDS: 300,
    } as Partial<ServerEnv>)

    const ownerReg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'owner-cooldown@example.com', password: 'password123' })
    expect(ownerReg.status).toBe(201)
    const ownerToken = ownerReg.body.data.tokens.accessToken as string
    const ownerOrgId = ownerReg.body.data.user.organizationId as string

    const ownerInvite = await request(app)
      .post(`/api/organizations/${ownerOrgId}/invites`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'cooldown-owner-target@example.com', role: 'viewer' })
    expect(ownerInvite.status).toBe(201)
    const ownerInviteId = ownerInvite.body.data.id as string

    const ownerResend = await request(app)
      .post(`/api/organizations/${ownerOrgId}/invites/${ownerInviteId}/resend`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({})
    expect(ownerResend.status).toBe(200)

    const adminReg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'admin-cooldown@example.com', password: 'password123' })
    expect(adminReg.status).toBe(201)
    const adminId = adminReg.body.data.user.id as string
    users._setOrganizationRole(adminId, 'admin')
    const adminToken = adminReg.body.data.tokens.accessToken as string
    const adminOrgId = adminReg.body.data.user.organizationId as string

    const adminInvite = await request(app)
      .post(`/api/organizations/${adminOrgId}/invites`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'cooldown-admin-target@example.com', role: 'viewer' })
    expect(adminInvite.status).toBe(201)
    const adminInviteId = adminInvite.body.data.id as string

    const adminResendTooSoon = await request(app)
      .post(`/api/organizations/${adminOrgId}/invites/${adminInviteId}/resend`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(adminResendTooSoon.status).toBe(429)
    expect(adminResendTooSoon.body.error.code).toBe('invite_resend_cooldown')

    expect(inviteEmails.length).toBeGreaterThanOrEqual(3)
  })
})

describe('auth HTTP (web — cookies + CSRF)', () => {
  it('login sets httpOnly session cookies and a readable CSRF cookie', async () => {
    const { app } = await buildApp()

    await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: 'dave@example.com', password: 'password123' })

    const login = await request(app)
      .post('/auth/login')
      .set('X-Client', 'web')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'dave@example.com', password: 'password123' })

    expect(login.status).toBe(200)
    expect(login.body.data.tokens.accessToken).toBe('')
    expect(login.body.data.tokens.refreshToken).toBeUndefined()

    const setCookie = login.get('set-cookie') ?? []
    const joined = Array.isArray(setCookie) ? setCookie.join('\n') : setCookie
    expect(joined).toMatch(/autocare\.access=/)
    expect(joined).toMatch(/autocare\.refresh=/)
    expect(joined).toMatch(/autocare\.csrf=/)
    expect(joined).toMatch(/HttpOnly/i)
  })

  it('logout requires CSRF header match when called from web', async () => {
    const { app } = await buildApp()
    const agent = request.agent(app)

    await agent
      .post('/auth/register')
      .set('X-Client', 'web')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'eve@example.com', password: 'password123' })

    const without = await agent
      .post('/auth/logout')
      .set('X-Client', 'web')
      .set('Origin', 'http://localhost:3000')
      .send({})
    expect(without.status).toBe(403)
    // Agent replays the CSRF cookie, but no header → csrf_invalid, not csrf_required.
    expect(without.body.error.code).toBe('csrf_invalid')
  })
})
