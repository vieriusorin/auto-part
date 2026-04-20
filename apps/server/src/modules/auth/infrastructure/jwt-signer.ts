import { randomUUID } from 'node:crypto'
import type { AuthConfig } from '@autocare/config/server'
import type { UserRole } from '@autocare/shared'
import { importPKCS8, importSPKI, type JWTPayload, jwtVerify, SignJWT } from 'jose'
import type { IssuedAccessToken } from '../domain/types.js'
import type { Clock } from './clock.js'

export type AccessTokenClaims = {
  sub: string
  email: string
  role: UserRole
  orgId?: string
  jti: string
  iat: number
  exp: number
  iss: string
  aud: string
}

export type JwtSigner = {
  sign: (input: {
    userId: string
    email: string
    role: UserRole
    organizationId: string | null
  }) => Promise<IssuedAccessToken>
  verify: (token: string) => Promise<AccessTokenClaims>
}

const toKey = async (
  config: AuthConfig['jwt'],
): Promise<{ signKey: unknown; verifyKey: unknown }> => {
  if (config.algorithm.startsWith('HS')) {
    if (!config.secret) {
      throw new Error('JWT_ACCESS_SECRET is required for HS* algorithms')
    }
    const encoded = new TextEncoder().encode(config.secret)
    return { signKey: encoded, verifyKey: encoded }
  }
  if (!config.privateKey || !config.publicKey) {
    throw new Error(
      'JWT_ACCESS_PRIVATE_KEY and JWT_ACCESS_PUBLIC_KEY are required for RS* algorithms',
    )
  }
  const [priv, pub] = await Promise.all([
    importPKCS8(config.privateKey, config.algorithm),
    importSPKI(config.publicKey, config.algorithm),
  ])
  return { signKey: priv, verifyKey: pub }
}

export const createJwtSigner = async (
  config: AuthConfig['jwt'],
  clock: Clock,
): Promise<JwtSigner> => {
  const { signKey, verifyKey } = await toKey(config)

  return {
    sign: async ({ userId, email, role, organizationId }) => {
      const now = clock.now()
      const iat = Math.floor(now.getTime() / 1000)
      const exp = iat + config.accessTtlSeconds
      const jti = randomUUID()

      const payload: JWTPayload = {
        email,
        role,
        jti,
      }
      if (organizationId) {
        payload.orgId = organizationId
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: config.algorithm, typ: 'JWT' })
        .setSubject(userId)
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .setIssuer(config.issuer)
        .setAudience(config.audience)
        .setJti(jti)
        // biome-ignore lint/suspicious/noExplicitAny: jose key types are polymorphic
        .sign(signKey as any)

      return {
        token,
        jti,
        expiresAt: new Date(exp * 1000),
      }
    },
    verify: async (token) => {
      // biome-ignore lint/suspicious/noExplicitAny: jose key types are polymorphic
      const { payload } = await jwtVerify(token, verifyKey as any, {
        issuer: config.issuer,
        audience: config.audience,
        algorithms: [config.algorithm],
        currentDate: clock.now(),
      })
      if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
        throw new Error('Malformed token: missing sub/jti')
      }
      const role = payload.role
      if (role !== 'user' && role !== 'admin') {
        throw new Error('Malformed token: invalid role')
      }
      const email = payload.email
      if (typeof email !== 'string') {
        throw new Error('Malformed token: missing email')
      }
      const orgId = typeof payload.orgId === 'string' ? payload.orgId : undefined
      return {
        sub: payload.sub,
        email,
        role,
        orgId,
        jti: payload.jti,
        iat: payload.iat as number,
        exp: payload.exp as number,
        iss: payload.iss as string,
        aud: payload.aud as string,
      }
    },
  }
}
