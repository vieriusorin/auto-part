import type { AuthConfig } from '@autocare/config/server'
import argon2 from 'argon2'
import { weakPassword } from '../domain/errors.js'

export type PasswordHasher = {
  hash: (plaintext: string) => Promise<string>
  verify: (hash: string, plaintext: string) => Promise<boolean>
  /**
   * True when the stored hash was produced with weaker parameters than the
   * current policy; callers should re-hash on successful login.
   */
  needsRehash: (hash: string) => boolean
}

export const createPasswordHasher = (config: AuthConfig['password']): PasswordHasher => {
  const options = {
    type: argon2.argon2id,
    timeCost: config.argon2TimeCost,
    memoryCost: config.argon2MemoryCostKib,
    parallelism: config.argon2Parallelism,
  } as const

  return {
    hash: (plaintext: string) => argon2.hash(plaintext, options),
    verify: async (hash, plaintext) => {
      try {
        return await argon2.verify(hash, plaintext)
      } catch {
        return false
      }
    },
    needsRehash: (hash) => {
      try {
        return argon2.needsRehash(hash, options)
      } catch {
        return true
      }
    },
  }
}

export type PasswordPolicy = {
  validate: (plaintext: string) => void
}

const hasLower = (s: string) => /[a-z]/.test(s)
const hasUpper = (s: string) => /[A-Z]/.test(s)
const hasDigit = (s: string) => /\d/.test(s)
const hasSymbol = (s: string) => /[^A-Za-z0-9]/.test(s)

export const createPasswordPolicy = (config: AuthConfig['password']): PasswordPolicy => ({
  validate: (plaintext: string) => {
    if (plaintext.length < config.minLength) {
      throw weakPassword(`Password must be at least ${config.minLength} characters`)
    }
    if (config.requireMixedCase && !(hasLower(plaintext) && hasUpper(plaintext))) {
      throw weakPassword('Password must contain both upper and lower case letters')
    }
    if (config.requireDigit && !hasDigit(plaintext)) {
      throw weakPassword('Password must contain a digit')
    }
    if (config.requireSymbol && !hasSymbol(plaintext)) {
      throw weakPassword('Password must contain a symbol')
    }
  },
})
