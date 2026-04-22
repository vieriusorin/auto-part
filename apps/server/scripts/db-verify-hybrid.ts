import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { Pool } from 'pg'

loadDotenv({ path: resolve(process.cwd(), '.env') })
loadDotenv({ path: resolve(process.cwd(), '../../.env') })

const databaseUrl = process.env.DATABASE_URL
if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  console.error('DATABASE_URL is required for hybrid verification.')
  process.exit(1)
}

const checks: Array<{ name: string; sql: string }> = [
  {
    name: 'users.id_int non-null',
    sql: "SELECT COUNT(*)::int AS c FROM users WHERE id_int IS NULL",
  },
  {
    name: 'vehicle.id_int non-null',
    sql: "SELECT COUNT(*)::int AS c FROM vehicle WHERE id_int IS NULL",
  },
  {
    name: 'maintenance_log bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM maintenance_log ml
      JOIN vehicle v ON ml.vehicle_id = v.id
      WHERE ml.vehicle_id_int IS DISTINCT FROM v.id_int
    `,
  },
  {
    name: 'vehicle_reminder bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM vehicle_reminder vr
      JOIN vehicle v ON vr.vehicle_id = v.id
      WHERE vr.vehicle_id_int IS DISTINCT FROM v.id_int
    `,
  },
  {
    name: 'vehicle_document bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM vehicle_document vd
      JOIN vehicle v ON vd.vehicle_id = v.id
      JOIN users u ON vd.uploaded_by = u.id
      LEFT JOIN maintenance_log ml ON vd.maintenance_log_id = ml.id
      WHERE vd.vehicle_id_int IS DISTINCT FROM v.id_int
         OR vd.uploaded_by_int IS DISTINCT FROM u.id_int
         OR (
           vd.maintenance_log_id IS NOT NULL
           AND vd.maintenance_log_id_int IS DISTINCT FROM ml.id_int
         )
    `,
  },
  {
    name: 'vehicle_member bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM vehicle_member vm
      JOIN vehicle v ON vm.vehicle_id = v.id
      JOIN users u_member ON vm.user_id = u_member.id
      JOIN users u_assigner ON vm.assigned_by = u_assigner.id
      WHERE vm.vehicle_id_int IS DISTINCT FROM v.id_int
         OR vm.user_id_int IS DISTINCT FROM u_member.id_int
         OR vm.assigned_by_int IS DISTINCT FROM u_assigner.id_int
    `,
  },
  {
    name: 'refresh_tokens bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.user_id_int IS DISTINCT FROM u.id_int
    `,
  },
  {
    name: 'organization_invites bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM organization_invites oi
      JOIN users u_inviter ON oi.invited_by = u_inviter.id
      LEFT JOIN users u_acceptor ON oi.accepted_by = u_acceptor.id
      WHERE oi.invited_by_int IS DISTINCT FROM u_inviter.id_int
         OR (
           oi.accepted_by IS NOT NULL
           AND oi.accepted_by_int IS DISTINCT FROM u_acceptor.id_int
         )
    `,
  },
  {
    name: 'subscription_cancellations bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM subscription_cancellations sc
      JOIN users u ON sc.user_id = u.id
      WHERE sc.user_id_int IS DISTINCT FROM u.id_int
    `,
  },
  {
    name: 'banners.id_int non-null',
    sql: "SELECT COUNT(*)::int AS c FROM banners WHERE id_int IS NULL",
  },
  {
    name: 'user_banner_dismissals bigint FK consistency',
    sql: `
      SELECT COUNT(*)::int AS c
      FROM user_banner_dismissals ubd
      JOIN users u ON ubd.user_id = u.id
      JOIN banners b ON ubd.banner_key = b.key
      WHERE ubd.user_id_int IS DISTINCT FROM u.id_int
         OR ubd.banner_id_int IS DISTINCT FROM b.id_int
    `,
  },
]

const run = async (): Promise<void> => {
  const pool = new Pool({ connectionString: databaseUrl })
  const client = await pool.connect()
  try {
    let failed = 0
    for (const check of checks) {
      const result = await client.query<{ c: number }>(check.sql)
      const count = Number(result.rows[0]?.c ?? 0)
      if (count > 0) {
        failed += 1
        console.error(`FAIL: ${check.name} -> ${count}`)
      } else {
        console.log(`PASS: ${check.name}`)
      }
    }
    if (failed > 0) {
      process.exit(1)
    }
    console.log('Hybrid ID verification passed.')
  } finally {
    client.release()
    await pool.end()
  }
}

void run()
