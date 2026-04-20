import { describe, expect, it } from 'vitest'
import { createPasswordHasher, createPasswordPolicy } from '../infrastructure/password-hasher.js'

const fastConfig = {
  minLength: 12,
  requireMixedCase: false,
  requireDigit: false,
  requireSymbol: false,
  argon2TimeCost: 1,
  argon2MemoryCostKib: 4096,
  argon2Parallelism: 1,
}

describe('passwordHasher (argon2id)', () => {
  it('hashes and verifies a password', async () => {
    const hasher = createPasswordHasher(fastConfig)
    const hash = await hasher.hash('correct horse battery staple')
    expect(hash).toMatch(/^\$argon2id\$/)
    expect(await hasher.verify(hash, 'correct horse battery staple')).toBe(true)
  })

  it('rejects wrong passwords and malformed hashes', async () => {
    const hasher = createPasswordHasher(fastConfig)
    const hash = await hasher.hash('correct horse battery staple')
    expect(await hasher.verify(hash, 'wrong password')).toBe(false)
    expect(await hasher.verify('not-a-hash', 'whatever')).toBe(false)
  })

  it('needsRehash detects weaker stored params', async () => {
    const weak = createPasswordHasher({
      ...fastConfig,
      argon2TimeCost: 1,
      argon2MemoryCostKib: 4096,
    })
    const stored = await weak.hash('test')
    const strong = createPasswordHasher({
      ...fastConfig,
      argon2TimeCost: 3,
      argon2MemoryCostKib: 65536,
    })
    expect(strong.needsRehash(stored)).toBe(true)
    expect(weak.needsRehash(stored)).toBe(false)
  })
})

describe('passwordPolicy', () => {
  it('accepts a password matching all requirements', () => {
    const policy = createPasswordPolicy({
      ...fastConfig,
      requireMixedCase: true,
      requireDigit: true,
      requireSymbol: true,
    })
    expect(() => policy.validate('LongEnough1!')).not.toThrow()
  })

  it('rejects passwords below min length', () => {
    const policy = createPasswordPolicy(fastConfig)
    expect(() => policy.validate('short')).toThrow(/at least 12/)
  })

  it('enforces mixed case / digit / symbol when configured', () => {
    const policy = createPasswordPolicy({
      ...fastConfig,
      requireMixedCase: true,
      requireDigit: true,
      requireSymbol: true,
    })
    expect(() => policy.validate('alllowercase1!')).toThrow(/upper and lower/)
    expect(() => policy.validate('MixedCaseNoDigit!')).toThrow(/digit/)
    expect(() => policy.validate('MixedCase1NoSymbol')).toThrow(/symbol/)
  })
})
