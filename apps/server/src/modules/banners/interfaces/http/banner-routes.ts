import {
  DismissBannerParamsSchema,
  DismissBannerResponseDataSchema,
  ListBannersResponseDataSchema,
} from '@autocare/shared'
import { Router } from 'express'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import type { AuthModule } from '../../../auth/auth-module.js'
import {
  createAuthHttpGuards,
  type AuthHttpGuards,
} from '../../../auth/interfaces/http/auth-http-guards.js'
import { createBannerRepository, type BannerRow } from '../../infrastructure/banner-repository.js'

const BANNERS_TAG = 'Banners'

const mapBanner = (row: BannerRow) => ({
  key: row.key,
  title: row.title,
  message: row.message,
  severity: row.severity as 'info' | 'warning' | 'critical',
  cta:
    row.ctaLabel && row.ctaUrl
      ? {
          label: row.ctaLabel,
          url: row.ctaUrl,
        }
      : null,
  startsAt: row.startsAt ? row.startsAt.toISOString() : null,
  endsAt: row.endsAt ? row.endsAt.toISOString() : null,
})

export const createBannerRouter = (authModule: AuthModule, guards?: AuthHttpGuards): Router => {
  const router = Router()
  const requireAuth = guards?.requireAuth ?? createAuthHttpGuards(authModule).requireAuth
  const repo = createBannerRepository(authModule.db)

  registerRoute(router, '/api', {
    method: 'get',
    path: '/banners',
    tags: [BANNERS_TAG],
    summary: 'List active banners visible to the current user',
    operationId: 'listBanners',
    middlewares: [requireAuth],
    responses: {
      200: {
        description: 'Visible banners',
        dataSchema: ListBannersResponseDataSchema,
      },
    },
    handler: async ({ req, res }) => {
      const user = req.user
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const rows = await repo.listVisibleForUser(user.id, new Date())
      commonPresenter.ok(res, { items: rows.map(mapBanner) })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/banners/:bannerKey/dismiss',
    tags: [BANNERS_TAG],
    summary: 'Dismiss a banner for the current user',
    operationId: 'dismissBanner',
    params: DismissBannerParamsSchema,
    middlewares: [requireAuth],
    responses: {
      200: {
        description: 'Dismissed',
        dataSchema: DismissBannerResponseDataSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const user = req.user
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      if (!params) {
        commonPresenter.error(res, 400, 'validation_error', 'Invalid request params')
        return
      }
      const exists = await repo.existsByKey(params.bannerKey)
      if (!exists) {
        commonPresenter.error(res, 404, 'banner_not_found', 'Banner not found')
        return
      }

      await repo.dismiss(user.id, params.bannerKey, new Date())
      commonPresenter.ok(res, { dismissed: true as const })
    },
  })

  return router
}
