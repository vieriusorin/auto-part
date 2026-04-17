import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  console.error('DATABASE_URL is required for db reset.')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })

const run = async (): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `
      TRUNCATE TABLE
        analytics_events_raw,
        analytics_daily_rollups,
        analytics_user_cohorts,
        consent_ledger,
        audit_events
      RESTART IDENTITY;
      `,
    )
    await client.query('COMMIT')
    console.log('Phase 0 tables reset complete.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

void run()
