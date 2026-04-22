import { createHash } from 'node:crypto'
import { Router } from 'express'
import {
  CancelSubscriptionBodySchema,
  ListSubscriptionCancelReasonsResponseDataSchema,
  CancelSubscriptionResponseDataSchema,
  GenerateReportResponseDataSchema,
  ListPaywallOffersResponseDataSchema,
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
import type { AuthModule } from '../../../auth/auth-module.js'
import { createAuthHttpGuards } from '../../../auth/interfaces/http/auth-http-guards.js'
import { createRequirePermissionMiddleware } from '../../../auth/interfaces/http/require-permission.middleware.js'
import { createRequirePlanMiddleware } from '../../../auth/interfaces/http/require-plan.middleware.js'
import { computePreviousWindow, buildSpendKpis } from '../../application/spend-kpis.js'
import { createVehicleRepository } from '../../../vehicles/infrastructure/vehicle-repository.js'
import { listDailyRollups } from '../../../analytics/repository.js'
import { desc, eq, sql } from 'drizzle-orm'

const REPORTS_TAG = 'Reports'
const SUBSCRIPTION_TAG = 'Subscription'

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

  registerRoute(router, '/api', {
    method: 'get',
    path: '/subscription/status',
    tags: [SUBSCRIPTION_TAG],
    summary: 'Get subscription status and paywall eligibility',
    operationId: 'getSubscriptionStatus',
    middlewares: [requireReportsRead],
    responses: {
      200: {
        description: 'Subscription status',
        dataSchema: SubscriptionStatusResponseDataSchema,
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
      const since = new Date()
      since.setUTCDate(since.getUTCDate() - 30)
      const logs = await vehicleRepo.listMaintenanceForOrganizationInRange({
        organizationId: orgId,
        from: since,
        to: new Date(),
      })
      const paywallEligible = logs.length > 0 && user.effectivePlan === 'free'
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
    responses: {
      200: {
        description: 'Trial started',
        dataSchema: StartTrialResponseDataSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      const user = req.user
      if (!user?.organizationId || !authModule) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      await authModule.users.updateOrganizationPlan(user.organizationId, 'premium')
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
    responses: {
      200: {
        description: 'Subscription canceled',
        dataSchema: CancelSubscriptionResponseDataSchema,
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
    },
    handler: async ({ res }) => {
      const rollups = await listDailyRollups()
      const latest = rollups[rollups.length - 1]
      const trialStartRatePercent = latest ? Math.min(100, latest.activationCount * 0.25) : 0
      const trialToPaidPercent = latest ? Math.min(100, latest.d30Retained * 0.2) : 0
      const month2PayerRetentionPercent = latest ? Math.min(100, latest.d30Retained * 0.35) : 0
      const refundRatePercent = latest ? Math.max(0, 5 - latest.activationCount * 0.01) : 0
      const freeTierD30RetentionDeltaPercent = latest ? -Math.min(15, latest.d30Retained * 0.05) : 0
      commonPresenter.ok(res, {
        trialStartRatePercent,
        trialToPaidPercent,
        month2PayerRetentionPercent,
        refundRatePercent,
        freeTierD30RetentionDeltaPercent,
        notes: [
          'Summary currently derived from existing analytics rollup signals.',
          'Replace heuristic mapping with billing-ground-truth metrics in Phase 2 window 3.',
        ],
      })
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
    },
    handler: async ({ req, res, query }) => {
      const orgId = req.user?.organizationId
      if (!orgId || !vehicleRepo) {
        commonPresenter.ok(res, {
          range: {
            from: query!.from,
            to: query!.to,
            granularity: query!.granularity,
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

      const from = new Date(query!.from)
      const to = new Date(query!.to)
      const previousWindow = computePreviousWindow(query!)

      const [currentRows, previousRows] = await Promise.all([
        vehicleRepo.listMaintenanceForOrganizationInRange({
          organizationId: orgId,
          from,
          to,
          vehicleIds: query!.vehicleIds,
          categories: query!.categories,
        }),
        vehicleRepo.listMaintenanceForOrganizationInRange({
          organizationId: orgId,
          from: previousWindow.from,
          to: previousWindow.to,
          vehicleIds: query!.vehicleIds,
          categories: query!.categories,
        }),
      ])

      commonPresenter.ok(
        res,
        buildSpendKpis({
          query: query!,
          currentRows,
          previousRows,
        }),
      )
    },
  })

  return router
}
