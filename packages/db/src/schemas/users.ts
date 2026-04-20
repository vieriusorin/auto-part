import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])
export const planTierEnum = pgEnum('plan_tier', ['free', 'premium'])
export const organizationRoleEnum = pgEnum('organization_role', [
  'owner',
  'admin',
  'manager',
  'driver',
  'viewer',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    organizationId: text('organization_id'),
    planOverride: planTierEnum('plan_override'),
    organizationRole: organizationRoleEnum('organization_role').notNull().default('owner'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailKey: uniqueIndex('users_email_key').on(table.email),
    organizationIdx: index('users_organization_idx').on(table.organizationId),
  }),
)

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert

export const organizationPlans = pgTable(
  'organization_plans',
  {
    organizationId: text('organization_id').primaryKey(),
    plan: planTierEnum('plan').notNull().default('free'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planIdx: index('organization_plans_plan_idx').on(table.plan),
  }),
)

export type OrganizationPlanRow = typeof organizationPlans.$inferSelect
export type NewOrganizationPlanRow = typeof organizationPlans.$inferInsert

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),

    familyId: uuid('family_id').notNull(),

    tokenHash: text('token_hash').notNull(),

    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp('absolute_expires_at', { withTimezone: true }).notNull(),

    replacedByTokenId: uuid('replaced_by_token_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),

    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    clientKind: text('client_kind').notNull().default('unknown'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashKey: uniqueIndex('refresh_tokens_token_hash_key').on(table.tokenHash),
    userIdx: index('refresh_tokens_user_idx').on(table.userId),
    familyIdx: index('refresh_tokens_family_idx').on(table.familyId),
    expiresAtIdx: index('refresh_tokens_expires_at_idx').on(table.expiresAt),
  }),
)

export type RefreshTokenRow = typeof refreshTokens.$inferSelect
export type NewRefreshTokenRow = typeof refreshTokens.$inferInsert
