import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

const repoRoot = resolve(process.cwd(), '../../')

// Load repo env files for monorepo workspace commands.
loadEnv({ path: resolve(repoRoot, '.env') })
loadEnv({ path: resolve(repoRoot, '.env.local'), override: true })

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim().length === 0) {
  throw new Error('DATABASE_URL is required for Drizzle config.')
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
