import { faker } from '@faker-js/faker'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { Pool } from 'pg'

loadDotenv({ path: resolve(process.cwd(), '.env') })
loadDotenv({ path: resolve(process.cwd(), '../../.env') })

const databaseUrl = process.env.DATABASE_URL

if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  console.error('DATABASE_URL is required for db seed.')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })

faker.seed(20260420)

type AnalyticsEventRow = {
  id: string
  eventId: string
  eventName: string
  occurredAtClient: Date
  receivedAtServer: Date
  userId: string
  sessionId: string
  deviceId: string
  platform: 'ios' | 'android'
  country: string
  channel: string
  appVersion: string
  schemaVersion: number
  integrityValid: 0 | 1
}

type BannerRow = {
  id: string
  key: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  ctaLabel: string
  ctaUrl: string
  startsAt: Date
  endsAt: Date
  isActive: boolean
}

const platforms: Array<'ios' | 'android'> = ['ios', 'android']
const countries = ['RO', 'DE', 'IT', 'FR']
const channels = ['organic', 'ads', 'referral']
const eventNames = [
  'vehicle.created',
  'maintenance_item.created',
  'maintenance_action.completed',
  'onboarding.started',
  'onboarding.completed',
  'banner.viewed',
]

const buildSeedUsers = () =>
  Array.from({ length: 8 }, () => ({
    id: `seed-user-${faker.string.alphanumeric(10).toLowerCase()}`,
    sessionId: `seed-session-${faker.string.alphanumeric(10).toLowerCase()}`,
    deviceId: `seed-device-${faker.string.alphanumeric(10).toLowerCase()}`,
    platform: faker.helpers.arrayElement(platforms),
    country: faker.helpers.arrayElement(countries),
    channel: faker.helpers.arrayElement(channels),
  }))

const buildAnalyticsEvents = (seedUsers: ReturnType<typeof buildSeedUsers>): AnalyticsEventRow[] =>
  Array.from({ length: 40 }, () => {
    const user = faker.helpers.arrayElement(seedUsers)
    const occurredAtClient = faker.date.recent({ days: 14 })
    return {
      id: faker.string.uuid(),
      eventId: `evt-${faker.string.alphanumeric(12).toLowerCase()}`,
      eventName: faker.helpers.arrayElement(eventNames),
      occurredAtClient,
      receivedAtServer: faker.date.between({
        from: occurredAtClient,
        to: new Date(occurredAtClient.getTime() + 60_000),
      }),
      userId: user.id,
      sessionId: user.sessionId,
      deviceId: user.deviceId,
      platform: user.platform,
      country: user.country,
      channel: user.channel,
      appVersion: `1.${faker.number.int({ min: 0, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}`,
      schemaVersion: 1,
      integrityValid: 1,
    }
  })

const buildBannerSeeds = (): BannerRow[] => [
  {
    id: faker.string.uuid(),
    key: 'expire-vignette:v1',
    title: 'Vignette expires soon',
    message: 'Renew your vignette before expiry to avoid penalties.',
    severity: 'warning',
    ctaLabel: 'Renew now',
    ctaUrl: 'https://autocare.app/vignette',
    startsAt: faker.date.recent({ days: 3 }),
    endsAt: faker.date.soon({ days: 45 }),
    isActive: true,
  },
  ...Array.from({ length: 4 }, () => ({
    id: faker.string.uuid(),
    key: `campaign-${faker.word.noun()}-${faker.string.alphanumeric(4).toLowerCase()}:v1`,
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    message: faker.lorem.sentences({ min: 1, max: 2 }),
    severity: faker.helpers.arrayElement(['info', 'warning', 'critical'] as const),
    ctaLabel: faker.helpers.arrayElement(['Learn more', 'Open', 'Review now']),
    ctaUrl: faker.internet.url(),
    startsAt: faker.date.recent({ days: 5 }),
    endsAt: faker.date.soon({ days: 30 }),
    isActive: true,
  })),
]

const run = async (): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const seedUsers = buildSeedUsers()
    const analyticsEvents = buildAnalyticsEvents(seedUsers)
    const banners = buildBannerSeeds()

    for (const event of analyticsEvents) {
      await client.query(
        `
        INSERT INTO analytics_events_raw (
        id,
        event_id,
        event_name,
        occurred_at_client,
        received_at_server,
        user_id,
        session_id,
        device_id,
        platform,
        country,
        channel,
        app_version,
        schema_version,
        integrity_valid
      )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT DO NOTHING;
        `,
        [
          event.id,
          event.eventId,
          event.eventName,
          event.occurredAtClient,
          event.receivedAtServer,
          event.userId,
          event.sessionId,
          event.deviceId,
          event.platform,
          event.country,
          event.channel,
          event.appVersion,
          event.schemaVersion,
          event.integrityValid,
        ],
      )
    }

    for (const user of seedUsers) {
      await client.query(
        `
        INSERT INTO analytics_daily_rollups (
          id,
          date,
          country,
          platform,
          channel,
          activation_count,
          d1_retained,
          d7_retained,
          d30_retained,
          wau,
          mau,
          maintenance_actions_completed
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING;
        `,
        [
          faker.string.uuid(),
          faker.date.recent({ days: 10 }).toISOString().slice(0, 10),
          user.country,
          user.platform,
          user.channel,
          faker.number.int({ min: 1, max: 4 }),
          faker.number.int({ min: 0, max: 2 }),
          faker.number.int({ min: 0, max: 2 }),
          faker.number.int({ min: 0, max: 1 }),
          faker.number.int({ min: 1, max: 20 }),
          faker.number.int({ min: 1, max: 50 }),
          faker.number.int({ min: 0, max: 10 }),
        ],
      )

      await client.query(
        `
        INSERT INTO analytics_user_cohorts (
          id,
          user_id,
          signup_date,
          country,
          platform,
          channel
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING;
        `,
        [
          faker.string.uuid(),
          user.id,
          faker.date.recent({ days: 30 }).toISOString().slice(0, 10),
          user.country,
          user.platform,
          user.channel,
        ],
      )

      await client.query(
        `
        INSERT INTO consent_ledger (
          id,
          user_id,
          consent_type,
          status,
          legal_basis,
          policy_version,
          capture_source,
          request_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING;
        `,
        [
          faker.string.uuid(),
          user.id,
          'analytics',
          'granted',
          'consent',
          `v${faker.number.int({ min: 1, max: 3 })}`,
          'api',
          `seed-consent-${faker.string.alphanumeric(10).toLowerCase()}`,
        ],
      )

      await client.query(
        `
        INSERT INTO audit_events (
          id,
          actor_type,
          actor_id,
          action,
          resource_type,
          resource_id,
          reason_code,
          source,
          request_id,
          metadata_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        ON CONFLICT DO NOTHING;
        `,
        [
          faker.string.uuid(),
          'user',
          user.id,
          faker.helpers.arrayElement(['consent.granted', 'vehicle.updated', 'banner.dismissed']),
          faker.helpers.arrayElement(['consent', 'vehicle', 'banner']),
          faker.string.uuid(),
          null,
          'api',
          `seed-audit-${faker.string.alphanumeric(12).toLowerCase()}`,
          JSON.stringify({ seed: true, user: user.id }),
        ],
      )
    }

    for (const banner of banners) {
      await client.query(
        `
        INSERT INTO banners (
        id,
        key,
        title,
        message,
        severity,
        cta_label,
        cta_url,
        starts_at,
        ends_at,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        updated_at = NOW();
        `,
        [
          banner.id,
          banner.key,
          banner.title,
          banner.message,
          banner.severity,
          banner.ctaLabel,
          banner.ctaUrl,
          banner.startsAt,
          banner.endsAt,
          banner.isActive,
        ],
      )
    }

    await client.query('COMMIT')
    console.log(
      `Database seed complete. users=${seedUsers.length}, analytics_events=${analyticsEvents.length}, banners=${banners.length}`,
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
