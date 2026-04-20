import { randomBytes } from 'node:crypto'
import type { CookieConfig, CsrfConfig } from '@autocare/config/server'
import type { Response } from 'express'
import type { IssuedAccessToken, IssuedRefreshToken } from '../../domain/types.js'

type CookieOptions = {
  httpOnly?: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
  domain?: string
  path: string
  expires?: Date
  maxAge?: number
}

const toExpressCookieOptions = (
  config: CookieConfig,
  opts: { expires?: Date; httpOnly?: boolean },
): CookieOptions => {
  const options: CookieOptions = {
    httpOnly: opts.httpOnly ?? true,
    secure: config.secure,
    sameSite: config.sameSite,
    path: config.path,
  }
  if (config.domain) {
    options.domain = config.domain
  }
  if (opts.expires) {
    options.expires = opts.expires
  }
  return options
}

export const setSessionCookies = (
  res: Response,
  config: CookieConfig,
  tokens: { access: IssuedAccessToken; refresh: IssuedRefreshToken },
): void => {
  if (!config.enabled) {
    return
  }
  res.cookie(
    config.accessName,
    tokens.access.token,
    toExpressCookieOptions(config, { expires: tokens.access.expiresAt }),
  )
  res.cookie(
    config.refreshName,
    tokens.refresh.rawToken,
    toExpressCookieOptions(config, { expires: tokens.refresh.expiresAt }),
  )
}

export const clearSessionCookies = (res: Response, config: CookieConfig): void => {
  if (!config.enabled) {
    return
  }
  const base = toExpressCookieOptions(config, { expires: new Date(0) })
  res.clearCookie(config.accessName, base)
  res.clearCookie(config.refreshName, base)
}

/**
 * CSRF double-submit token: random opaque value issued as a readable cookie
 * (not httpOnly) on login/refresh; client reads it and echoes it back in
 * `X-CSRF-Token` on state-changing requests. Server compares cookie vs header.
 */
export const setCsrfCookie = (
  res: Response,
  cookieConfig: CookieConfig,
  csrfConfig: CsrfConfig,
): string => {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + csrfConfig.tokenTtlMinutes * 60 * 1000)
  res.cookie(csrfConfig.cookieName, token, {
    httpOnly: false,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    domain: cookieConfig.domain,
    path: cookieConfig.path,
    expires,
  })
  return token
}

export const clearCsrfCookie = (
  res: Response,
  cookieConfig: CookieConfig,
  csrfConfig: CsrfConfig,
): void => {
  res.clearCookie(csrfConfig.cookieName, {
    httpOnly: false,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    domain: cookieConfig.domain,
    path: cookieConfig.path,
    expires: new Date(0),
  })
}

export const readRefreshTokenFromRequest = (
  req: { cookies?: Record<string, string>; body?: { refreshToken?: string } },
  cookieConfig: CookieConfig,
): string | undefined => {
  const fromCookie = req.cookies?.[cookieConfig.refreshName]
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie
  }
  const fromBody = req.body?.refreshToken
  if (typeof fromBody === 'string' && fromBody.length > 0) {
    return fromBody
  }
  return undefined
}
