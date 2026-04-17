import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl || databaseUrl.trim().length === 0) {
  console.error('DATABASE_URL is required for db:migrate.')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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
