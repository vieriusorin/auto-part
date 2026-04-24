import { z } from 'zod'
import { EnvValidationError, formatZodIssues } from './errors'

export { EnvValidationError } from './errors'

const nodeEnvSchema = z.enum(['development', 'test', 'staging', 'production']).default('development')

const booleanLike = z
  .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((value) => value === 'true' || value === '1')

const commaSeparatedOrigins = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(z.array(z.string().url()))

const jwtAlgorithmSchema = z.enum(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'])

const sameSiteSchema = z.enum(['lax', 'strict', 'none'])

const refreshRotationSchema = z.enum(['enabled', 'disabled'])

const reuseDetectionSchema = z.enum(['enabled', 'disabled'])

const serverEnvSchema = z
  .object({
    NODE_ENV: nodeEnvSchema,

    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z
      .string()
      .url()
      .refine((url) => url.startsWith('postgres://') || url.startsWith('postgresql://'), {
        message: 'DATABASE_URL must be a postgres:// or postgresql:// connection string',
      }),

    ALLOWED_ORIGINS: commaSeparatedOrigins.optional(),

    TRUST_PROXY: z
      .union([z.coerce.number().int().min(0), booleanLike, z.string()])
      .default(0)
      .describe(
        'express trust proxy value: number of hops, boolean, or named value (loopback, linklocal, uniquelocal)',
      ),

    OPEN_API_DOCS: booleanLike.default(true).describe('Auto-open Swagger UI on dev server start'),

    ANALYTICS_STORAGE: z.enum(['db', 'memory']).optional(),

    VITEST: booleanLike.optional(),

    JWT_ACCESS_SECRET: z
      .string()
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
      .optional(),
    JWT_ACCESS_ALG: jwtAlgorithmSchema.default('HS256'),
    JWT_ACCESS_PRIVATE_KEY: z.string().optional(),
    JWT_ACCESS_PUBLIC_KEY: z.string().optional(),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(60 * 60 * 24).default(15 * 60),
    JWT_ISSUER: z.string().min(1).default('autocare-api'),
    JWT_AUDIENCE: z.string().min(1).default('autocare'),

    REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    REFRESH_ROTATION: refreshRotationSchema.default('enabled'),
    REFRESH_REUSE_DETECTION: reuseDetectionSchema.default('enabled'),
    REFRESH_INACTIVITY_DAYS: z.coerce.number().int().min(0).max(365).default(7),
    REFRESH_ABSOLUTE_MAX_DAYS: z.coerce.number().int().min(0).max(365).default(90),
    REFRESH_GRACE_SECONDS: z
      .coerce.number()
      .int()
      .min(0)
      .max(300)
      .default(10)
      .describe(
        'Window during which a just-rotated refresh token still succeeds without triggering reuse detection',
      ),

    PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).max(128).default(12),
    PASSWORD_REQUIRE_MIXED_CASE: booleanLike.default(false),
    PASSWORD_REQUIRE_DIGIT: booleanLike.default(false),
    PASSWORD_REQUIRE_SYMBOL: booleanLike.default(false),
    ARGON2_TIME_COST: z.coerce.number().int().min(1).max(10).default(3),
    ARGON2_MEMORY_COST_KIB: z.coerce.number().int().min(4096).max(1048576).default(65536),
    ARGON2_PARALLELISM: z.coerce.number().int().min(1).max(16).default(4),

    LOGIN_MAX_FAILED_ATTEMPTS: z.coerce.number().int().min(1).max(100).default(10),
    LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(60 * 24).default(15),

    COOKIE_ENABLED: booleanLike.default(true),
    COOKIE_DOMAIN: z.string().min(1).optional(),
    COOKIE_SAMESITE: sameSiteSchema.default('lax'),
    COOKIE_SECURE: booleanLike.optional(),
    COOKIE_PATH: z.string().default('/'),
    COOKIE_ACCESS_NAME: z.string().min(1).optional(),
    COOKIE_REFRESH_NAME: z.string().min(1).optional(),

    CSRF_ENABLED: booleanLike.optional(),
    CSRF_COOKIE_NAME: z.string().min(1).default('autocare.csrf'),
    CSRF_HEADER_NAME: z
      .string()
      .min(1)
      .default('x-csrf-token')
      .transform((value) => value.toLowerCase()),
    CSRF_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60 * 24 * 7).default(60 * 24),

    GOOGLE_OAUTH_ENABLED: booleanLike.default(false),
    GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
    INVITE_LINK_BASE_URL: z.string().url().default('http://localhost:3000'),
    INVITE_EMAIL_FROM: z.string().email().default('noreply@autocare.local'),
    INVITE_DEFAULT_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),
    INVITE_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(0).max(3600).default(60),
    INVITE_RESEND_COOLDOWN_OWNER_SECONDS: z.coerce.number().int().min(0).max(3600).optional(),
    INVITE_RESEND_COOLDOWN_ADMIN_SECONDS: z.coerce.number().int().min(0).max(3600).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.JWT_ACCESS_ALG.startsWith('HS') && !env.JWT_ACCESS_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_SECRET'],
        message: 'JWT_ACCESS_SECRET is required when using an HS* algorithm',
      })
    }

    if (env.JWT_ACCESS_ALG.startsWith('RS') && (!env.JWT_ACCESS_PRIVATE_KEY || !env.JWT_ACCESS_PUBLIC_KEY)) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_PRIVATE_KEY'],
        message: 'RS* algorithms require both JWT_ACCESS_PRIVATE_KEY and JWT_ACCESS_PUBLIC_KEY',
      })
    }

    if (env.COOKIE_SAMESITE === 'none' && env.COOKIE_SECURE === false) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SAMESITE=none requires COOKIE_SECURE=true (browser rule)',
      })
    }

    if (env.GOOGLE_OAUTH_ENABLED) {
      if (!env.GOOGLE_OAUTH_CLIENT_ID) {
        ctx.addIssue({
          code: 'custom',
          path: ['GOOGLE_OAUTH_CLIENT_ID'],
          message: 'GOOGLE_OAUTH_CLIENT_ID is required when GOOGLE_OAUTH_ENABLED=true',
        })
      }
      if (!env.GOOGLE_OAUTH_CLIENT_SECRET) {
        ctx.addIssue({
          code: 'custom',
          path: ['GOOGLE_OAUTH_CLIENT_SECRET'],
          message: 'GOOGLE_OAUTH_CLIENT_SECRET is required when GOOGLE_OAUTH_ENABLED=true',
        })
      }
      if (!env.GOOGLE_OAUTH_REDIRECT_URI) {
        ctx.addIssue({
          code: 'custom',
          path: ['GOOGLE_OAUTH_REDIRECT_URI'],
          message: 'GOOGLE_OAUTH_REDIRECT_URI is required when GOOGLE_OAUTH_ENABLED=true',
        })
      }
    }
  })

export type ServerEnv = z.infer<typeof serverEnvSchema>

export const parseServerEnv = (raw: NodeJS.ProcessEnv = process.env): ServerEnv => {
  const result = serverEnvSchema.safeParse(raw)
  if (!result.success) {
    throw new EnvValidationError('server', formatZodIssues(result.error))
  }
  return result.data
}

let cached: ServerEnv | undefined

export const getServerEnv = (raw: NodeJS.ProcessEnv = process.env): ServerEnv => {
  if (cached === undefined) {
    cached = parseServerEnv(raw)
  }
  return cached
}

export const resetServerEnvCache = (): void => {
  cached = undefined
}

export const isProduction = (env: Pick<ServerEnv, 'NODE_ENV'>): boolean => env.NODE_ENV === 'production'

export const isDevelopment = (env: Pick<ServerEnv, 'NODE_ENV'>): boolean =>
  env.NODE_ENV === 'development'

export const isTest = (env: Pick<ServerEnv, 'NODE_ENV'>): boolean => env.NODE_ENV === 'test'

export type AuthConfig = {
  jwt: {
    algorithm: ServerEnv['JWT_ACCESS_ALG']
    secret?: string
    privateKey?: string
    publicKey?: string
    accessTtlSeconds: number
    issuer: string
    audience: string
  }
  refresh: {
    ttlDays: number
    rotate: boolean
    detectReuse: boolean
    inactivityDays: number
    absoluteMaxDays: number
    graceSeconds: number
  }
  password: {
    minLength: number
    requireMixedCase: boolean
    requireDigit: boolean
    requireSymbol: boolean
    argon2TimeCost: number
    argon2MemoryCostKib: number
    argon2Parallelism: number
  }
  login: {
    maxFailedAttempts: number
    lockoutMinutes: number
  }
  social: {
    google: {
      enabled: boolean
      clientId?: string
      clientSecret?: string
      redirectUri?: string
    }
  }
  invites: {
    linkBaseUrl: string
    fromEmail: string
    defaultExpiresDays: number
    resendCooldownSeconds: number
    resendCooldownOwnerSeconds: number
    resendCooldownAdminSeconds: number
  }
}

/**
 * Derive a grouped auth config view from a flat validated server env.
 * Keeping the flat shape for env parity, but apps consume this typed grouping.
 */
export const buildAuthConfig = (env: ServerEnv): AuthConfig => ({
  jwt: {
    algorithm: env.JWT_ACCESS_ALG,
    secret: env.JWT_ACCESS_SECRET,
    privateKey: env.JWT_ACCESS_PRIVATE_KEY,
    publicKey: env.JWT_ACCESS_PUBLIC_KEY,
    accessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },
  refresh: {
    ttlDays: env.REFRESH_TTL_DAYS,
    rotate: env.REFRESH_ROTATION === 'enabled',
    detectReuse: env.REFRESH_REUSE_DETECTION === 'enabled',
    inactivityDays: env.REFRESH_INACTIVITY_DAYS,
    absoluteMaxDays: env.REFRESH_ABSOLUTE_MAX_DAYS,
    graceSeconds: env.REFRESH_GRACE_SECONDS,
  },
  password: {
    minLength: env.PASSWORD_MIN_LENGTH,
    requireMixedCase: env.PASSWORD_REQUIRE_MIXED_CASE,
    requireDigit: env.PASSWORD_REQUIRE_DIGIT,
    requireSymbol: env.PASSWORD_REQUIRE_SYMBOL,
    argon2TimeCost: env.ARGON2_TIME_COST,
    argon2MemoryCostKib: env.ARGON2_MEMORY_COST_KIB,
    argon2Parallelism: env.ARGON2_PARALLELISM,
  },
  login: {
    maxFailedAttempts: env.LOGIN_MAX_FAILED_ATTEMPTS,
    lockoutMinutes: env.LOGIN_LOCKOUT_MINUTES,
  },
  social: {
    google: {
      enabled: env.GOOGLE_OAUTH_ENABLED,
      clientId: env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI,
    },
  },
  invites: {
    linkBaseUrl: env.INVITE_LINK_BASE_URL,
    fromEmail: env.INVITE_EMAIL_FROM,
    defaultExpiresDays: env.INVITE_DEFAULT_EXPIRES_DAYS,
    resendCooldownSeconds: env.INVITE_RESEND_COOLDOWN_SECONDS,
    resendCooldownOwnerSeconds:
      env.INVITE_RESEND_COOLDOWN_OWNER_SECONDS ?? env.INVITE_RESEND_COOLDOWN_SECONDS,
    resendCooldownAdminSeconds:
      env.INVITE_RESEND_COOLDOWN_ADMIN_SECONDS ?? env.INVITE_RESEND_COOLDOWN_SECONDS,
  },
})

export type CookieConfig = {
  enabled: boolean
  domain?: string
  sameSite: ServerEnv['COOKIE_SAMESITE']
  secure: boolean
  path: string
  accessName: string
  refreshName: string
  csrfName: string
}

const HOST_PREFIX = '__Host-'
const SECURE_PREFIX = '__Secure-'

/**
 * `__Host-` requires: Secure + Path=/ + no Domain. Fall back to `__Secure-` (or bare)
 * when any of those are violated. Bare names used in dev so http://localhost works.
 */
const resolveCookieName = (rawName: string, secure: boolean, domain: string | undefined, path: string): string => {
  const stripped = rawName.replace(/^(__Host-|__Secure-)/, '')
  if (!secure) {
    return stripped
  }
  if (!domain && path === '/') {
    return `${HOST_PREFIX}${stripped}`
  }
  return `${SECURE_PREFIX}${stripped}`
}

export const buildCookieConfig = (env: ServerEnv): CookieConfig => {
  const secure = env.COOKIE_SECURE ?? env.NODE_ENV !== 'development'
  const baseAccess = env.COOKIE_ACCESS_NAME ?? 'autocare.access'
  const baseRefresh = env.COOKIE_REFRESH_NAME ?? 'autocare.refresh'
  return {
    enabled: env.COOKIE_ENABLED,
    domain: env.COOKIE_DOMAIN,
    sameSite: env.COOKIE_SAMESITE,
    secure,
    path: env.COOKIE_PATH,
    accessName: resolveCookieName(baseAccess, secure, env.COOKIE_DOMAIN, env.COOKIE_PATH),
    refreshName: resolveCookieName(baseRefresh, secure, env.COOKIE_DOMAIN, env.COOKIE_PATH),
    csrfName: env.CSRF_COOKIE_NAME,
  }
}

export type CsrfConfig = {
  enabled: boolean
  cookieName: string
  headerName: string
  tokenTtlMinutes: number
}

export const buildCsrfConfig = (env: ServerEnv): CsrfConfig => ({
  enabled: env.CSRF_ENABLED ?? env.COOKIE_ENABLED,
  cookieName: env.CSRF_COOKIE_NAME,
  headerName: env.CSRF_HEADER_NAME,
  tokenTtlMinutes: env.CSRF_TOKEN_TTL_MINUTES,
})
