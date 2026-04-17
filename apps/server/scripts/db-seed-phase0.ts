import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  console.error('DATABASE_URL is required for db seed.')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })

const run = async (): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

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
      VALUES
        (
          '11111111-1111-1111-1111-111111111111',
          'evt-vehicle-created',
          'vehicle.created',
          NOW() - INTERVAL '7 days',
          NOW() - INTERVAL '7 days',
          'seed-user-1',
          'seed-session-1',
          'seed-device-1',
          'ios',
          'RO',
          'organic',
          '1.0.0',
          1,
          1
        ),
        (
          '11111111-1111-1111-1111-111111111112',
          'evt-maintenance-completed',
          'maintenance_action.completed',
          NOW() - INTERVAL '6 days',
          NOW() - INTERVAL '6 days',
          'seed-user-1',
          'seed-session-1',
          'seed-device-1',
          'ios',
          'RO',
          'organic',
          '1.0.0',
          1,
          1
        )
      ON CONFLICT DO NOTHING;
      `,
    )

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
      VALUES
        (
          '22222222-2222-2222-2222-222222222221',
          TO_CHAR(NOW() - INTERVAL '6 days', 'YYYY-MM-DD'),
          'RO',
          'ios',
          'organic',
          1,
          1,
          1,
          0,
          1,
          1,
          1
        )
      ON CONFLICT DO NOTHING;
      `,
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
      VALUES
        (
          '33333333-3333-3333-3333-333333333331',
          'seed-user-1',
          TO_CHAR(NOW() - INTERVAL '7 days', 'YYYY-MM-DD'),
          'RO',
          'ios',
          'organic'
        )
      ON CONFLICT DO NOTHING;
      `,
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
      VALUES
        (
          '44444444-4444-4444-4444-444444444441',
          'seed-user-1',
          'analytics',
          'granted',
          'consent',
          'v1',
          'api',
          'seed-consent-req-1'
        )
      ON CONFLICT DO NOTHING;
      `,
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
      VALUES
        (
          '55555555-5555-5555-5555-555555555551',
          'user',
          'seed-user-1',
          'consent.granted',
          'consent',
          'analytics',
          NULL,
          'api',
          'seed-audit-req-1',
          '{"seed": true, "phase": 0}'::jsonb
        )
      ON CONFLICT DO NOTHING;
      `,
    )

    await client.query('COMMIT')
    console.log('Phase 0 seed complete.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

void run()
