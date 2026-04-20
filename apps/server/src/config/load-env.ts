import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EnvValidationError, parseServerEnv, type ServerEnv } from '@autocare/config/server'
import dotenv from 'dotenv'

let didLoadEnv = false
let cachedConfig: ServerEnv | undefined

/**
 * Load .env files from the candidate paths (monorepo root, app root, etc.).
 * This performs no validation — safe to call from any module, including those
 * imported during tests where a partial env is expected.
 *
 * For the server entry point, prefer `loadServerConfig()` which fails fast on
 * missing or malformed variables.
 */
export const loadServerEnv = (): void => {
  if (didLoadEnv) {
    return
  }

  const cwd = process.cwd()
  const currentFileDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
  const envCandidates = [
    resolve(cwd, '.env'),
    resolve(cwd, '../../.env'),
    resolve(cwd, '../../../.env'),
    resolve(currentFileDir, '../.env'),
    resolve(currentFileDir, '../../.env'),
    resolve(currentFileDir, '../../../.env'),
    resolve(currentFileDir, '../../../../.env'),
  ]

  for (const envPath of envCandidates) {
    if (!existsSync(envPath)) {
      continue
    }
    dotenv.config({ path: envPath, override: true })
  }

  didLoadEnv = true
}

/**
 * Load .env files and validate the resulting environment against the server
 * schema. Throws EnvValidationError with a readable message if required
 * variables are missing or malformed. Result is cached per process.
 *
 * Call this exactly once from the server entry point.
 */
export const loadServerConfig = (): ServerEnv => {
  if (cachedConfig !== undefined) {
    return cachedConfig
  }

  loadServerEnv()

  try {
    cachedConfig = parseServerEnv(process.env)
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // Write the readable message to stderr and exit with a distinct code so
      // orchestrators (docker, systemd, Azure) surface the reason clearly.
      process.stderr.write(`${error.message}\n`)
      process.exit(78)
    }
    throw error
  }

  return cachedConfig
}
