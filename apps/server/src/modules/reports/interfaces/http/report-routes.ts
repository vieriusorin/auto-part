import { createHash, randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import {
  ApiErrorResponseSchema,
  CancelSubscriptionBodySchema,
  ListSubscriptionCancelReasonsResponseDataSchema,
  CancelSubscriptionResponseDataSchema,
  GenerateReportResponseDataSchema,
  ListPaywallOffersResponseDataSchema,
  MarkMonth2ActiveResponseDataSchema,
  StartTrialBodySchema,
  StartTrialResponseDataSchema,
  SubscriptionRetentionSummaryResponseDataSchema,
  SubscriptionStatusResponseDataSchema,
  SpendKpisQuerySchema,
  SpendKpisResponseDataSchema,
} from '@autocare/shared'
import { subscriptionCancellation, users } from '@autocare/db'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import type { Request } from 'express'
import type { AuthModule } from '../../../auth/auth-module.js'
import { createAuthHttpGuards } from '../../../auth/interfaces/http/auth-http-guards.js'
import { createRequirePermissionMiddleware } from '../../../auth/interfaces/http/require-permission.middleware.js'
import { createRequirePlanMiddleware } from '../../../auth/interfaces/http/require-plan.middleware.js'
import { computePreviousWindow, buildSpendKpis } from '../../application/spend-kpis.js'
import { buildSubscriptionAnalyticsContext } from '../../application/subscription-analytics-context.js'
import { buildSubscriptionRetentionSummary } from '../../application/subscription-retention-summary.js'
import { createVehicleRepository } from '../../../vehicles/infrastructure/vehicle-repository.js'
import { appendRawEvent, listDailyRollups, listRawEvents } from '../../../analytics/repository.js'
import { desc, eq, sql } from 'drizzle-orm'

const REPORTS_TAG = 'Reports'
const SUBSCRIPTION_TAG = 'Subscription'
const SubscriptionAnalyticsHeadersSchema = z.object({
  'x-platform': z.string().optional(),
  'x-country': z.string().optional(),
  'x-channel': z.string().optional(),
  'x-app-version': z.string().optional(),
  'x-session-id': z.string().optional(),
  'x-device-id': z.string().optional(),
})

export const createReportRouter = (authModule?: AuthModule): Router => {
  const router = Router()
  const authGuards = authModule ? createAuthHttpGuards(authModule) : null
  const requireReportsRead = authGuards
    ? authGuards.requirePermission('reports.read')
    : createRequirePermissionMiddleware('reports.read')
  const requirePremium = authGuards
    ? authGuards.requirePlan({ minimumPlan: 'premium' })
    : createRequirePlanMiddleware({ minimumPlan: 'premium' })
  const vehicleRepo = authModule ? createVehicleRepository(authModule.db) : null

  const hasRecentMaintenanceValueEvent = async (organizationId: string): Promise<boolean> => {
    if (!vehicleRepo) {
      return false
    }
    const since = new Date()
    since.setUTCDate(since.getUTCDate() - 30)
    const logs = await vehicleRepo.listMaintenanceForOrganizationInRange({
      organizationId,
      from: since,
      to: new Date(),
    })
    return logs.length > 0
  }

  const trackSubscriptionEvent = async ({
    eventName,
    userId,
    req,
  }: {
    eventName: string
    userId: string | null
    req: Request
  }): Promise<void> => {
    const { platform, country, channel, appVersion, sessionId, deviceId } =
      buildSubscriptionAnalyticsContext(req)

    await appendRawEvent({
      eventId: randomUUID(),
      eventName,
      occurredAtClient: new Date().toISOString(),
      receivedAtServer: new Date().toISOString(),
      userId,
      sessionId,
      deviceId,
      platform,
      country,
      channel,
      appVersion,
      schemaVersion: 1,
    })
  }

  registerRoute(router, '/api', {
    method: 'get',
    path: '/subscription/status',
    tags: [SUBSCRIPTION_TAG],
    summary: 'Get subscription status and paywall eligibility',
    operationId: 'getSubscriptionStatus',
    middlewares: [requireReportsRead],
    headers: SubscriptionAnalyticsHeadersSchema,
    responses: {
      200: {
        description: 'Subscription status',
        dataSchema: SubscriptionStatusResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res }) => {
      const user = req.user
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const orgId = user.organizationId
      if (!orgId || !vehicleRepo) {
        commonPresenter.ok(res, {
          organizationPlan: user.organizationPlan,
          effectivePlan: user.effectivePlan,
          trialActive: false,
          trialEndsAt: null,
          paywallEligible: false,
          paywallReason: 'Organization context missing',
        })
        return
      }
      const hasValueEvent = await hasRecentMaintenanceValueEvent(orgId)
      const paywallEligible = hasValueEvent && user.effectivePlan === 'free'
      if (paywallEligible) {
        try {
          await trackSubscriptionEvent({
            eventName: 'subscription_paywall_viewed',
            userId: user.id,
            req,
          })
        } catch {
          // Avoid failing status reads on analytics instrumentation issues.
        }
      }
      commonPresenter.ok(res, {
        organizationPlan: user.organizationPlan,
        effectivePlan: user.effectivePlan,
        trialActive: false,
        trialEndsAt: null,
        paywallEligible,
        paywallReason: paywallEligible
          ? 'Reached first maintenance value event'
          : 'Complete a maintenance action before seeing premium prompt',
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/subscription/lifecycle/month2-active',
    tags: [SUBSCRIPTION_TAG],
    summary: 'Mark payer as active in month 2 cohort',
    operationId: 'markSubscriptionMonth2Active',
    middlewares: [requireReportsRead],
    headers: SubscriptionAnalyticsHeadersSchema,
    responses: {
      200: {
        description: 'Month 2 payer active recorded',
        dataSchema: MarkMonth2ActiveResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res }) => {
      const user = req.user
      if (!user?.organizationId) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      try {
        await trackSubscriptionEvent({
          eventName: 'subscription_month2_active',
          userId: user.id,
          req,
        })
      } catch {
        // Lifecycle tracking should not fail main flow.
      }
      commonPresenter.ok(res, { recorded: true })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/subscription/offers',
    tags: [SUBSCRIPTION_TAG],
    summary: 'List paywall offers and variant',
    operationId: 'listSubscriptionOffers',
    middlewares: [requireReportsRead],
    responses: {
      200: {
        description: 'Subscription offers',
        dataSchema: ListPaywallOffersResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, {
        variant: 'phase2-default',
        items: [
          {
            id: 'premium-monthly',
            plan: 'premium',
            billingCycle: 'monthly',
            priceCents: 999,
            trialDays: 7,
            highlighted: false,
          },
          {
            id: 'premium-annual',
            plan: 'premium',
            billingCycle: 'annual',
            priceCents: 8999,
            trialDays: 14,
            highlighted: true,
          },
        ],
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/subscription/trial/start',
    tags: [SUBSCRIPTION_TAG],
    summary: 'Start premium trial',
    operationId: 'startSubscriptionTrial',
    body: StartTrialBodySchema,
    middlewares: [requireReportsRead],
    headers: SubscriptionAnalyticsHeadersSchema,
    responses: {
      200: {
        description: 'Trial started',
        dataSchema: StartTrialResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
      403: {
        description: 'Trial blocked until paywall eligibility milestone is reached',
        schema: ApiErrorResponseSchema,
      },
      409: {
        description: 'Trial unavailable because effective plan is already non-free',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      const user = req.user
      if (!user?.organizationId || !authModule) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      if (user.effectivePlan !== 'free') {
        commonPresenter.error(
          res,
          409,
          'trial_not_available',
          'Trial is only available for users on the free plan',
        )
        return
      }
      const paywallEligible = await hasRecentMaintenanceValueEvent(user.organizationId)
      if (!paywallEligible) {
        commonPresenter.error(
          res,
          403,
          'paywall_not_eligible',
          'Complete a maintenance action before starting a trial',
        )
        return
      }
      await authModule.users.updateOrganizationPlan(user.organizationId, 'premium')
      try {
        await trackSubscriptionEvent({
          eventName: 'subscription_trial_started',
          userId: user.id,
          req,
        })
        await trackSubscriptionEvent({
          eventName: 'subscription_converted_to_paid',
          userId: user.id,
          req,
        })
      } catch {
        // Trial flow should not fail when analytics tracking fails.
      }
      const trialEndsAt = new Date()
      trialEndsAt.setUTCDate(
        trialEndsAt.getUTCDate() + (body?.billingCycle === 'annual' ? 14 : 7),
      )
      commonPresenter.ok(res, {
        started: true,
        plan: 'premium',
        billingCycle: body?.billingCycle ?? 'monthly',
        trialEndsAt: trialEndsAt.toISOString(),
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/subscription/cancel',
    tags: [SUBSCRIPTION_TAG],
    summary: 'Cancel premium and capture reason',
    operationId: 'cancelSubscription',
    body: CancelSubscriptionBodySchema,
    middlewares: [requireReportsRead],
    headers: SubscriptionAnalyticsHeadersSchema,
    responses: {
      200: {
        description: 'Subscription canceled',
        dataSchema: CancelSubscriptionResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      const user = req.user
      if (!user?.organizationId || !authModule) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      await authModule.users.updateOrganizationPlan(user.organizationId, 'free')
      await authModule.users.updatePlanOverride(user.id, null)
      let userRows = await authModule.db
        .select({ idInt: users.idInt })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
      if (!userRows[0]) {
        const inserted = await authModule.db
          .insert(users)
          .values({
            id: user.id,
            email: user.email,
            passwordHash: 'in-memory-auth-placeholder',
            role: user.role,
            organizationId: user.organizationId,
            planOverride: user.planOverride ?? null,
            organizationRole: 'owner',
            emailVerifiedAt: new Date(),
          })
          .onConflictDoNothing({ target: users.id })
          .returning({ idInt: users.idInt })
        if (inserted[0]) {
          userRows = inserted
        } else {
          userRows = await authModule.db
            .select({ idInt: users.idInt })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1)
        }
      }
      const userIdInt = userRows[0]?.idInt
      if (userIdInt === undefined || userIdInt === null) {
        commonPresenter.error(res, 400, 'invalid_user', 'Unable to resolve internal user id')
        return
      }
      await authModule.db.insert(subscriptionCancellation).values({
        organizationId: user.organizationId,
        userId: user.id,
        userIdInt,
        reason: body?.reason ?? 'unknown',
        feedback: body?.feedback ?? null,
      })
      try {
        await trackSubscriptionEvent({
          eventName: 'subscription_refunded',
          userId: user.id,
          req,
        })
      } catch {
        // Cancellation should not fail when analytics tracking fails.
      }
      commonPresenter.ok(res, {
        canceled: true,
        effectivePlan: 'free',
        recordedReason: body?.reason ?? 'unknown',
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/subscription/cancel-reasons',
    tags: [SUBSCRIPTION_TAG],
    summary: 'List cancellation reasons summary by organization',
    operationId: 'listSubscriptionCancelReasons',
    middlewares: [requireReportsRead],
    responses: {
      200: {
        description: 'Cancellation reasons',
        dataSchema: ListSubscriptionCancelReasonsResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res }) => {
      const orgId = req.user?.organizationId
      if (!orgId || !authModule) {
        commonPresenter.ok(res, { items: [] })
        return
      }
      const rows = await authModule.db
        .select({
          reason: subscriptionCancellation.reason,
          count: sql<number>`count(*)::int`,
        })
        .from(subscriptionCancellation)
        .where(eq(subscriptionCancellation.organizationId, orgId))
        .groupBy(subscriptionCancellation.reason)
        .orderBy(desc(sql`count(*)`))
      commonPresenter.ok(res, { items: rows })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/subscription/retention-summary',
    tags: [SUBSCRIPTION_TAG],
    summary: 'Get subscription retention and guardrail summary',
    operationId: 'getSubscriptionRetentionSummary',
    middlewares: [requireReportsRead],
    responses: {
      200: {
        description: 'Retention summary',
        dataSchema: SubscriptionRetentionSummaryResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ res }) => {
      const [events, rollups] = await Promise.all([listRawEvents(), listDailyRollups()])
      commonPresenter.ok(res, buildSubscriptionRetentionSummary(events, rollups))
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/reports/generate',
    tags: [REPORTS_TAG],
    summary: 'Generate report',
    operationId: 'generateReport',
    middlewares: [requireReportsRead, requirePremium],
    responses: {
      200: {
        description: 'Report link and hash',
        dataSchema: GenerateReportResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
      403: {
        description: 'Current plan does not allow this endpoint',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: ({ res }) => {
      const generatedAt = new Date().toISOString()
      commonPresenter.ok(res, {
        publicUrl: `https://autocare.app/reports/demo?generatedAt=${encodeURIComponent(generatedAt)}`,
        reportHash: createHash('sha256').update('demo').digest('hex'),
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/v1/kpis/spend',
    tags: [REPORTS_TAG],
    summary: 'Get spend KPIs',
    operationId: 'getSpendKpis',
    query: SpendKpisQuerySchema,
    middlewares: [requireReportsRead, requirePremium],
    responses: {
      200: {
        description: 'Spend KPI payload',
        dataSchema: SpendKpisResponseDataSchema,
      },
      401: {
        description: 'Authentication required',
        schema: ApiErrorResponseSchema,
      },
      403: {
        description: 'Current plan does not allow this endpoint',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res, query }) => {
      if (!query) {
        commonPresenter.error(res, 400, 'validation_error', 'Invalid request query')
        return
      }
      const orgId = req.user?.organizationId
      if (!orgId || !vehicleRepo) {
        commonPresenter.ok(res, {
          range: {
            from: query.from,
            to: query.to,
            granularity: query.granularity,
          },
          totals: {
            totalSpend: 0,
            maintenanceSpend: 0,
            fuelSpend: 0,
          },
          byPeriod: [],
          byCategory: [],
          byVehicle: [],
          advanced: {
            trendDeltaPercent: 0,
            forecastNextPeriodSpend: 0,
            anomalies: [],
          },
        })
        return
      }

      const from = new Date(query.from)
      const to = new Date(query.to)
      const previousWindow = computePreviousWindow(query)

      const [currentRows, previousRows] = await Promise.all([
        vehicleRepo.listMaintenanceForOrganizationInRange({
          organizationId: orgId,
          from,
          to,
          vehicleIds: query.vehicleIds,
          categories: query.categories,
        }),
        vehicleRepo.listMaintenanceForOrganizationInRange({
          organizationId: orgId,
          from: previousWindow.from,
          to: previousWindow.to,
          vehicleIds: query.vehicleIds,
          categories: query.categories,
        }),
      ])

      commonPresenter.ok(
        res,
        buildSpendKpis({
          query,
          currentRows,
          previousRows,
        }),
      )
    },
  })

  return router
}
