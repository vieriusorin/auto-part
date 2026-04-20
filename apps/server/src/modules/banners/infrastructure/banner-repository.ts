import { banners, userBannerDismissals } from '@autocare/db'
import { and, desc, eq, gt, isNull, lte, or } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

export type BannerRow = typeof banners.$inferSelect

export type BannerRepository = {
  listVisibleForUser: (userId: string, now: Date) => Promise<BannerRow[]>
  dismiss: (userId: string, bannerKey: string, now: Date) => Promise<void>
  existsByKey: (bannerKey: string) => Promise<boolean>
}

export const createBannerRepository = (db: NodePgDatabase): BannerRepository => ({
  listVisibleForUser: async (userId, now) => {
    const rows = await db
      .select({ banner: banners })
      .from(banners)
      .leftJoin(
        userBannerDismissals,
        and(
          eq(userBannerDismissals.bannerKey, banners.key),
          eq(userBannerDismissals.userId, userId),
        ),
      )
      .where(
        and(
          eq(banners.isActive, true),
          or(isNull(banners.startsAt), lte(banners.startsAt, now)),
          or(isNull(banners.endsAt), gt(banners.endsAt, now)),
          isNull(userBannerDismissals.id),
        ),
      )
      .orderBy(desc(banners.createdAt))

    return rows.map((row) => row.banner)
  },

  dismiss: async (userId, bannerKey, now) => {
    await db
      .insert(userBannerDismissals)
      .values({
        userId,
        bannerKey,
        dismissedAt: now,
      })
      .onConflictDoUpdate({
        target: [userBannerDismissals.userId, userBannerDismissals.bannerKey],
        set: { dismissedAt: now },
      })
  },

  existsByKey: async (bannerKey) => {
    const rows = await db.select({ id: banners.id }).from(banners).where(eq(banners.key, bannerKey)).limit(1)
    return rows.length > 0
  },
})
