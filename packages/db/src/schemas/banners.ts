import { bigint, boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const banners = pgTable(
  'banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    idInt: bigint('id_int', { mode: 'number' }),
    key: text('key').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    severity: text('severity').notNull(),
    ctaLabel: text('cta_label'),
    ctaUrl: text('cta_url'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyUnique: uniqueIndex('banners_key_unique').on(table.key),
    idIntKey: uniqueIndex('banners_id_int_key').on(table.idInt),
    activeWindowIdx: index('banners_active_window_idx').on(table.isActive, table.startsAt, table.endsAt),
  }),
)

export const userBannerDismissals = pgTable(
  'user_banner_dismissals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    idInt: bigint('id_int', { mode: 'number' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userIdInt: bigint('user_id_int', { mode: 'number' }),
    bannerKey: text('banner_key').notNull(),
    bannerIdInt: bigint('banner_id_int', { mode: 'number' }),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    idIntKey: uniqueIndex('user_banner_dismissals_id_int_key').on(table.idInt),
    userBannerUnique: uniqueIndex('user_banner_dismissals_user_banner_unique').on(
      table.userId,
      table.bannerKey,
    ),
    userBannerIdx: index('user_banner_dismissals_user_banner_idx').on(table.userId, table.bannerKey),
    userBannerIntIdx: index('user_banner_dismissals_user_banner_int_idx').on(table.userIdInt, table.bannerIdInt),
  }),
)
