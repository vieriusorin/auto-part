import { faker } from '@faker-js/faker'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { Pool, type PoolClient } from 'pg'

loadDotenv({ path: resolve(process.cwd(), '.env') })
loadDotenv({ path: resolve(process.cwd(), '../../.env') })

const databaseUrl = process.env.DATABASE_URL
if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  console.error('DATABASE_URL is required for db seed.')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })
faker.seed(20260421)

const now = new Date()
const day = 24 * 60 * 60 * 1000

type SeedUser = {
  id: string
  email: string
  role: 'user' | 'admin'
  organizationRole: 'owner' | 'admin' | 'manager' | 'driver' | 'viewer'
  organizationId: string
  planOverride: 'free' | 'premium' | null
  sessionId: string
  deviceId: string
  platform: 'ios' | 'android'
  country: string
  channel: string
}

const users: SeedUser[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'owner@fleetalpha.test',
    role: 'admin',
    organizationRole: 'owner',
    organizationId: 'org-fleet-alpha',
    planOverride: null,
    sessionId: 'session-alpha-owner',
    deviceId: 'device-alpha-owner',
    platform: 'ios',
    country: 'RO',
    channel: 'organic',
  },
  {
    id: '11111111-1111-4111-8111-111111111112',
    email: 'manager@fleetalpha.test',
    role: 'user',
    organizationRole: 'manager',
    organizationId: 'org-fleet-alpha',
    planOverride: null,
    sessionId: 'session-alpha-manager',
    deviceId: 'device-alpha-manager',
    platform: 'android',
    country: 'RO',
    channel: 'referral',
  },
  {
    id: '11111111-1111-4111-8111-111111111113',
    email: 'driver@fleetalpha.test',
    role: 'user',
    organizationRole: 'driver',
    organizationId: 'org-fleet-alpha',
    planOverride: null,
    sessionId: 'session-alpha-driver',
    deviceId: 'device-alpha-driver',
    platform: 'android',
    country: 'RO',
    channel: 'ads',
  },
  {
    id: '11111111-1111-4111-8111-111111111114',
    email: 'owner@familybeta.test',
    role: 'user',
    organizationRole: 'owner',
    organizationId: 'org-family-beta',
    planOverride: null,
    sessionId: 'session-beta-owner',
    deviceId: 'device-beta-owner',
    platform: 'ios',
    country: 'DE',
    channel: 'organic',
  },
  {
    id: '11111111-1111-4111-8111-111111111115',
    email: 'viewer@familybeta.test',
    role: 'user',
    organizationRole: 'viewer',
    organizationId: 'org-family-beta',
    planOverride: 'premium',
    sessionId: 'session-beta-viewer',
    deviceId: 'device-beta-viewer',
    platform: 'ios',
    country: 'DE',
    channel: 'referral',
  },
  {
    id: '11111111-1111-4111-8111-111111111116',
    email: 'standalone@solo.test',
    role: 'user',
    organizationRole: 'owner',
    organizationId: 'org-solo',
    planOverride: 'free',
    sessionId: 'session-solo',
    deviceId: 'device-solo',
    platform: 'android',
    country: 'IT',
    channel: 'organic',
  },
]

const organizations = [
  { id: 'org-fleet-alpha', plan: 'premium' as const },
  { id: 'org-family-beta', plan: 'free' as const },
  { id: 'org-solo', plan: 'free' as const },
]

const vehicles = [
  {
    id: '22222222-2222-4222-8222-222222222221',
    organizationId: 'org-fleet-alpha',
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: 'WDB11111111111111',
    plate: 'B-101-AAA',
    euroStandard: 'Euro6',
    currentOdometer: 84500,
    isLocked: false,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    organizationId: 'org-fleet-alpha',
    make: 'Ford',
    model: 'Transit',
    year: 2019,
    vin: 'WDB22222222222222',
    plate: 'B-202-BBB',
    euroStandard: 'Euro6',
    currentOdometer: 121300,
    isLocked: false,
  },
  {
    id: '22222222-2222-4222-8222-222222222223',
    organizationId: 'org-family-beta',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2018,
    vin: 'WDB33333333333333',
    plate: 'M-303-CCC',
    euroStandard: 'Euro5',
    currentOdometer: 93200,
    isLocked: true,
  },
]

const maintenanceLogs = [
  {
    id: '33333333-3333-4333-8333-333333333331',
    vehicleId: vehicles[0].id,
    date: new Date(now.getTime() - 90 * day),
    odometer: 79000,
    category: 'oil-change',
    description: 'Oil + filter replacement',
    totalCost: 540,
  },
  {
    id: '33333333-3333-4333-8333-333333333332',
    vehicleId: vehicles[0].id,
    date: new Date(now.getTime() - 30 * day),
    odometer: 83000,
    category: 'brakes',
    description: 'Front pads and fluid',
    totalCost: 1200,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    vehicleId: vehicles[1].id,
    date: new Date(now.getTime() - 45 * day),
    odometer: 118000,
    category: 'tires',
    description: 'Winter tire set',
    totalCost: 2800,
  },
  {
    id: '33333333-3333-4333-8333-333333333334',
    vehicleId: vehicles[2].id,
    date: new Date(now.getTime() - 15 * day),
    odometer: 92800,
    category: 'inspection',
    description: 'Annual technical inspection',
    totalCost: 350,
  },
]

const reminders = [
  {
    id: '44444444-4444-4444-8444-444444444441',
    vehicleId: vehicles[0].id,
    organizationId: vehicles[0].organizationId,
    title: 'Oil service',
    notes: 'Every 10k km',
    frequencyType: 'miles',
    intervalValue: 10000,
    dueAt: null as Date | null,
    dueOdometer: 90000,
    status: 'upcoming',
    deferredUntil: null as Date | null,
  },
  {
    id: '44444444-4444-4444-8444-444444444442',
    vehicleId: vehicles[1].id,
    organizationId: vehicles[1].organizationId,
    title: 'Brake inspection',
    notes: 'Fleet safety review',
    frequencyType: 'days',
    intervalValue: 120,
    dueAt: new Date(now.getTime() - 2 * day),
    dueOdometer: null as number | null,
    status: 'due_now',
    deferredUntil: null as Date | null,
  },
  {
    id: '44444444-4444-4444-8444-444444444443',
    vehicleId: vehicles[2].id,
    organizationId: vehicles[2].organizationId,
    title: 'Insurance renewal',
    notes: 'Family car policy',
    frequencyType: 'days',
    intervalValue: 365,
    dueAt: new Date(now.getTime() + 25 * day),
    dueOdometer: null as number | null,
    status: 'deferred',
    deferredUntil: new Date(now.getTime() + 10 * day),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    vehicleId: vehicles[0].id,
    organizationId: vehicles[0].organizationId,
    title: 'Cabin filter',
    notes: null,
    frequencyType: 'days',
    intervalValue: 180,
    dueAt: new Date(now.getTime() - 20 * day),
    dueOdometer: null as number | null,
    status: 'done',
    deferredUntil: null as Date | null,
  },
]

const members = [
  {
    id: '55555555-5555-4555-8555-555555555551',
    vehicleId: vehicles[0].id,
    organizationId: vehicles[0].organizationId,
    userId: users[0].id,
    role: 'owner',
    assignedBy: users[0].id,
  },
  {
    id: '55555555-5555-4555-8555-555555555552',
    vehicleId: vehicles[0].id,
    organizationId: vehicles[0].organizationId,
    userId: users[1].id,
    role: 'manager',
    assignedBy: users[0].id,
  },
  {
    id: '55555555-5555-4555-8555-555555555553',
    vehicleId: vehicles[1].id,
    organizationId: vehicles[1].organizationId,
    userId: users[2].id,
    role: 'driver',
    assignedBy: users[1].id,
  },
  {
    id: '55555555-5555-4555-8555-555555555554',
    vehicleId: vehicles[2].id,
    organizationId: vehicles[2].organizationId,
    userId: users[4].id,
    role: 'viewer',
    assignedBy: users[3].id,
  },
] as const

const documents = [
  {
    id: '66666666-6666-4666-8666-666666666661',
    vehicleId: vehicles[0].id,
    organizationId: vehicles[0].organizationId,
    maintenanceLogId: maintenanceLogs[0].id,
    type: 'invoice',
    title: 'Oil service invoice',
    storageKey: 'seed/docs/invoice-oil-alpha.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 348112,
    uploadedBy: users[1].id,
  },
  {
    id: '66666666-6666-4666-8666-666666666662',
    vehicleId: vehicles[1].id,
    organizationId: vehicles[1].organizationId,
    maintenanceLogId: maintenanceLogs[2].id,
    type: 'photo',
    title: 'Tire replacement photos',
    storageKey: 'seed/docs/tires-transit.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 821334,
    uploadedBy: users[2].id,
  },
  {
    id: '66666666-6666-4666-8666-666666666663',
    vehicleId: vehicles[2].id,
    organizationId: vehicles[2].organizationId,
    maintenanceLogId: null as string | null,
    type: 'insurance',
    title: 'Insurance policy 2026',
    storageKey: 'seed/docs/insurance-golf.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 252004,
    uploadedBy: users[3].id,
  },
]

const invites = [
  {
    id: '77777777-7777-4777-8777-777777777771',
    organizationId: 'org-fleet-alpha',
    email: 'newdriver@fleetalpha.test',
    role: 'driver',
    tokenHash: 'invite-token-hash-alpha-driver',
    expiresAt: new Date(now.getTime() + 7 * day),
    acceptedAt: null as Date | null,
    revokedAt: null as Date | null,
    invitedBy: users[0].id,
    acceptedBy: null as string | null,
  },
  {
    id: '77777777-7777-4777-8777-777777777772',
    organizationId: 'org-family-beta',
    email: users[4].email,
    role: 'viewer',
    tokenHash: 'invite-token-hash-beta-viewer',
    expiresAt: new Date(now.getTime() + 3 * day),
    acceptedAt: new Date(now.getTime() - day),
    revokedAt: null as Date | null,
    invitedBy: users[3].id,
    acceptedBy: users[4].id,
  },
  {
    id: '77777777-7777-4777-8777-777777777773',
    organizationId: 'org-fleet-alpha',
    email: 'oldadmin@fleetalpha.test',
    role: 'admin',
    tokenHash: 'invite-token-hash-alpha-admin-revoked',
    expiresAt: new Date(now.getTime() - 5 * day),
    acceptedAt: null as Date | null,
    revokedAt: new Date(now.getTime() - 4 * day),
    invitedBy: users[0].id,
    acceptedBy: null as string | null,
  },
]

const refreshTokens = [
  {
    id: '88888888-8888-4888-8888-888888888881',
    userId: users[0].id,
    familyId: '88888888-8888-4888-8888-888888888890',
    tokenHash: 'rt-hash-alpha-1',
    issuedAt: new Date(now.getTime() - 20 * day),
    lastUsedAt: new Date(now.getTime() - day),
    expiresAt: new Date(now.getTime() + 10 * day),
    absoluteExpiresAt: new Date(now.getTime() + 70 * day),
    replacedByTokenId: '88888888-8888-4888-8888-888888888882',
    revokedAt: null as Date | null,
    revokedReason: null as string | null,
    userAgent: 'Seed iOS Client/1.4.2',
    ipAddress: '10.10.0.10',
    clientKind: 'mobile',
  },
  {
    id: '88888888-8888-4888-8888-888888888882',
    userId: users[0].id,
    familyId: '88888888-8888-4888-8888-888888888890',
    tokenHash: 'rt-hash-alpha-2',
    issuedAt: new Date(now.getTime() - day),
    lastUsedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 20 * day),
    absoluteExpiresAt: new Date(now.getTime() + 70 * day),
    replacedByTokenId: null as string | null,
    revokedAt: null as Date | null,
    revokedReason: null as string | null,
    userAgent: 'Seed iOS Client/1.4.3',
    ipAddress: '10.10.0.11',
    clientKind: 'mobile',
  },
  {
    id: '88888888-8888-4888-8888-888888888883',
    userId: users[5].id,
    familyId: '88888888-8888-4888-8888-888888888891',
    tokenHash: 'rt-hash-solo-revoked',
    issuedAt: new Date(now.getTime() - 40 * day),
    lastUsedAt: new Date(now.getTime() - 30 * day),
    expiresAt: new Date(now.getTime() - 5 * day),
    absoluteExpiresAt: new Date(now.getTime() + 30 * day),
    replacedByTokenId: null as string | null,
    revokedAt: new Date(now.getTime() - 25 * day),
    revokedReason: 'reuse_detected',
    userAgent: 'Seed Android Client/1.3.9',
    ipAddress: '10.10.0.20',
    clientKind: 'mobile',
  },
]

const banners = [
  {
    id: '99999999-9999-4999-8999-999999999991',
    key: 'expire-vignette:v1',
    title: 'Vignette expires soon',
    message: 'Renew your vignette before expiry to avoid penalties.',
    severity: 'warning',
    ctaLabel: 'Renew now',
    ctaUrl: 'https://autocare.app/vignette',
    startsAt: new Date(now.getTime() - 2 * day),
    endsAt: new Date(now.getTime() + 30 * day),
    isActive: true,
  },
  {
    id: '99999999-9999-4999-8999-999999999992',
    key: 'upload-docs:v1',
    title: 'Upload your service invoice',
    message: 'Attach invoices to keep maintenance history complete.',
    severity: 'info',
    ctaLabel: 'Upload',
    ctaUrl: 'https://autocare.app/garage/documents',
    startsAt: new Date(now.getTime() - 10 * day),
    endsAt: new Date(now.getTime() + 10 * day),
    isActive: true,
  },
  {
    id: '99999999-9999-4999-8999-999999999993',
    key: 'premium-upsell:v2',
    title: 'Unlock premium reminders',
    message: 'Enable advanced reminder automation and analytics.',
    severity: 'critical',
    ctaLabel: 'See plans',
    ctaUrl: 'https://autocare.app/pricing',
    startsAt: new Date(now.getTime() - 5 * day),
    endsAt: new Date(now.getTime() + 45 * day),
    isActive: true,
  },
]

const bannerDismissals = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    userId: users[1].id,
    bannerKey: banners[0].key,
    dismissedAt: new Date(now.getTime() - day),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    userId: users[4].id,
    bannerKey: banners[2].key,
    dismissedAt: new Date(now.getTime() - 2 * day),
  },
]

const analyticsEvents = Array.from({ length: 36 }, (_, idx) => {
  const user = users[idx % users.length]
  const occurred = new Date(now.getTime() - (idx + 1) * 3 * 60 * 60 * 1000)
  const eventNames = [
    'onboarding.started',
    'onboarding.completed',
    'vehicle.created',
    'maintenance_item.created',
    'maintenance_action.completed',
    'banner.viewed',
  ]
  return {
    id: faker.string.uuid(),
    eventId: `evt-seed-${idx + 1}`,
    eventName: eventNames[idx % eventNames.length],
    occurredAtClient: occurred,
    receivedAtServer: new Date(occurred.getTime() + 30_000),
    userId: user.id,
    sessionId: user.sessionId,
    deviceId: user.deviceId,
    platform: user.platform,
    country: user.country,
    channel: user.channel,
    appVersion: `1.${(idx % 4) + 1}.${idx % 10}`,
    schemaVersion: 1,
    integrityValid: 1,
  }
})

const dailyRollups = [
  { date: '2026-04-18', country: 'RO', platform: 'ios', channel: 'organic', a: 4, d1: 2, d7: 1, d30: 0, wau: 18, mau: 41, m: 6 },
  {
    date: '2026-04-19',
    country: 'RO',
    platform: 'android',
    channel: 'ads',
    a: 3,
    d1: 1,
    d7: 1,
    d30: 0,
    wau: 12,
    mau: 28,
    m: 4,
  },
  {
    date: '2026-04-20',
    country: 'DE',
    platform: 'ios',
    channel: 'referral',
    a: 2,
    d1: 1,
    d7: 0,
    d30: 0,
    wau: 9,
    mau: 17,
    m: 2,
  },
]

const cancellations = [
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    organizationId: 'org-family-beta',
    userId: users[4].id,
    reason: 'too_expensive',
    feedback: 'Will retry after summer.',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    organizationId: 'org-solo',
    userId: users[5].id,
    reason: 'missing_features',
    feedback: 'Need reminder templates and OCR.',
  },
]

const loadIntIdMap = async (
  client: PoolClient,
  tableName: 'users' | 'vehicle' | 'maintenance_log',
): Promise<Map<string, number>> => {
  const { rows } = await client.query<{ id: string; id_int: string | number }>(
    `SELECT id, id_int FROM ${tableName}`,
  )
  return new Map(
    rows.map((row) => [row.id, typeof row.id_int === 'string' ? Number(row.id_int) : row.id_int]),
  )
}

const run = async (): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const org of organizations) {
      await client.query(
        `
        INSERT INTO organization_plans (organization_id, plan)
        VALUES ($1, $2)
        ON CONFLICT (organization_id) DO UPDATE
        SET plan = EXCLUDED.plan, updated_at = NOW()
        `,
        [org.id, org.plan],
      )
    }

    for (const user of users) {
      await client.query(
        `
        INSERT INTO users (
          id, email, password_hash, role, organization_id, plan_override, organization_role,
          email_verified_at, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 0, NULL, NOW(), NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          organization_id = EXCLUDED.organization_id,
          plan_override = EXCLUDED.plan_override,
          organization_role = EXCLUDED.organization_role,
          updated_at = NOW()
        `,
        [user.id, user.email, '$2b$12$seededpasswordhashplaceholder', user.role, user.organizationId, user.planOverride, user.organizationRole],
      )
    }
    const userIntIdMap = await loadIntIdMap(client, 'users')

    for (const token of refreshTokens) {
      await client.query(
        `
        INSERT INTO refresh_tokens (
          id, user_id, user_id_int, family_id, token_hash, issued_at, last_used_at, expires_at, absolute_expires_at,
          replaced_by_token_id, revoked_at, revoked_reason, user_agent, ip_address, client_kind, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
        ON CONFLICT (token_hash) DO UPDATE
        SET
          user_id = EXCLUDED.user_id,
          user_id_int = EXCLUDED.user_id_int,
          family_id = EXCLUDED.family_id,
          issued_at = EXCLUDED.issued_at,
          last_used_at = EXCLUDED.last_used_at,
          expires_at = EXCLUDED.expires_at,
          absolute_expires_at = EXCLUDED.absolute_expires_at,
          replaced_by_token_id = EXCLUDED.replaced_by_token_id,
          revoked_at = EXCLUDED.revoked_at,
          revoked_reason = EXCLUDED.revoked_reason,
          user_agent = EXCLUDED.user_agent,
          ip_address = EXCLUDED.ip_address,
          client_kind = EXCLUDED.client_kind
        `,
        [
          token.id,
          token.userId,
          userIntIdMap.get(token.userId) ?? null,
          token.familyId,
          token.tokenHash,
          token.issuedAt,
          token.lastUsedAt,
          token.expiresAt,
          token.absoluteExpiresAt,
          token.replacedByTokenId,
          token.revokedAt,
          token.revokedReason,
          token.userAgent,
          token.ipAddress,
          token.clientKind,
        ],
      )
    }

    for (const row of vehicles) {
      await client.query(
        `
        INSERT INTO vehicle (
          id, organization_id, make, model, year, vin, plate, euro_standard, current_odometer, is_locked, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          organization_id = EXCLUDED.organization_id,
          make = EXCLUDED.make,
          model = EXCLUDED.model,
          year = EXCLUDED.year,
          vin = EXCLUDED.vin,
          plate = EXCLUDED.plate,
          euro_standard = EXCLUDED.euro_standard,
          current_odometer = EXCLUDED.current_odometer,
          is_locked = EXCLUDED.is_locked
        `,
        [
          row.id,
          row.organizationId,
          row.make,
          row.model,
          row.year,
          row.vin,
          row.plate,
          row.euroStandard,
          row.currentOdometer,
          row.isLocked,
        ],
      )
    }
    const vehicleIntIdMap = await loadIntIdMap(client, 'vehicle')

    for (const log of maintenanceLogs) {
      await client.query(
        `
        INSERT INTO maintenance_log (
          id, vehicle_id, vehicle_id_int, date, odometer, category, description, total_cost,
          integrity_hash, version, content_hash, hash_algorithm, hash_version, locked_at, locked_by, lock_reason,
          created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10,'sha256','v1',NULL,NULL,NULL,NOW(),NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          vehicle_id = EXCLUDED.vehicle_id,
          vehicle_id_int = EXCLUDED.vehicle_id_int,
          date = EXCLUDED.date,
          odometer = EXCLUDED.odometer,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          total_cost = EXCLUDED.total_cost,
          integrity_hash = EXCLUDED.integrity_hash,
          content_hash = EXCLUDED.content_hash,
          updated_at = NOW()
        `,
        [
          log.id,
          log.vehicleId,
          vehicleIntIdMap.get(log.vehicleId) ?? null,
          log.date,
          log.odometer,
          log.category,
          log.description,
          log.totalCost,
          `integrity-${log.id}`,
          `content-${log.id}`,
        ],
      )
    }
    const maintenanceIntIdMap = await loadIntIdMap(client, 'maintenance_log')

    for (const row of reminders) {
      await client.query(
        `
        INSERT INTO vehicle_reminder (
          id, vehicle_id, vehicle_id_int, organization_id, title, notes, frequency_type, interval_value, due_at, due_odometer, status, deferred_until,
          created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          title = EXCLUDED.title,
          notes = EXCLUDED.notes,
          due_at = EXCLUDED.due_at,
          due_odometer = EXCLUDED.due_odometer,
          status = EXCLUDED.status,
          deferred_until = EXCLUDED.deferred_until,
          updated_at = NOW()
        `,
        [
          row.id,
          row.vehicleId,
          vehicleIntIdMap.get(row.vehicleId) ?? null,
          row.organizationId,
          row.title,
          row.notes,
          row.frequencyType,
          row.intervalValue,
          row.dueAt,
          row.dueOdometer,
          row.status,
          row.deferredUntil,
        ],
      )
    }

    for (const row of members) {
      await client.query(
        `
        INSERT INTO vehicle_member (
          id, vehicle_id, vehicle_id_int, organization_id, user_id, user_id_int, role, assigned_by, assigned_by_int, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
        ON CONFLICT (vehicle_id, user_id) DO UPDATE
        SET
          role = EXCLUDED.role,
          assigned_by = EXCLUDED.assigned_by,
          assigned_by_int = EXCLUDED.assigned_by_int,
          user_id_int = EXCLUDED.user_id_int,
          vehicle_id_int = EXCLUDED.vehicle_id_int
        `,
        [
          row.id,
          row.vehicleId,
          vehicleIntIdMap.get(row.vehicleId) ?? null,
          row.organizationId,
          row.userId,
          userIntIdMap.get(row.userId) ?? null,
          row.role,
          row.assignedBy,
          userIntIdMap.get(row.assignedBy) ?? null,
        ],
      )
    }

    for (const row of documents) {
      await client.query(
        `
        INSERT INTO vehicle_document (
          id, vehicle_id, vehicle_id_int, organization_id, maintenance_log_id, maintenance_log_id_int, type,
          title, storage_key, mime_type, size_bytes, uploaded_by, uploaded_by_int, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          vehicle_id_int = EXCLUDED.vehicle_id_int,
          maintenance_log_id_int = EXCLUDED.maintenance_log_id_int,
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          storage_key = EXCLUDED.storage_key,
          mime_type = EXCLUDED.mime_type,
          size_bytes = EXCLUDED.size_bytes,
          uploaded_by = EXCLUDED.uploaded_by,
          uploaded_by_int = EXCLUDED.uploaded_by_int
        `,
        [
          row.id,
          row.vehicleId,
          vehicleIntIdMap.get(row.vehicleId) ?? null,
          row.organizationId,
          row.maintenanceLogId,
          row.maintenanceLogId ? (maintenanceIntIdMap.get(row.maintenanceLogId) ?? null) : null,
          row.type,
          row.title,
          row.storageKey,
          row.mimeType,
          row.sizeBytes,
          row.uploadedBy,
          userIntIdMap.get(row.uploadedBy) ?? null,
        ],
      )
    }

    for (const row of invites) {
      await client.query(
        `
        INSERT INTO organization_invites (
          id, organization_id, email, role, token_hash, expires_at, accepted_at, revoked_at,
          invited_by, invited_by_int, accepted_by, accepted_by_int, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
        ON CONFLICT (token_hash) DO UPDATE
        SET
          role = EXCLUDED.role,
          expires_at = EXCLUDED.expires_at,
          accepted_at = EXCLUDED.accepted_at,
          revoked_at = EXCLUDED.revoked_at,
          invited_by = EXCLUDED.invited_by,
          invited_by_int = EXCLUDED.invited_by_int,
          accepted_by = EXCLUDED.accepted_by,
          accepted_by_int = EXCLUDED.accepted_by_int,
          updated_at = NOW()
        `,
        [
          row.id,
          row.organizationId,
          row.email,
          row.role,
          row.tokenHash,
          row.expiresAt,
          row.acceptedAt,
          row.revokedAt,
          row.invitedBy,
          userIntIdMap.get(row.invitedBy) ?? null,
          row.acceptedBy,
          row.acceptedBy ? (userIntIdMap.get(row.acceptedBy) ?? null) : null,
        ],
      )
    }

    for (const row of banners) {
      await client.query(
        `
        INSERT INTO banners (
          id, id_int, key, title, message, severity, cta_label, cta_url, starts_at, ends_at, is_active, created_at, updated_at
        )
        VALUES ($1,DEFAULT,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
        ON CONFLICT (key) DO UPDATE
        SET
          title = EXCLUDED.title,
          message = EXCLUDED.message,
          severity = EXCLUDED.severity,
          cta_label = EXCLUDED.cta_label,
          cta_url = EXCLUDED.cta_url,
          starts_at = EXCLUDED.starts_at,
          ends_at = EXCLUDED.ends_at,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        `,
        [row.id, row.key, row.title, row.message, row.severity, row.ctaLabel, row.ctaUrl, row.startsAt, row.endsAt, row.isActive],
      )
    }
    const bannerIntRows = await client.query<{ key: string; id_int: string | number }>(
      'SELECT key, id_int FROM banners',
    )
    const bannerIntIdMap = new Map(
      bannerIntRows.rows.map((row) => [row.key, typeof row.id_int === 'string' ? Number(row.id_int) : row.id_int]),
    )

    for (const row of bannerDismissals) {
      await client.query(
        `
        INSERT INTO user_banner_dismissals (id, id_int, user_id, user_id_int, banner_key, banner_id_int, dismissed_at)
        VALUES ($1,DEFAULT,$2,$3,$4,$5,$6)
        ON CONFLICT (user_id, banner_key) DO UPDATE
        SET
          dismissed_at = EXCLUDED.dismissed_at,
          user_id_int = EXCLUDED.user_id_int,
          banner_id_int = EXCLUDED.banner_id_int
        `,
        [
          row.id,
          row.userId,
          userIntIdMap.get(row.userId) ?? null,
          row.bannerKey,
          bannerIntIdMap.get(row.bannerKey) ?? null,
          row.dismissedAt,
        ],
      )
    }

    for (const row of analyticsEvents) {
      await client.query(
        `
        INSERT INTO analytics_events_raw (
          id, event_id, event_name, occurred_at_client, received_at_server, user_id, session_id, device_id,
          platform, country, channel, app_version, schema_version, integrity_valid, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
        ON CONFLICT (id) DO NOTHING
        `,
        [
          row.id,
          row.eventId,
          row.eventName,
          row.occurredAtClient,
          row.receivedAtServer,
          row.userId,
          row.sessionId,
          row.deviceId,
          row.platform,
          row.country,
          row.channel,
          row.appVersion,
          row.schemaVersion,
          row.integrityValid,
        ],
      )
    }

    for (const user of users) {
      await client.query(
        `
        INSERT INTO analytics_user_cohorts (id, user_id, signup_date, country, platform, channel)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (id) DO UPDATE
        SET user_id = EXCLUDED.user_id, signup_date = EXCLUDED.signup_date, country = EXCLUDED.country,
            platform = EXCLUDED.platform, channel = EXCLUDED.channel
        `,
        [
          faker.string.uuid(),
          user.id,
          new Date(now.getTime() - faker.number.int({ min: 20, max: 120 }) * day).toISOString().slice(0, 10),
          user.country,
          user.platform,
          user.channel,
        ],
      )

      await client.query(
        `
        INSERT INTO consent_ledger (id, user_id, consent_type, status, legal_basis, policy_version, capture_source, request_id, created_at)
        VALUES ($1,$2,'analytics','granted','consent','v2','api',$3,NOW())
        ON CONFLICT (id) DO NOTHING
        `,
        [faker.string.uuid(), user.id, `seed-consent-${user.id}`],
      )
    }

    for (const rollup of dailyRollups) {
      await client.query(
        `
        INSERT INTO analytics_daily_rollups (
          id, date, country, platform, channel, activation_count, d1_retained, d7_retained, d30_retained, wau, mau, maintenance_actions_completed
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          faker.string.uuid(),
          rollup.date,
          rollup.country,
          rollup.platform,
          rollup.channel,
          rollup.a,
          rollup.d1,
          rollup.d7,
          rollup.d30,
          rollup.wau,
          rollup.mau,
          rollup.m,
        ],
      )
    }

    const auditEvents = [
      {
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        actorType: 'user',
        actorId: users[0].id,
        action: 'vehicle.created',
        resourceType: 'vehicle',
        resourceId: vehicles[0].id,
        reasonCode: null as string | null,
        source: 'api',
      },
      {
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
        actorType: 'user',
        actorId: users[1].id,
        action: 'maintenance.completed',
        resourceType: 'maintenance_log',
        resourceId: maintenanceLogs[1].id,
        reasonCode: 'scheduled_service',
        source: 'api',
      },
      {
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
        actorType: 'system',
        actorId: 'scheduler',
        action: 'reminder.marked_due',
        resourceType: 'vehicle_reminder',
        resourceId: reminders[1].id,
        reasonCode: 'cron_due',
        source: 'job',
      },
    ]

    for (const row of auditEvents) {
      await client.query(
        `
        INSERT INTO audit_events (
          id, occurred_at, actor_type, actor_id, action, resource_type, resource_id, reason_code, source, request_id, metadata_json
        )
        VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        ON CONFLICT (id) DO UPDATE
        SET action = EXCLUDED.action, reason_code = EXCLUDED.reason_code, metadata_json = EXCLUDED.metadata_json
        `,
        [
          row.id,
          row.actorType,
          row.actorId,
          row.action,
          row.resourceType,
          row.resourceId,
          row.reasonCode,
          row.source,
          `req-seed-${row.id}`,
          JSON.stringify({ scenario: 'seed-flow', actor: row.actorId }),
        ],
      )
    }

    for (const row of cancellations) {
      await client.query(
        `
        INSERT INTO subscription_cancellations (id, organization_id, user_id, user_id_int, reason, feedback, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,NOW())
        ON CONFLICT (id) DO UPDATE
        SET reason = EXCLUDED.reason, feedback = EXCLUDED.feedback, user_id_int = EXCLUDED.user_id_int
        `,
        [row.id, row.organizationId, row.userId, userIntIdMap.get(row.userId) ?? null, row.reason, row.feedback],
      )
    }

    await client.query('COMMIT')
    console.log(
      `Database seed complete. users=${users.length}, vehicles=${vehicles.length}, maintenance_logs=${maintenanceLogs.length}, reminders=${reminders.length}, banners=${banners.length}, analytics_events=${analyticsEvents.length}`,
    )
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

void run()
