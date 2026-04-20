import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'

let singleton: NodePgDatabase | undefined
let pool: pg.Pool | undefined

export const getAuthDb = (databaseUrl: string): NodePgDatabase => {
  if (!singleton) {
    pool = new pg.Pool({ connectionString: databaseUrl })
    singleton = drizzle(pool)
  }
  return singleton
}

/** Allow tests / shutdown hooks to release the pool. */
export const closeAuthDb = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = undefined
    singleton = undefined
  }
}
