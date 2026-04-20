import { describe, expect, it } from 'vitest'
import { createTokenGenerator } from '../infrastructure/token-generator.js'

describe('tokenGenerator', () => {
  it('emits high-entropy url-safe raw tokens with sha256 hash', () => {
    const gen = createTokenGenerator()
    const { raw, hash } = gen.create()

    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(raw.length).toBeGreaterThanOrEqual(60)

    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(gen.hash(raw)).toBe(hash)
  })

  it('produces unique tokens on repeated calls', () => {
    const gen = createTokenGenerator()
    const seen = new Set<string>()
    for (let i = 0; i < 256; i += 1) {
      seen.add(gen.create().raw)
    }
    expect(seen.size).toBe(256)
  })

  it('equals is constant-time and rejects mismatched hashes', () => {
    const gen = createTokenGenerator()
    const { hash: a } = gen.create()
    const { hash: b } = gen.create()
    expect(gen.equals(a, a)).toBe(true)
    expect(gen.equals(a, b)).toBe(false)
    expect(gen.equals(a, `${a}0`)).toBe(false)
  })
})
