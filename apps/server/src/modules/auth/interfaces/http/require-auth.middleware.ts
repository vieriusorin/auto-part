import type { CookieConfig } from '@autocare/config/server'
import type { Permission, UserRole } from '@autocare/shared'
import type { RequestHandler } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import type { UserRepository } from '../../infrastructure/user-repository.js'
import type { JwtSigner } from '../../infrastructure/jwt-signer.js'

export type RequireAuthDeps = {
  jwtSigner: JwtSigner
  cookieConfig: CookieConfig
  users: UserRepository
  permissionsForRole: (role: UserRole) => Permission[]
}

const extractBearerToken = (header: string | undefined): string | undefined => {
  if (!header) return undefined
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match?.[1]?.trim() ?? undefined
}

/**
 * requireAuth accepts either:
 *   - Authorization: Bearer <jwt>  (mobile, server-to-server, tests)
 *   - Access cookie                (browser)
 *
 * The access JWT is stateless (no DB lookup). Refresh tokens are the only
 * credential that touches the DB.
 */
export const createRequireAuthMiddleware = (deps: RequireAuthDeps): RequestHandler => {
  return async (req, res, next) => {
    const bearer = extractBearerToken(req.headers.authorization)
    const cookieToken = deps.cookieConfig.enabled
      ? (req as { cookies?: Record<string, string> }).cookies?.[deps.cookieConfig.accessName]
      : undefined

    const token = bearer ?? cookieToken
    if (!token) {
      commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
      return
    }

    try {
      const claims = await deps.jwtSigner.verify(token)
      const user = await deps.users.findById(claims.sub)
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationPlan: user.organizationPlan,
        planOverride: user.planOverride,
        effectivePlan: user.effectivePlan,
        permissions: deps.permissionsForRole(user.role),
        tokenId: claims.jti,
      }
      next()
    } catch {
      commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
    }
  }
}
