import { describe, expect, it } from 'vitest'
import { createJwtSigner } from '../infrastructure/jwt-signer.js'
import { createFakeClock } from './test-helpers.js'

const baseJwtConfig = {
  algorithm: 'HS256' as const,
  secret: 'a'.repeat(48),
  privateKey: undefined,
  publicKey: undefined,
  accessTtlSeconds: 900,
  issuer: 'autocare-api',
  audience: 'autocare',
}

describe('jwtSigner', () => {
  it('signs and verifies a token with expected claims', async () => {
    const clock = createFakeClock(new Date('2026-04-17T10:00:00.000Z'))
    const signer = await createJwtSigner(baseJwtConfig, clock)
    const { token, jti, expiresAt } = await signer.sign({
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'alice@example.com',
      role: 'user',
      organizationId: 'org-1',
    })
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)

    const claims = await signer.verify(token)
    expect(claims.sub).toBe('11111111-1111-1111-1111-111111111111')
    expect(claims.email).toBe('alice@example.com')
    expect(claims.role).toBe('user')
    expect(claims.orgId).toBe('org-1')
    expect(claims.jti).toBe(jti)
    expect(claims.iss).toBe('autocare-api')
    expect(claims.aud).toBe('autocare')
    expect(expiresAt.getTime()).toBe(clock.now().getTime() + 900 * 1000)
  })

  it('rejects tokens signed with a different secret', async () => {
    const clock = createFakeClock()
    const signer = await createJwtSigner(baseJwtConfig, clock)
    const other = await createJwtSigner({ ...baseJwtConfig, secret: 'b'.repeat(48) }, clock)
    const { token } = await other.sign({
      userId: 'u-1',
      email: 'e@x.com',
      role: 'user',
      organizationId: null,
    })
    await expect(signer.verify(token)).rejects.toThrow()
  })

  it('rejects tokens with wrong issuer or audience', async () => {
    const clock = createFakeClock()
    const signer = await createJwtSigner(baseJwtConfig, clock)
    const otherIssuer = await createJwtSigner({ ...baseJwtConfig, issuer: 'evil-issuer' }, clock)
    const { token } = await otherIssuer.sign({
      userId: 'u-1',
      email: 'e@x.com',
      role: 'user',
      organizationId: null,
    })
    await expect(signer.verify(token)).rejects.toThrow()
  })
})
