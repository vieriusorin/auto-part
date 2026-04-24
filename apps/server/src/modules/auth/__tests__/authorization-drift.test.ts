import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

const SERVER_SRC_ROOT = join(process.cwd(), 'src')

const normalizePath = (filePath: string): string => filePath.split(sep).join('/')

const collectTsFiles = async (dirPath: string): Promise<string[]> => {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'dist' || entry.name === 'node_modules') {
          return []
        }
        return collectTsFiles(absolutePath)
      }
      if (!entry.isFile() || extname(entry.name) !== '.ts') {
        return []
      }
      return [absolutePath]
    }),
  )
  return files.flat()
}

describe('authorization drift checks', () => {
  it('prevents raw permission action literals outside auth policy files', async () => {
    const files = await collectTsFiles(SERVER_SRC_ROOT)
    const permissionLiteralPattern =
      /['"](document\.(?:read|create|update)|vehicles\.(?:read|create|update|delete)|logs\.(?:read|create|update|delete)|reports\.read|audit\.read\.(?:self|all)|admin\.(?:users\.manage|analytics\.read))['"]/g

    const allowedPathFragments = [
      'src/modules/auth/application',
      'src/modules/auth/interfaces/http',
      'src/modules/auth/__tests__',
      'src/types/express.d.ts',
    ]

    const violations: string[] = []

    for (const file of files) {
      const normalized = normalizePath(file)
      if (normalized.includes('/__tests__/')) {
        continue
      }
      const isAllowed = allowedPathFragments.some((fragment) => normalized.includes(fragment))
      if (isAllowed) {
        continue
      }
      const text = await readFile(file, 'utf8')
      const matches = [...text.matchAll(permissionLiteralPattern)]
      for (const match of matches) {
        if (!match[0]) {
          continue
        }
        violations.push(`${normalizePath(relative(SERVER_SRC_ROOT, file))}: ${match[0]}`)
      }
    }

    expect(violations).toEqual([])
  })

  it('prevents inline role branching outside approved auth modules', async () => {
    const files = await collectTsFiles(SERVER_SRC_ROOT)
    const roleBranchPattern =
      /\b(?:user|actor|subject)\.(?:role|organizationRole)\s*===\s*['"](admin|owner|manager|driver|viewer|user)['"]/g

    const allowedPathFragments = [
      'src/modules/auth/application',
      'src/modules/auth/__tests__',
    ]

    const violations: string[] = []

    for (const file of files) {
      const normalized = normalizePath(file)
      if (normalized.includes('/__tests__/')) {
        continue
      }
      const isAllowed = allowedPathFragments.some((fragment) => normalized.includes(fragment))
      if (isAllowed) {
        continue
      }
      const text = await readFile(file, 'utf8')
      const matches = [...text.matchAll(roleBranchPattern)]
      for (const match of matches) {
        if (!match[0]) {
          continue
        }
        violations.push(`${normalizePath(relative(SERVER_SRC_ROOT, file))}: ${match[0]}`)
      }
    }

    expect(violations).toEqual([])
  })
})

