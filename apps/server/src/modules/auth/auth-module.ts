import {
  buildAuthConfig,
  buildCookieConfig,
  buildCsrfConfig,
  type ServerEnv,
} from '@autocare/config/server'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  type ChangePasswordUseCase,
  createChangePasswordUseCase,
} from './application/change-password-use-case.js'
import { createLoginUseCase, type LoginUseCase } from './application/login-use-case.js'
import {
  createAuthorizationService,
  type AuthorizationService,
} from './application/authorization-service.js'
import {
  createAcceptInviteUseCase,
  createAcceptInviteAndRegisterUseCase,
  createListOrganizationInvitesUseCase,
  createOrganizationInviteUseCase,
  createPreviewInviteUseCase,
  createResendOrganizationInviteUseCase,
  createRevokeOrganizationInviteUseCase,
  type AcceptInviteUseCase,
  type AcceptInviteAndRegisterUseCase,
  type CreateOrganizationInviteUseCase,
  type ListOrganizationInvitesUseCase,
  type PreviewInviteUseCase,
  type ResendOrganizationInviteUseCase,
  type RevokeOrganizationInviteUseCase,
} from './application/organization-invite-use-cases.js'
import {
  createLogoutAllUseCase,
  createLogoutUseCase,
  type LogoutAllUseCase,
  type LogoutUseCase,
} from './application/logout-use-case.js'
import { createRefreshUseCase, type RefreshUseCase } from './application/refresh-use-case.js'
import { createRegisterUseCase, type RegisterUseCase } from './application/register-use-case.js'
import {
  createSocialLoginUseCase,
  type SocialLoginUseCase,
} from './application/social-login-use-case.js'
import { createSessionService } from './application/session-service.js'
import { type Clock, systemClock } from './infrastructure/clock.js'
import { getAuthDb } from './infrastructure/db.js'
import { createJwtSigner, type JwtSigner } from './infrastructure/jwt-signer.js'
import { createPasswordHasher, createPasswordPolicy } from './infrastructure/password-hasher.js'
import {
  createRefreshTokenRepository,
  type RefreshTokenRepository,
} from './infrastructure/refresh-token-repository.js'
import { createTokenGenerator, type TokenGenerator } from './infrastructure/token-generator.js'
import { createUserRepository, type UserRepository } from './infrastructure/user-repository.js'
import { createGoogleOauthClient } from './infrastructure/google-oauth-client.js'
import type { GoogleOauthClient } from './infrastructure/google-oauth-client.js'
import {
  createLoggingInviteEmailSender,
  type InviteEmailSender,
} from './infrastructure/invite-email-sender.js'
import {
  createOrganizationInviteRepository,
  type OrganizationInviteRepository,
} from './infrastructure/organization-invite-repository.js'

export type AuthModule = {
  config: ReturnType<typeof buildAuthConfig>
  cookieConfig: ReturnType<typeof buildCookieConfig>
  csrfConfig: ReturnType<typeof buildCsrfConfig>
  jwtSigner: JwtSigner
  tokenGenerator: TokenGenerator
  googleOauth: GoogleOauthClient
  /** Shared Drizzle client for auth-adjacent domain modules (e.g. vehicles). */
  db: NodePgDatabase
  users: UserRepository
  refreshTokens: RefreshTokenRepository
  organizationInvites: OrganizationInviteRepository
  inviteEmailSender: InviteEmailSender
  clock: Clock
  authorization: AuthorizationService
  useCases: {
    register: RegisterUseCase
    login: LoginUseCase
    refresh: RefreshUseCase
    socialLogin: SocialLoginUseCase
    createOrganizationInvite: CreateOrganizationInviteUseCase
    listOrganizationInvites: ListOrganizationInvitesUseCase
    revokeOrganizationInvite: RevokeOrganizationInviteUseCase
    resendOrganizationInvite: ResendOrganizationInviteUseCase
    previewOrganizationInvite: PreviewInviteUseCase
    acceptInviteAndRegister: AcceptInviteAndRegisterUseCase
    acceptInvite: AcceptInviteUseCase
    logout: LogoutUseCase
    logoutAll: LogoutAllUseCase
    changePassword: ChangePasswordUseCase
  }
}

export type AuthModuleOverrides = {
  db?: NodePgDatabase
  clock?: Clock
  users?: UserRepository
  refreshTokens?: RefreshTokenRepository
  organizationInvites?: OrganizationInviteRepository
  inviteEmailSender?: InviteEmailSender
}

export const createAuthModule = async (
  env: ServerEnv,
  overrides: AuthModuleOverrides = {},
): Promise<AuthModule> => {
  const authConfig = buildAuthConfig(env)
  const cookieConfig = buildCookieConfig(env)
  const csrfConfig = buildCsrfConfig(env)
  const clock = overrides.clock ?? systemClock

  const db = overrides.db ?? getAuthDb(env.DATABASE_URL)
  const users = overrides.users ?? createUserRepository(db)
  const refreshTokens = overrides.refreshTokens ?? createRefreshTokenRepository(db)
  const organizationInvites =
    overrides.organizationInvites ?? createOrganizationInviteRepository(db)

  const passwordHasher = createPasswordHasher(authConfig.password)
  const passwordPolicy = createPasswordPolicy(authConfig.password)
  const tokenGenerator = createTokenGenerator()
  const jwtSigner = await createJwtSigner(authConfig.jwt, clock)
  const googleOauthClient = createGoogleOauthClient({
    clientId: authConfig.social.google.clientId ?? '',
    clientSecret: authConfig.social.google.clientSecret ?? '',
    redirectUri: authConfig.social.google.redirectUri ?? '',
  })
  const inviteEmailSender =
    overrides.inviteEmailSender ??
    createLoggingInviteEmailSender({
      inviteBaseUrl: authConfig.invites.linkBaseUrl,
      fromEmail: authConfig.invites.fromEmail,
    })

  const sessionService = createSessionService({
    config: authConfig,
    jwtSigner,
    tokenGenerator,
    refreshTokens,
    clock,
  })
  const authorization = createAuthorizationService()

  return {
    config: authConfig,
    cookieConfig,
    csrfConfig,
    jwtSigner,
    tokenGenerator,
    googleOauth: googleOauthClient,
    db,
    users,
    refreshTokens,
    organizationInvites,
    inviteEmailSender,
    clock,
    authorization,
    useCases: {
      register: createRegisterUseCase({
        userRepository: users,
        passwordHasher,
        passwordPolicy,
        sessionService,
      }),
      login: createLoginUseCase({
        loginConfig: authConfig.login,
        clock,
        userRepository: users,
        passwordHasher,
        sessionService,
      }),
      refresh: createRefreshUseCase({
        refreshConfig: authConfig.refresh,
        clock,
        tokenGenerator,
        refreshTokens,
        users,
        sessionService,
      }),
      socialLogin: createSocialLoginUseCase({
        enabled: authConfig.social.google.enabled,
        users,
        passwordHasher,
        googleClient: googleOauthClient,
        sessionService,
      }),
      createOrganizationInvite: createOrganizationInviteUseCase({
        invites: organizationInvites,
        clock,
        defaultExpiresDays: authConfig.invites.defaultExpiresDays,
        authorization,
      }),
      listOrganizationInvites: createListOrganizationInvitesUseCase({
        invites: organizationInvites,
        authorization,
      }),
      revokeOrganizationInvite: createRevokeOrganizationInviteUseCase({
        invites: organizationInvites,
        clock,
        authorization,
      }),
      resendOrganizationInvite: createResendOrganizationInviteUseCase({
        invites: organizationInvites,
        clock,
        defaultExpiresDays: authConfig.invites.defaultExpiresDays,
        resendCooldownMs: authConfig.invites.resendCooldownSeconds * 1000,
        resendCooldownOwnerMs: authConfig.invites.resendCooldownOwnerSeconds * 1000,
        resendCooldownAdminMs: authConfig.invites.resendCooldownAdminSeconds * 1000,
        authorization,
      }),
      previewOrganizationInvite: createPreviewInviteUseCase({
        invites: organizationInvites,
        clock,
      }),
      acceptInviteAndRegister: createAcceptInviteAndRegisterUseCase({
        invites: organizationInvites,
        users,
        passwordHasher,
        passwordPolicy,
        sessionService,
        clock,
      }),
      acceptInvite: createAcceptInviteUseCase({
        invites: organizationInvites,
        users,
        clock,
      }),
      logout: createLogoutUseCase({ refreshTokens, tokenGenerator, clock }),
      logoutAll: createLogoutAllUseCase({ refreshTokens, clock }),
      changePassword: createChangePasswordUseCase({
        users,
        refreshTokens,
        passwordHasher,
        passwordPolicy,
        clock,
      }),
    },
  }
}
