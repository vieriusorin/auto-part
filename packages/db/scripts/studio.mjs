import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Repo root: packages/db/scripts -> ../../../ */
const repoRoot = path.resolve(__dirname, '../../..')
const dbWorkspaceRoot = path.resolve(__dirname, '..')

/**
 * Load .env / .env.local from monorepo root when vars are not already set.
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
    'DATABASE_URL is required for db:studio. Set it in the repo root .env or export it in the shell.',
  )
  process.exit(1)
}

try {
  execSync('npm exec drizzle-kit -- studio --config drizzle.config.json', {
    cwd: dbWorkspaceRoot,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  })
} catch {
  process.exit(1)
}
