import {
  AcceptInviteRequestSchema,
  AcceptInviteAndRegisterRequestSchema,
  AuthSessionResponseDataSchema,
  ChangePasswordRequestSchema,
  CreateOrganizationInviteRequestSchema,
  LoginRequestSchema,
  ListOrganizationInvitesResponseDataSchema,
  LogoutResponseDataSchema,
  MeResponseDataSchema,
  InviteIdParamsSchema,
  InvitePreviewResponseDataSchema,
  InviteTokenParamsSchema,
  OrganizationIdParamsSchema,
  OrganizationInviteResponseSchema,
  RefreshRequestSchema,
  RegisterRequestSchema,
  GoogleSocialExchangeRequestSchema,
  SocialAuthStartResponseDataSchema,
  type UserProfile,
} from '@autocare/shared'
import { Router } from 'express'
import { authRateLimiter } from '../../../../interfaces/http/middlewares/security.middleware.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { permissionsForRole } from '../../application/permissions.js'
import type { AuthModule } from '../../auth-module.js'
import type { IssuedAccessToken, IssuedRefreshToken, UserRecord } from '../../domain/types.js'
import { socialAuthDisabled } from '../../domain/errors.js'
import { detectClientKind } from './client-detection.js'
import {
  clearCsrfCookie,
  clearSessionCookies,
  readRefreshTokenFromRequest,
  setCsrfCookie,
  setSessionCookies,
} from './cookie-helper.js'
import { createCsrfMiddleware } from './csrf.middleware.js'
import type { AuthHttpGuards } from './auth-http-guards.js'
import { createRequireAuthMiddleware } from './require-auth.middleware.js'

const AUTH_TAG = 'Auth'
const ORG_TAG = 'Organizations'

const maskEmail = (email: string): string => {
  const [local, domain = ''] = email.split('@')
  const head = local.slice(0, 2)
  const maskedLocal = `${head}${'*'.repeat(Math.max(1, local.length - 2))}`
  return `${maskedLocal}@${domain}`
}

const mapInvite = (
  invite: import('../../domain/types.js').OrganizationInviteRecord,
) => ({
  id: invite.id,
  organizationId: invite.organizationId,
  email: invite.email,
  role: invite.role,
  expiresAt: invite.expiresAt.toISOString(),
  acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
  revokedAt: invite.revokedAt ? invite.revokedAt.toISOString() : null,
  invitedBy: invite.invitedBy,
  acceptedBy: invite.acceptedBy,
  createdAt: invite.createdAt.toISOString(),
})

const toUserProfile = (user: UserRecord): UserProfile => ({
  id: user.id,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
  organizationPlan: user.organizationPlan,
  planOverride: user.planOverride,
  effectivePlan: user.effectivePlan,
  emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
  createdAt: user.createdAt.toISOString(),
  permissions: permissionsForRole(user.role),
})

const buildSessionResponse = (
  user: UserRecord,
  access: IssuedAccessToken,
  refresh: IssuedRefreshToken,
  csrfToken: string | undefined,
  shouldReturnTokensInBody: boolean,
) => ({
  user: toUserProfile(user),
  tokens: {
    accessToken: shouldReturnTokensInBody ? access.token : '',
    accessTokenExpiresAt: access.expiresAt.toISOString(),
    refreshToken: shouldReturnTokensInBody ? refresh.rawToken : undefined,
    refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
  },
  csrfToken,
})

export const createAuthRouter = (authModule: AuthModule): Router => {
  const router = Router()

  router.use(authRateLimiter)

  const requireAuth = createRequireAuthMiddleware({
    jwtSigner: authModule.jwtSigner,
    cookieConfig: authModule.cookieConfig,
    users: authModule.users,
  })
  const requireCsrf = createCsrfMiddleware(authModule.csrfConfig, authModule.cookieConfig)

  const respondWithSession = (
    res: import('express').Response,
    req: import('express').Request,
    user: UserRecord,
    access: IssuedAccessToken,
    refresh: IssuedRefreshToken,
    status: 200 | 201,
  ) => {
    const clientKind = detectClientKind(req)
    const useCookies = authModule.cookieConfig.enabled && clientKind === 'web'

    if (useCookies) {
      setSessionCookies(res, authModule.cookieConfig, { access, refresh })
    }

    const csrfToken =
      useCookies && authModule.csrfConfig.enabled
        ? setCsrfCookie(res, authModule.cookieConfig, authModule.csrfConfig)
        : undefined

    const shouldReturnTokensInBody = !useCookies

    const data = buildSessionResponse(user, access, refresh, csrfToken, shouldReturnTokensInBody)
    if (status === 201) {
      commonPresenter.created(res, data)
    } else {
      commonPresenter.ok(res, data)
    }
  }

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/register',
    tags: [AUTH_TAG],
    summary: 'Register a new user',
    operationId: 'authRegister',
    body: RegisterRequestSchema,
    responses: {
      201: { description: 'Registered', dataSchema: AuthSessionResponseDataSchema },
    },
    handler: async ({ req, res, body }) => {
      const clientKind = detectClientKind(req)
      const { user, access, refresh } = await authModule.useCases.register(body!, {
        clientKind,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      })
      respondWithSession(res, req, user, access, refresh, 201)
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/invites/accept',
    tags: [AUTH_TAG],
    summary: 'Accept invite for authenticated user',
    operationId: 'authAcceptInvite',
    body: AcceptInviteRequestSchema,
    middlewares: [requireAuth],
    responses: {
      200: {
        description: 'Invite accepted',
        dataSchema: OrganizationInviteResponseSchema,
      },
    },
    handler: async ({ req, body, res }) => {
      const user = await authModule.users.findById(req.user!.id)
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const invite = await authModule.useCases.acceptInvite({ token: body!.token }, user)
      commonPresenter.ok(res, mapInvite(invite))
    },
  })

  registerRoute(router, '/auth', {
    method: 'get',
    path: '/invites/:token/preview',
    tags: [AUTH_TAG],
    summary: 'Preview an invite token',
    operationId: 'authInvitePreview',
    params: InviteTokenParamsSchema,
    responses: {
      200: {
        description: 'Invite preview',
        dataSchema: InvitePreviewResponseDataSchema,
      },
    },
    handler: async ({ params, res }) => {
      const invite = await authModule.useCases.previewOrganizationInvite(params!.token)
      commonPresenter.ok(res, {
        organizationId: invite.organizationId,
        emailMasked: maskEmail(invite.email),
        role: invite.role,
        expiresAt: invite.expiresAt.toISOString(),
      })
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/invites/accept-and-register',
    tags: [AUTH_TAG],
    summary: 'Accept invite and register a new account',
    operationId: 'authAcceptInviteAndRegister',
    body: AcceptInviteAndRegisterRequestSchema,
    responses: {
      201: {
        description: 'Registered from invite',
        dataSchema: AuthSessionResponseDataSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      const clientKind = detectClientKind(req)
      const { user, access, refresh } = await authModule.useCases.acceptInviteAndRegister(
        { token: body!.token, password: body!.password },
        {
          clientKind,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        },
      )
      respondWithSession(res, req, user, access, refresh, 201)
    },
  })

  registerRoute(router, '/auth', {
    method: 'get',
    path: '/social/google/start',
    tags: [AUTH_TAG],
    summary: 'Get Google OAuth authorization URL',
    operationId: 'authSocialGoogleStart',
    responses: {
      200: { description: 'Authorization URL', dataSchema: SocialAuthStartResponseDataSchema },
    },
    handler: async ({ res }) => {
      if (!authModule.config.social.google.enabled) {
        throw socialAuthDisabled()
      }
      const authorizationUrl = authModule.googleOauth.createAuthorizationUrl()
      commonPresenter.ok(res, {
        provider: 'google' as const,
        authorizationUrl,
      })
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/social/google/exchange',
    tags: [AUTH_TAG],
    summary: 'Exchange Google OAuth code and create authenticated session',
    operationId: 'authSocialGoogleExchange',
    body: GoogleSocialExchangeRequestSchema,
    responses: {
      200: { description: 'Authenticated', dataSchema: AuthSessionResponseDataSchema },
    },
    handler: async ({ req, res, body }) => {
      const clientKind = detectClientKind(req)
      const { user, access, refresh } = await authModule.useCases.socialLogin(
        {
          provider: 'google',
          code: body!.code,
          redirectUri: body!.redirectUri,
        },
        {
          clientKind,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        },
      )
      respondWithSession(res, req, user, access, refresh, 200)
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/login',
    tags: [AUTH_TAG],
    summary: 'Authenticate with email + password',
    operationId: 'authLogin',
    body: LoginRequestSchema,
    responses: {
      200: { description: 'Authenticated', dataSchema: AuthSessionResponseDataSchema },
    },
    handler: async ({ req, res, body }) => {
      const clientKind = detectClientKind(req)
      const { user, access, refresh } = await authModule.useCases.login(body!, {
        clientKind,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      })
      respondWithSession(res, req, user, access, refresh, 200)
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/refresh',
    tags: [AUTH_TAG],
    summary: 'Exchange a refresh token for a new session',
    operationId: 'authRefresh',
    body: RefreshRequestSchema,
    responses: {
      200: { description: 'New session', dataSchema: AuthSessionResponseDataSchema },
    },
    handler: async ({ req, res, body }) => {
      const clientKind = detectClientKind(req)
      const rawToken = readRefreshTokenFromRequest(
        { cookies: (req as { cookies?: Record<string, string> }).cookies, body },
        authModule.cookieConfig,
      )
      if (!rawToken) {
        commonPresenter.error(res, 401, 'refresh_token_invalid', 'Refresh token missing')
        return
      }
      const { user, access, refresh } = await authModule.useCases.refresh(rawToken, {
        clientKind,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      })
      respondWithSession(res, req, user, access, refresh, 200)
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/logout',
    tags: [AUTH_TAG],
    summary: 'Revoke current refresh token',
    operationId: 'authLogout',
    middlewares: [requireCsrf],
    responses: {
      200: { description: 'Logged out', dataSchema: LogoutResponseDataSchema },
    },
    handler: async ({ req, res }) => {
      const rawToken = readRefreshTokenFromRequest(
        { cookies: (req as { cookies?: Record<string, string> }).cookies, body: req.body },
        authModule.cookieConfig,
      )
      await authModule.useCases.logout(rawToken)
      clearSessionCookies(res, authModule.cookieConfig)
      clearCsrfCookie(res, authModule.cookieConfig, authModule.csrfConfig)
      commonPresenter.ok(res, { loggedOut: true as const })
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/logout-all',
    tags: [AUTH_TAG],
    summary: 'Revoke all sessions for the authenticated user',
    operationId: 'authLogoutAll',
    middlewares: [requireAuth, requireCsrf],
    responses: {
      200: { description: 'All sessions revoked', dataSchema: LogoutResponseDataSchema },
    },
    handler: async ({ req, res }) => {
      await authModule.useCases.logoutAll(req.user!.id)
      clearSessionCookies(res, authModule.cookieConfig)
      clearCsrfCookie(res, authModule.cookieConfig, authModule.csrfConfig)
      commonPresenter.ok(res, { loggedOut: true as const })
    },
  })

  registerRoute(router, '/auth', {
    method: 'get',
    path: '/me',
    tags: [AUTH_TAG],
    summary: 'Get current user profile',
    operationId: 'authMe',
    middlewares: [requireAuth],
    responses: {
      200: { description: 'Current user', dataSchema: MeResponseDataSchema },
    },
    handler: async ({ req, res }) => {
      const user = await authModule.users.findById(req.user!.id)
      if (!user) {
        commonPresenter.error(res, 404, 'user_not_found', 'User not found')
        return
      }
      commonPresenter.ok(res, toUserProfile(user))
    },
  })

  registerRoute(router, '/auth', {
    method: 'post',
    path: '/change-password',
    tags: [AUTH_TAG],
    summary: 'Change password for current user',
    operationId: 'authChangePassword',
    body: ChangePasswordRequestSchema,
    middlewares: [requireAuth, requireCsrf],
    responses: {
      200: { description: 'Password changed', dataSchema: LogoutResponseDataSchema },
    },
    handler: async ({ req, res, body }) => {
      await authModule.useCases.changePassword(
        req.user!.id,
        body!.currentPassword,
        body!.newPassword,
      )
      clearSessionCookies(res, authModule.cookieConfig)
      clearCsrfCookie(res, authModule.cookieConfig, authModule.csrfConfig)
      commonPresenter.ok(res, { loggedOut: true as const })
    },
  })

  return router
}

export const createAuthApiRouter = (
  authModule: AuthModule,
  authHttpGuards?: AuthHttpGuards,
): Router => {
  const router = Router()
  const requireAuth =
    authHttpGuards?.requireAuth ??
    createRequireAuthMiddleware({
      jwtSigner: authModule.jwtSigner,
      cookieConfig: authModule.cookieConfig,
      users: authModule.users,
    })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/organizations/:orgId/invites',
    tags: [ORG_TAG],
    summary: 'Create organization invite',
    operationId: 'createOrganizationInvite',
    params: OrganizationIdParamsSchema,
    body: CreateOrganizationInviteRequestSchema,
    middlewares: [requireAuth],
    responses: {
      201: {
        description: 'Invite created',
        dataSchema: OrganizationInviteResponseSchema,
      },
    },
    handler: async ({ req, res, params, body }) => {
      const actor = await authModule.users.findById(req.user!.id)
      if (!actor) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const { invite, rawToken } = await authModule.useCases.createOrganizationInvite(
        {
          organizationId: params!.orgId,
          email: body!.email,
          role: body!.role,
          expiresInDays: body!.expiresInDays,
        },
        actor,
      )
      await authModule.inviteEmailSender.sendOrganizationInvite({
        toEmail: invite.email,
        inviterUserId: actor.id,
        organizationId: invite.organizationId,
        role: invite.role,
        inviteToken: rawToken,
        expiresAt: invite.expiresAt,
      })
      commonPresenter.created(res, mapInvite(invite))
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/organizations/:orgId/invites/:inviteId/resend',
    tags: [ORG_TAG],
    summary: 'Resend organization invite',
    operationId: 'resendOrganizationInvite',
    params: InviteIdParamsSchema,
    middlewares: [requireAuth],
    responses: {
      200: {
        description: 'Invite resent',
        dataSchema: OrganizationInviteResponseSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const actor = await authModule.users.findById(req.user!.id)
      if (!actor) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const { invite, rawToken } = await authModule.useCases.resendOrganizationInvite(
        params!.inviteId,
        params!.orgId,
        actor,
      )
      await authModule.inviteEmailSender.sendOrganizationInvite({
        toEmail: invite.email,
        inviterUserId: actor.id,
        organizationId: invite.organizationId,
        role: invite.role,
        inviteToken: rawToken,
        expiresAt: invite.expiresAt,
      })
      commonPresenter.ok(res, mapInvite(invite))
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/organizations/:orgId/invites',
    tags: [ORG_TAG],
    summary: 'List organization invites',
    operationId: 'listOrganizationInvites',
    params: OrganizationIdParamsSchema,
    middlewares: [requireAuth],
    responses: {
      200: {
        description: 'Invites',
        dataSchema: ListOrganizationInvitesResponseDataSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const actor = await authModule.users.findById(req.user!.id)
      if (!actor) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const invites = await authModule.useCases.listOrganizationInvites(params!.orgId, actor)
      commonPresenter.ok(res, { items: invites.map(mapInvite) })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/organizations/:orgId/invites/:inviteId/revoke',
    tags: [ORG_TAG],
    summary: 'Revoke organization invite',
    operationId: 'revokeOrganizationInvite',
    params: InviteIdParamsSchema,
    middlewares: [requireAuth],
    responses: {
      200: {
        description: 'Invite revoked',
        dataSchema: OrganizationInviteResponseSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const actor = await authModule.users.findById(req.user!.id)
      if (!actor) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const invite = await authModule.useCases.revokeOrganizationInvite(
        params!.inviteId,
        params!.orgId,
        actor,
      )
      commonPresenter.ok(res, mapInvite(invite))
    },
  })

  return router
}
