import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import dotenv from 'dotenv'

let didLoadEnv = false

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
