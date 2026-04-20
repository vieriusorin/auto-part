import { z } from 'zod'

export const ClientKindSchema = z.enum(['web', 'mobile', 'server'])
export type ClientKind = z.infer<typeof ClientKindSchema>

export const UserRoleSchema = z.enum(['user', 'admin'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const PlanTierSchema = z.enum(['free', 'premium'])
export type PlanTier = z.infer<typeof PlanTierSchema>

export const SocialProviderSchema = z.enum(['google'])
export type SocialProvider = z.infer<typeof SocialProviderSchema>

export const OrganizationInviteRoleSchema = z.enum([
  'owner',
  'admin',
  'manager',
  'driver',
  'viewer',
])
export type OrganizationInviteRole = z.infer<typeof OrganizationInviteRoleSchema>

const emailSchema = z.string().email().max(254).transform((value) => value.trim().toLowerCase())

const passwordSchema = z.string().min(8).max(200)

export const RegisterRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  organizationId: z.string().min(1).optional(),
})
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const ChangePasswordRequestSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>

export const RefreshRequestSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .optional()
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>

export const PermissionSchema = z.string().min(1)
export type Permission = z.infer<typeof PermissionSchema>

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  organizationId: z.string().nullable(),
  organizationPlan: PlanTierSchema,
  planOverride: PlanTierSchema.nullable(),
  effectivePlan: PlanTierSchema,
  emailVerifiedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  permissions: z.array(PermissionSchema),
})
export type UserProfile = z.infer<typeof UserProfileSchema>

export const AuthTokensSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.string().datetime(),
  refreshToken: z.string().min(1).optional(),
  refreshTokenExpiresAt: z.string().datetime().optional(),
})
export type AuthTokens = z.infer<typeof AuthTokensSchema>

export const AuthSessionResponseDataSchema = z.object({
  user: UserProfileSchema,
  tokens: AuthTokensSchema,
  csrfToken: z.string().min(1).optional(),
})
export type AuthSessionResponseData = z.infer<typeof AuthSessionResponseDataSchema>

export const LogoutResponseDataSchema = z.object({
  loggedOut: z.literal(true),
})
export type LogoutResponseData = z.infer<typeof LogoutResponseDataSchema>

export const MeResponseDataSchema = UserProfileSchema
export type MeResponseData = z.infer<typeof MeResponseDataSchema>

export const SocialAuthStartResponseDataSchema = z.object({
  provider: SocialProviderSchema,
  authorizationUrl: z.string().url(),
})
export type SocialAuthStartResponseData = z.infer<typeof SocialAuthStartResponseDataSchema>

export const GoogleSocialExchangeRequestSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url().optional(),
})
export type GoogleSocialExchangeRequest = z.infer<typeof GoogleSocialExchangeRequestSchema>

export const CreateOrganizationInviteRequestSchema = z.object({
  email: emailSchema,
  role: OrganizationInviteRoleSchema,
  expiresInDays: z.number().int().min(1).max(30).optional(),
})
export type CreateOrganizationInviteRequest = z.infer<typeof CreateOrganizationInviteRequestSchema>

export const OrganizationInviteResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().min(1),
  email: z.string().email(),
  role: OrganizationInviteRoleSchema,
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  invitedBy: z.string().uuid(),
  acceptedBy: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
})
export type OrganizationInviteResponse = z.infer<typeof OrganizationInviteResponseSchema>

export const ListOrganizationInvitesResponseDataSchema = z.object({
  items: z.array(OrganizationInviteResponseSchema),
})
export type ListOrganizationInvitesResponseData = z.infer<
  typeof ListOrganizationInvitesResponseDataSchema
>

export const InviteTokenParamsSchema = z.object({
  token: z.string().min(1),
})
export type InviteTokenParams = z.infer<typeof InviteTokenParamsSchema>

export const InvitePreviewResponseDataSchema = z.object({
  organizationId: z.string().min(1),
  emailMasked: z.string().min(3),
  role: OrganizationInviteRoleSchema,
  expiresAt: z.string().datetime(),
})
export type InvitePreviewResponseData = z.infer<typeof InvitePreviewResponseDataSchema>

export const AcceptInviteAndRegisterRequestSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})
export type AcceptInviteAndRegisterRequest = z.infer<typeof AcceptInviteAndRegisterRequestSchema>

export const AcceptInviteRequestSchema = z.object({
  token: z.string().min(1),
})
export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>

export const OrganizationIdParamsSchema = z.object({
  orgId: z.string().min(1),
})
export type OrganizationIdParams = z.infer<typeof OrganizationIdParamsSchema>

export const InviteIdParamsSchema = z.object({
  orgId: z.string().min(1),
  inviteId: z.string().uuid(),
})
export type InviteIdParams = z.infer<typeof InviteIdParamsSchema>
