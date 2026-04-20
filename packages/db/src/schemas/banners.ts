import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const banners = pgTable(
  'banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
    activeWindowIdx: index('banners_active_window_idx').on(table.isActive, table.startsAt, table.endsAt),
  }),
)

export const userBannerDismissals = pgTable(
  'user_banner_dismissals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bannerKey: text('banner_key').notNull(),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userBannerUnique: uniqueIndex('user_banner_dismissals_user_banner_unique').on(
      table.userId,
      table.bannerKey,
    ),
    userBannerIdx: index('user_banner_dismissals_user_banner_idx').on(table.userId, table.bannerKey),
  }),
)
