import type { ServerEnv } from '@autocare/config/server'
import { users } from '@autocare/db'
import cookieParser from 'cookie-parser'
import { eq } from 'drizzle-orm'
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
import { createVehicleRouter } from '../interfaces/http/vehicle-routes.js'

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

const buildVehicleApp = async (db: NodePgDatabase) => {
  const env = makeEnv()
  const clock = createFakeClock(new Date('2026-04-17T10:00:00.000Z'))
  const users = createInMemoryUserRepo()
  const refreshTokens = createInMemoryRefreshRepo()

  const authModule = await createAuthModule(env, {
    clock,
    users,
    refreshTokens,
    db,
  })

  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', createAuthRouter(authModule))
  app.use('/api', createVehicleRouter(authModule))
  app.use(errorHandler)

  return { app, authModule }
}

describe('vehicle HTTP (auth required)', () => {
  it('returns 401 for maintenance create without bearer token', async () => {
    const authModule = await createAuthModule(makeEnv(), {
      clock: createFakeClock(),
      users: createInMemoryUserRepo(),
      refreshTokens: createInMemoryRefreshRepo(),
      db: {} as NodePgDatabase,
    })
    const app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/auth', createAuthRouter(authModule))
    app.use('/api', createVehicleRouter(authModule))
    app.use(errorHandler)

    const res = await request(app)
      .post('/api/vehicles/00000000-0000-4000-8000-000000000001/maintenance')
      .set('X-Client', 'mobile')
      .send({ odometer: 1000, category: 'oil' })

    expect(res.status).toBe(401)
  })

  it('returns 401 for vehicle lock without bearer token', async () => {
    const authModule = await createAuthModule(makeEnv(), {
      clock: createFakeClock(),
      users: createInMemoryUserRepo(),
      refreshTokens: createInMemoryRefreshRepo(),
      db: {} as NodePgDatabase,
    })
    const app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/auth', createAuthRouter(authModule))
    app.use('/api', createVehicleRouter(authModule))
    app.use(errorHandler)

    const res = await request(app)
      .post('/api/vehicles/00000000-0000-4000-8000-000000000001/lock')
      .set('X-Client', 'mobile')
      .send({})

    expect(res.status).toBe(401)
  })
})

describe.skipIf(!process.env.DATABASE_URL)('vehicle HTTP (with database)', () => {
  it('register → create vehicle → create maintenance → list logs', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildVehicleApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `vehicle-it-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const created = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Skoda',
        model: 'Octavia',
        year: 2020,
        vin: `VIN${Date.now().toString(36)}`,
      })
    expect(created.status).toBe(201)
    const vehicleId = created.body.data.id as string

    const maint = await request(app)
      .post(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ odometer: 12000, category: 'Oil change', description: 'Full synthetic' })
    expect(maint.status).toBe(201)
    expect(typeof maint.body.data.integrityHash).toBe('string')

    const list = await request(app)
      .get(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(list.status).toBe(200)
    expect(list.body.data.items.length).toBe(1)
    expect(list.body.data.items[0].category).toBe('Oil change')
  })

  it('enforces org ownership: another user cannot read your vehicle', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildVehicleApp(db)

    const ownerReg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `vehicle-owner-${Date.now()}@example.com`, password: 'password123' })
    expect(ownerReg.status).toBe(201)
    const ownerToken = ownerReg.body.data.tokens.accessToken as string

    const vehicleRes = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        make: 'Volkswagen',
        model: 'Golf',
        year: 2019,
        vin: `VW${Date.now().toString(36)}`,
      })
    expect(vehicleRes.status).toBe(201)
    const vehicleId = vehicleRes.body.data.id as string

    const strangerReg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `vehicle-stranger-${Date.now()}@example.com`, password: 'password123' })
    expect(strangerReg.status).toBe(201)
    const strangerToken = strangerReg.body.data.tokens.accessToken as string

    const forbiddenRead = await request(app)
      .get(`/api/vehicles/${vehicleId}`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${strangerToken}`)

    // Implementation returns not_found for cross-org resources to avoid leakage.
    expect(forbiddenRead.status).toBe(404)
  })

  it('updates vehicle fields through PUT /api/vehicles/:id', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildVehicleApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `vehicle-update-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const created = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Dacia',
        model: 'Logan',
        year: 2018,
        vin: `DC${Date.now().toString(36)}`,
      })
    expect(created.status).toBe(201)
    const vehicleId = created.body.data.id as string

    const updated = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        model: 'Logan MCV',
        currentOdometer: 87500,
      })
    expect(updated.status).toBe(200)
    expect(updated.body.data.model).toBe('Logan MCV')
    expect(updated.body.data.currentOdometer).toBe(87500)
  })

  it('denies maintenance update when vehicle is locked', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildVehicleApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `maintenance-lock-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Renault',
        model: 'Clio',
        year: 2021,
        vin: `RN${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const createdMaintenance = await request(app)
      .post(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        odometer: 15000,
        category: 'Inspection',
        description: 'Initial annual inspection',
      })
    expect(createdMaintenance.status).toBe(201)

    const listMaintenance = await request(app)
      .get(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(listMaintenance.status).toBe(200)
    const maintenanceId = listMaintenance.body.data.items[0].id as string

    const lockRes = await request(app)
      .post(`/api/vehicles/${vehicleId}/lock`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(lockRes.status).toBe(200)
    expect(lockRes.body.data.locked).toBe(true)

    const denied = await request(app)
      .put(`/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Attempted edit while locked' })

    expect(denied.status).toBe(403)
    expect(denied.body.reasonCode).toBe('LOCK_OVERRIDE_REQUIRED')
  })

  it('creates and lists vehicle documents for timeline evidence', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildVehicleApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `vehicle-docs-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Peugeot',
        model: '308',
        year: 2022,
        vin: `PG${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const createdMaintenance = await request(app)
      .post(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        odometer: 20000,
        category: 'Inspection',
        description: 'Bi-annual inspection',
      })
    expect(createdMaintenance.status).toBe(201)

    const maintenanceList = await request(app)
      .get(`/api/vehicles/${vehicleId}/maintenance`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(maintenanceList.status).toBe(200)
    const maintenanceId = maintenanceList.body.data.items[0].id as string

    const createdDocument = await request(app)
      .post(`/api/vehicles/${vehicleId}/documents`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        maintenanceLogId: maintenanceId,
        type: 'invoice',
        title: 'Inspection invoice',
        storageKey: `org/test/${vehicleId}/invoice.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 156000,
      })
    expect(createdDocument.status).toBe(201)
    expect(createdDocument.body.data.vehicleId).toBe(vehicleId)
    expect(createdDocument.body.data.type).toBe('invoice')
    expect(createdDocument.body.data.maintenanceLogId).toBe(maintenanceId)

    const listDocuments = await request(app)
      .get(`/api/vehicles/${vehicleId}/documents`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
    expect(listDocuments.status).toBe(200)
    expect(listDocuments.body.data.items).toHaveLength(1)
    expect(listDocuments.body.data.items[0].title).toBe('Inspection invoice')
  })

  it('rejects invalid enum value for document type', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildVehicleApp(db)

    const reg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `vehicle-invalid-enum-${Date.now()}@example.com`, password: 'password123' })
    expect(reg.status).toBe(201)
    const token = reg.body.data.tokens.accessToken as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Toyota',
        model: 'Corolla',
        year: 2023,
        vin: `TY${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const invalidType = await request(app)
      .post(`/api/vehicles/${vehicleId}/documents`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'warrantyx',
        title: 'Unsupported type',
        storageKey: `org/test/${vehicleId}/bad.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 999,
      })

    expect(invalidType.status).toBe(400)
  })

  it('requires admin permission to assign vehicle members', async () => {
    const db = getAuthDb(process.env.DATABASE_URL as string)
    const { app } = await buildVehicleApp(db)

    const ownerReg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `member-owner-${Date.now()}@example.com`, password: 'password123' })
    expect(ownerReg.status).toBe(201)
    const ownerToken = ownerReg.body.data.tokens.accessToken as string
    const ownerId = ownerReg.body.data.user.id as string
    const ownerOrgId = ownerReg.body.data.user.organizationId as string

    const createdVehicle = await request(app)
      .post('/api/vehicles')
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        make: 'Ford',
        model: 'Focus',
        year: 2020,
        vin: `FD${Date.now().toString(36)}`,
      })
    expect(createdVehicle.status).toBe(201)
    const vehicleId = createdVehicle.body.data.id as string

    const memberReg = await request(app)
      .post('/auth/register')
      .set('X-Client', 'mobile')
      .send({ email: `member-driver-${Date.now()}@example.com`, password: 'password123' })
    expect(memberReg.status).toBe(201)
    const memberId = memberReg.body.data.user.id as string

    await db.update(users).set({ organizationId: ownerOrgId }).where(eq(users.id, memberId))

    const forbidden = await request(app)
      .put(`/api/vehicles/${vehicleId}/members`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberId, role: 'driver' })
    expect(forbidden.status).toBe(403)

    await db.update(users).set({ role: 'admin' }).where(eq(users.id, ownerId))

    const ownerLogin = await request(app)
      .post('/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: ownerReg.body.data.user.email as string, password: 'password123' })
    expect(ownerLogin.status).toBe(200)
    const adminToken = ownerLogin.body.data.tokens.accessToken as string

    const assigned = await request(app)
      .put(`/api/vehicles/${vehicleId}/members`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId, role: 'driver' })
    expect(assigned.status).toBe(200)
    expect(assigned.body.data.userId).toBe(memberId)
    expect(assigned.body.data.role).toBe('driver')

    const listed = await request(app)
      .get(`/api/vehicles/${vehicleId}/members`)
      .set('X-Client', 'mobile')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(listed.status).toBe(200)
    expect(listed.body.data.items).toHaveLength(1)
    expect(listed.body.data.items[0].userId).toBe(memberId)
  })
})
