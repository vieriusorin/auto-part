import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Repo root: packages/db/scripts -> ../../../ */
const repoRoot = path.resolve(__dirname, '../../..')

/**
 * Load .env / .env.local from monorepo root when vars are not already set (e.g. `npm run db:migrate`
 * from workspace does not load root .env automatically).
 */
const loadRootEnvFiles = () => {
  for (const name of ['.env.local', '.env']) {
    const filePath = path.join(repoRoot, name)
    if (!existsSync(filePath)) continue
    const content = readFileSync(filePath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) {
        process.env[key] = val
      }
    }
  }
}

loadRootEnvFiles()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl || databaseUrl.trim().length === 0) {
  console.error(
    'DATABASE_URL is required for db:migrate. Set it in the repo root .env or export it in the shell.',
  )
  process.exit(1)
}

const migrationsDir = path.resolve(__dirname, '../src/migrations')

const getMigrationFiles = async () => {
  const files = await readdir(migrationsDir)
  return files.filter((file) => file.endsWith('.sql')).sort()
}

const run = async () => {
  const pool = new Pool({ connectionString: databaseUrl })
  const client = await pool.connect()

  try {
    const migrationFiles = await getMigrationFiles()

    if (migrationFiles.length === 0) {
      console.log('No SQL migrations found.')
      return
    }

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile)
      const sql = await readFile(migrationPath, 'utf8')
      await client.query(sql)
      console.log(`Applied migration: ${migrationFile}`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

void run()
