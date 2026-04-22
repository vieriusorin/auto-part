import { banners, userBannerDismissals, users } from '@autocare/db'
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
    const userRows = await db
      .select({ idInt: users.idInt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const userIdInt = userRows[0]?.idInt
    if (userIdInt === null || userIdInt === undefined) {
      return []
    }
    const rows = await db
      .select({ banner: banners })
      .from(banners)
      .leftJoin(
        userBannerDismissals,
        and(
          eq(userBannerDismissals.bannerIdInt, banners.idInt),
          eq(userBannerDismissals.userIdInt, userIdInt),
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
    const userRows = await db
      .select({ idInt: users.idInt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const userIdInt = userRows[0]?.idInt
    if (userIdInt === null || userIdInt === undefined) {
      return
    }
    const bannerRows = await db
      .select({ idInt: banners.idInt })
      .from(banners)
      .where(eq(banners.key, bannerKey))
      .limit(1)
    const bannerIdInt = bannerRows[0]?.idInt
    if (bannerIdInt === null || bannerIdInt === undefined) {
      return
    }
    await db
      .insert(userBannerDismissals)
      .values({
        userId,
        userIdInt,
        bannerKey,
        bannerIdInt,
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
