import { beforeEach, describe, expect, it } from 'vitest'
import { createLoginUseCase } from '../application/login-use-case.js'
import { createRefreshUseCase } from '../application/refresh-use-case.js'
import { createRegisterUseCase } from '../application/register-use-case.js'
import { createSessionService } from '../application/session-service.js'
import type { Clock } from '../infrastructure/clock.js'
import { createJwtSigner, type JwtSigner } from '../infrastructure/jwt-signer.js'
import {
  createPasswordHasher,
  createPasswordPolicy,
  type PasswordHasher,
  type PasswordPolicy,
} from '../infrastructure/password-hasher.js'
import { createTokenGenerator, type TokenGenerator } from '../infrastructure/token-generator.js'
import {
  createFakeClock,
  createInMemoryRefreshRepo,
  createInMemoryUserRepo,
} from './test-helpers.js'

const authConfig = {
  jwt: {
    algorithm: 'HS256' as const,
    secret: 'a'.repeat(48),
    privateKey: undefined,
    publicKey: undefined,
    accessTtlSeconds: 900,
    issuer: 'autocare-api',
    audience: 'autocare',
  },
  refresh: {
    ttlDays: 30,
    rotate: true,
    detectReuse: true,
    inactivityDays: 7,
    absoluteMaxDays: 90,
    graceSeconds: 10,
  },
  password: {
    minLength: 8,
    requireMixedCase: false,
    requireDigit: false,
    requireSymbol: false,
    argon2TimeCost: 1,
    argon2MemoryCostKib: 4096,
    argon2Parallelism: 1,
  },
  login: {
    maxFailedAttempts: 5,
    lockoutMinutes: 15,
  },
  social: {
    google: {
      enabled: false,
      clientId: undefined,
      clientSecret: undefined,
      redirectUri: undefined,
    },
  },
  invites: {
    linkBaseUrl: 'http://localhost:3000',
    fromEmail: 'noreply@autocare.local',
    defaultExpiresDays: 7,
    resendCooldownSeconds: 60,
    resendCooldownOwnerSeconds: 45,
    resendCooldownAdminSeconds: 60,
  },
}

const baseMeta = { userAgent: 'ua', ipAddress: '127.0.0.1', clientKind: 'web' as const }

const buildSystem = async (clock: Clock, overrides: Partial<typeof authConfig.refresh> = {}) => {
  const users = createInMemoryUserRepo()
  const refreshTokens = createInMemoryRefreshRepo()
  const tokenGenerator: TokenGenerator = createTokenGenerator()
  const jwtSigner: JwtSigner = await createJwtSigner(authConfig.jwt, clock)
  const passwordHasher: PasswordHasher = createPasswordHasher(authConfig.password)
  const passwordPolicy: PasswordPolicy = createPasswordPolicy(authConfig.password)
  const refreshConfig = { ...authConfig.refresh, ...overrides }
  const sessionService = createSessionService({
    config: { ...authConfig, refresh: refreshConfig },
    jwtSigner,
    tokenGenerator,
    refreshTokens,
    clock,
  })
  const register = createRegisterUseCase({
    userRepository: users,
    passwordHasher,
    passwordPolicy,
    sessionService,
  })
  const login = createLoginUseCase({
    loginConfig: authConfig.login,
    clock,
    userRepository: users,
    passwordHasher,
    sessionService,
  })
  const refresh = createRefreshUseCase({
    refreshConfig,
    clock,
    tokenGenerator,
    refreshTokens,
    users,
    sessionService,
  })
  return { users, refreshTokens, jwtSigner, sessionService, register, login, refresh }
}

describe('refresh flow', () => {
  let clock: ReturnType<typeof createFakeClock>

  beforeEach(() => {
    clock = createFakeClock(new Date('2026-04-17T10:00:00.000Z'))
  })

  it('registers → issues access+refresh → rotates on refresh (happy path)', async () => {
    const sys = await buildSystem(clock)
    const reg = await sys.register(
      { email: 'alice@example.com', password: 'password123' },
      baseMeta,
    )

    expect(reg.user.email).toBe('alice@example.com')
    expect(reg.access.token.split('.').length).toBe(3)
    expect(reg.refresh.rawToken.length).toBeGreaterThan(60)

    clock.advance(60_000)
    const r1 = await sys.refresh(reg.refresh.rawToken, baseMeta)
    expect(r1.refresh.rawToken).not.toBe(reg.refresh.rawToken)
    expect(r1.refresh.id).not.toBe(reg.refresh.id)
    expect(r1.refresh.familyId).toBe(reg.refresh.familyId)

    const oldRecord = sys.refreshTokens._byId(reg.refresh.id)
    expect(oldRecord?.revokedAt).toBeInstanceOf(Date)
    expect(oldRecord?.revokedReason).toBe('rotated')
    expect(oldRecord?.replacedByTokenId).toBe(r1.refresh.id)
  })

  it('detects reuse of rotated token and revokes whole family', async () => {
    const sys = await buildSystem(clock, { graceSeconds: 0 })
    const reg = await sys.register({ email: 'bob@example.com', password: 'password123' }, baseMeta)

    clock.advance(60_000)
    const r1 = await sys.refresh(reg.refresh.rawToken, baseMeta)

    clock.advance(60_000)
    await expect(sys.refresh(reg.refresh.rawToken, baseMeta)).rejects.toMatchObject({
      code: 'refresh_token_reused',
    })

    const current = sys.refreshTokens._byId(r1.refresh.id)
    expect(current?.revokedAt).toBeInstanceOf(Date)
    expect(current?.revokedReason).toBe('reuse_detected')
  })

  it('accepts a just-rotated token inside the grace window without revoking family', async () => {
    const sys = await buildSystem(clock, { graceSeconds: 10 })
    const reg = await sys.register(
      { email: 'carol@example.com', password: 'password123' },
      baseMeta,
    )

    clock.advance(60_000)
    await sys.refresh(reg.refresh.rawToken, baseMeta)

    clock.advance(5_000)
    await expect(sys.refresh(reg.refresh.rawToken, baseMeta)).resolves.toBeDefined()
  })

  it('rejects an expired refresh token', async () => {
    const sys = await buildSystem(clock, { ttlDays: 1 })
    const reg = await sys.register({ email: 'dave@example.com', password: 'password123' }, baseMeta)

    clock.advance(2 * 24 * 60 * 60 * 1000)
    await expect(sys.refresh(reg.refresh.rawToken, baseMeta)).rejects.toMatchObject({
      code: 'refresh_token_expired',
    })
  })

  it('rejects a token whose absolute max age has elapsed', async () => {
    const sys = await buildSystem(clock, { ttlDays: 30, absoluteMaxDays: 1 })
    const reg = await sys.register({ email: 'eve@example.com', password: 'password123' }, baseMeta)

    clock.advance(2 * 24 * 60 * 60 * 1000)
    await expect(sys.refresh(reg.refresh.rawToken, baseMeta)).rejects.toMatchObject({
      code: 'session_expired',
    })
  })

  it('rejects unknown tokens as invalid (not reuse)', async () => {
    const sys = await buildSystem(clock)
    await expect(sys.refresh('not-a-real-token', baseMeta)).rejects.toMatchObject({
      code: 'refresh_token_invalid',
    })
  })
})

describe('login lockout', () => {
  it('locks the account after configured failed attempts and rejects further logins', async () => {
    const clock = createFakeClock()
    const sys = await buildSystem(clock)
    await sys.register({ email: 'frank@example.com', password: 'password123' }, baseMeta)

    for (let i = 0; i < authConfig.login.maxFailedAttempts; i += 1) {
      await expect(
        sys.login({ email: 'frank@example.com', password: 'WRONG' }, baseMeta),
      ).rejects.toMatchObject({ code: 'invalid_credentials' })
    }

    await expect(
      sys.login({ email: 'frank@example.com', password: 'password123' }, baseMeta),
    ).rejects.toMatchObject({ code: 'account_locked' })
  })
})
