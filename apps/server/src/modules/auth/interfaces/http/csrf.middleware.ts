import { timingSafeEqual } from 'node:crypto'
import type { CookieConfig, CsrfConfig } from '@autocare/config/server'
import type { RequestHandler } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { detectClientKind } from './client-detection.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const constantEquals = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

/**
 * Double-submit CSRF protection. Applied only to browser clients carrying
 * cookies; mobile/server clients using Authorization: Bearer are naturally
 * CSRF-immune because attackers can't forge that header cross-origin.
 */
export const createCsrfMiddleware = (
  csrfConfig: CsrfConfig,
  cookieConfig: CookieConfig,
): RequestHandler => {
  return (req, res, next) => {
    if (!csrfConfig.enabled || !cookieConfig.enabled) {
      next()
      return
    }
    if (SAFE_METHODS.has(req.method)) {
      next()
      return
    }

    const clientKind = detectClientKind(req)
    if (clientKind !== 'web') {
      next()
      return
    }

    const cookieToken = (req as { cookies?: Record<string, string> }).cookies?.[
      csrfConfig.cookieName
    ]
    const headerToken = req.headers[csrfConfig.headerName]
    const headerValue = Array.isArray(headerToken) ? headerToken[0] : headerToken

    if (typeof cookieToken !== 'string' || cookieToken.length === 0) {
      commonPresenter.error(res, 403, 'csrf_required', 'CSRF token required')
      return
    }
    if (typeof headerValue !== 'string' || !constantEquals(cookieToken, headerValue)) {
      commonPresenter.error(res, 403, 'csrf_invalid', 'CSRF token invalid')
      return
    }
    next()
  }
}
