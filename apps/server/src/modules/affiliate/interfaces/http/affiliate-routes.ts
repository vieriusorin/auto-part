import {
  AffiliateDisclosureAuditQuerySchema,
  AffiliateDisclosureAuditResponseDataSchema,
  AffiliatePhaseExitReadinessResponseDataSchema,
  AffiliateKpiGatesQuerySchema,
  AffiliateKpiGatesResponseDataSchema,
  AffiliateDashboardQuerySchema,
  AffiliateDashboardResponseDataSchema,
  AffiliateImpactResponseDataSchema,
  AffiliateMetricsResponseDataSchema,
  AffiliateTrendsQuerySchema,
  AffiliateTrendsResponseDataSchema,
  ApiErrorResponseSchema,
  ListAffiliateOffersQuerySchema,
  ListAffiliateOffersResponseDataSchema,
  AuthorizationActions,
  ReportAffiliateComplaintBodySchema,
  ReportAffiliateComplaintResponseDataSchema,
  TrackAffiliateClickBodySchema,
  TrackAffiliateClickResponseDataSchema,
  TrackAffiliateExposureBodySchema,
  TrackAffiliateExposureResponseDataSchema,
} from '@autocare/shared'
import { randomUUID } from 'node:crypto'
import { Router, type Request } from 'express'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { appendRawEvent, listRawEvents } from '../../../analytics/repository.js'
import type { AuthModule } from '../../../auth/auth-module.js'
import {
  createAuthHttpGuards,
  type AuthHttpGuards,
} from '../../../auth/interfaces/http/auth-http-guards.js'
import { createRequirePermissionMiddleware } from '../../../auth/interfaces/http/require-permission.middleware.js'
import { normalizePlatform } from '../../../analytics/schemas.js'
import {
  affiliateEventPolicyConditions,
  filterAffiliateEventsByPolicy,
  resolveAffiliateResourceScope,
} from '../../application/affiliate-access-scope.js'

const AFFILIATE_TAG = 'Affiliate'
const ADMIN_TAG = 'Admin'
const CLICK_EVENT_PREFIX = 'affiliate_click__'
const ATTRIBUTED_CLICK_EVENT_PREFIX = 'affiliate_click_attributed__'
const EXPOSURE_EVENT_PREFIX = 'affiliate_exposure__'
const COMPLAINT_EVENT_PREFIX = 'affiliate_complaint__'
const DISCLOSURE_VIOLATION_EVENT_PREFIX = 'affiliate_disclosure_violation__'
const RETENTION_SIGNAL_EVENTS = new Set([
  'subscription_paywall_viewed',
  'paywall_viewed',
  'subscription_trial_started',
  'subscription_trial_start',
  'subscription_converted_to_paid',
  'subscription_paid_started',
  'subscription_month2_active',
])
const RETENTION_SUCCESS_EVENTS = new Set(['subscription_month2_active'])

const AFFILIATE_OFFERS = [
  {
    id: 'offer-maint-oil-kit',
    partnerName: 'AutoParts Direct',
    title: 'Oil service kit discount',
    description: 'Save 12% on OEM-spec oil + filter bundle for upcoming maintenance.',
    category: 'maintenance_parts',
    intentSurface: 'maintenance_due' as const,
    targetUrl: 'https://partners.example.com/oil-service-kit',
    disclosureLabel: 'Sponsored recommendation' as const,
  },
  {
    id: 'offer-report-inspection',
    partnerName: 'Trusted Garage Network',
    title: 'Book a discounted inspection',
    description: 'Use your report insights and get a partner inspection with fixed pricing.',
    category: 'inspection_service',
    intentSurface: 'service_report_ready' as const,
    targetUrl: 'https://partners.example.com/report-inspection',
    disclosureLabel: 'Sponsored recommendation' as const,
  },
  {
    id: 'offer-cost-anomaly-diagnostics',
    partnerName: 'DiagPro',
    title: 'Diagnostic package for anomaly alerts',
    description: 'Run targeted diagnostics to investigate unusual cost spikes.',
    category: 'diagnostics',
    intentSurface: 'cost_anomaly_detected' as const,
    targetUrl: 'https://partners.example.com/anomaly-diagnostics',
    disclosureLabel: 'Sponsored recommendation' as const,
  },
]

const OFFER_BY_ID = new Map(AFFILIATE_OFFERS.map((offer) => [offer.id, offer]))

const toBucketStart = (date: Date, granularity: 'day' | 'week'): string => {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  if (granularity === 'day') {
    return utc.toISOString()
  }
  const day = utc.getUTCDay()
  const offset = day === 0 ? 6 : day - 1
  utc.setUTCDate(utc.getUTCDate() - offset)
  return utc.toISOString()
}

const buildAnalyticsContext = (req: Request) => {
  const platformHeader = req.header('X-Platform')
  const fallbackPlatform = req.header('X-Client') === 'mobile' ? 'ios' : 'android'
  let platform: 'ios' | 'android' = fallbackPlatform
  if (platformHeader) {
    try {
      platform = normalizePlatform(platformHeader)
    } catch {
      platform = fallbackPlatform
    }
  }
  const country = (req.header('X-Country') ?? '').trim().toUpperCase()
  const channel = (req.header('X-Channel') ?? '').trim()
  const appVersion = (req.header('X-App-Version') ?? '').trim()
  const sessionId = (req.header('X-Session-Id') ?? '').trim()
  const deviceId = (req.header('X-Device-Id') ?? '').trim()
  return {
    platform,
    country: /^[A-Z]{2}$/.test(country) ? country : 'XX',
    channel: channel.slice(0, 64) || 'organic',
    appVersion: appVersion.slice(0, 32) || 'server',
    sessionId: sessionId.slice(0, 128) || randomUUID(),
    deviceId: deviceId.slice(0, 128) || 'server-derived',
  }
}

const isEligibleByQuery = (
  event: Awaited<ReturnType<typeof listRawEvents>>[number],
  query?: { country?: string; platform?: 'ios' | 'android'; channel?: string },
) => {
  if (query?.country && event.country !== query.country.toUpperCase()) {
    return false
  }
  if (query?.platform && event.platform !== query.platform) {
    return false
  }
  if (query?.channel && event.channel !== query.channel) {
    return false
  }
  return true
}

const computeDisclosureAudit = (
  events: Awaited<ReturnType<typeof listRawEvents>>,
  query?: { country?: string; platform?: 'ios' | 'android'; channel?: string },
) => {
  let trackedInteractions = 0
  let violations = 0
  for (const event of events) {
    if (!isEligibleByQuery(event, query)) {
      continue
    }
    if (
      event.eventName.startsWith(EXPOSURE_EVENT_PREFIX) ||
      event.eventName.startsWith(CLICK_EVENT_PREFIX) ||
      event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)
    ) {
      trackedInteractions += 1
      continue
    }
    if (event.eventName.startsWith(DISCLOSURE_VIOLATION_EVENT_PREFIX)) {
      violations += 1
    }
  }

  const compliantInteractions = Math.max(trackedInteractions - violations, 0)
  const disclosureCompliancePercent =
    trackedInteractions > 0 ? Number(((compliantInteractions / trackedInteractions) * 100).toFixed(1)) : 0
  return {
    trackedInteractions,
    compliantInteractions,
    violations,
    disclosureCompliancePercent,
    disclosureComplianceFull: trackedInteractions > 0 && violations === 0,
  }
}

const computeRetentionControlComparison = (events: Awaited<ReturnType<typeof listRawEvents>>) => {
  const affiliateUsers = new Set<string>()
  const affiliateRetainedUsers = new Set<string>()
  const controlUsers = new Set<string>()
  const controlRetainedUsers = new Set<string>()

  for (const event of events) {
    const userId = event.userId
    if (!userId) {
      continue
    }

    const isAffiliateInteraction =
      event.eventName.startsWith(EXPOSURE_EVENT_PREFIX) ||
      event.eventName.startsWith(CLICK_EVENT_PREFIX) ||
      event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)

    if (isAffiliateInteraction) {
      affiliateUsers.add(userId)
      continue
    }

    if (affiliateUsers.has(userId)) {
      if (RETENTION_SUCCESS_EVENTS.has(event.eventName)) {
        affiliateRetainedUsers.add(userId)
      }
      continue
    }

    if (RETENTION_SIGNAL_EVENTS.has(event.eventName)) {
      controlUsers.add(userId)
      if (RETENTION_SUCCESS_EVENTS.has(event.eventName)) {
        controlRetainedUsers.add(userId)
      }
    }
  }

  const affiliateCohortSize = affiliateUsers.size
  const controlCohortSize = controlUsers.size
  const affiliateRetentionRatePercent =
    affiliateCohortSize > 0
      ? Number(((affiliateRetainedUsers.size / affiliateCohortSize) * 100).toFixed(1))
      : 0
  const controlRetentionRatePercent =
    controlCohortSize > 0 ? Number(((controlRetainedUsers.size / controlCohortSize) * 100).toFixed(1)) : 0
  const retentionDeltaPercent = Number((affiliateRetentionRatePercent - controlRetentionRatePercent).toFixed(1))

  return {
    affiliateCohortSize,
    controlCohortSize,
    affiliateRetentionRatePercent,
    controlRetentionRatePercent,
    retentionDeltaPercent,
    hasEvidence: affiliateCohortSize > 0 && controlCohortSize > 0,
  }
}

export const createAffiliateRouter = (authModule?: AuthModule, guards?: AuthHttpGuards): Router => {
  const router = Router()
  const requireAdminAnalyticsRead =
    authModule && guards
      ? guards.requirePermission(AuthorizationActions.adminAnalyticsRead)
      : authModule
        ? createAuthHttpGuards(authModule).requirePermission(AuthorizationActions.adminAnalyticsRead)
        : createRequirePermissionMiddleware(AuthorizationActions.adminAnalyticsRead)
  const loadScopedEvents = async (req: Request) => {
    const events = await listRawEvents()
    if (!req.user) {
      return events
    }
    const scope = resolveAffiliateResourceScope(req.user)
    return filterAffiliateEventsByPolicy(events, affiliateEventPolicyConditions(scope))
  }

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/offers',
    tags: [AFFILIATE_TAG],
    summary: 'List high-intent affiliate offers with explicit disclosure metadata',
    operationId: 'listAffiliateOffers',
    query: ListAffiliateOffersQuerySchema,
    responses: {
      200: {
        description: 'Affiliate offers for requested intent surface',
        dataSchema: ListAffiliateOffersResponseDataSchema,
      },
    },
    handler: ({ res, query }) => {
      const items = query?.intentSurface
        ? AFFILIATE_OFFERS.filter((offer) => offer.intentSurface === query.intentSurface)
        : AFFILIATE_OFFERS
      commonPresenter.ok(res, { items })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/disclosure-audit',
    tags: [AFFILIATE_TAG, ADMIN_TAG],
    summary: 'Get affiliate disclosure compliance audit snapshot',
    operationId: 'getAffiliateDisclosureAudit',
    middlewares: [requireAdminAnalyticsRead],
    query: AffiliateDisclosureAuditQuerySchema,
    responses: {
      200: {
        description: 'Affiliate disclosure compliance audit',
        dataSchema: AffiliateDisclosureAuditResponseDataSchema,
      },
    },
    handler: async ({ req, res, query }) => {
      const events = await loadScopedEvents(req)
      const disclosure = computeDisclosureAudit(events, query)
      commonPresenter.ok(res, {
        meta: { audience: 'admin' as const },
        totals: {
          trackedInteractions: disclosure.trackedInteractions,
          compliantInteractions: disclosure.compliantInteractions,
          violations: disclosure.violations,
        },
        disclosureCompliancePercent: disclosure.disclosureCompliancePercent,
        checkpoint: {
          disclosureComplianceFull: disclosure.disclosureComplianceFull,
        },
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/phase-exit-readiness',
    tags: [AFFILIATE_TAG, ADMIN_TAG],
    summary: 'Evaluate Phase 3 affiliate KPI exit readiness',
    operationId: 'getAffiliatePhaseExitReadiness',
    middlewares: [requireAdminAnalyticsRead],
    responses: {
      200: {
        description: 'Phase 3 readiness snapshot',
        dataSchema: AffiliatePhaseExitReadinessResponseDataSchema,
      },
    },
    handler: async ({ req, res }) => {
      const events = await loadScopedEvents(req)
      const disclosure = computeDisclosureAudit(events)
      const retention = computeRetentionControlComparison(events)
      let exposures = 0
      let clicks = 0
      let attributedClicks = 0
      let complaints = 0

      for (const event of events) {
        if (event.eventName.startsWith(EXPOSURE_EVENT_PREFIX)) {
          exposures += 1
          continue
        }
        if (event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)) {
          clicks += 1
          attributedClicks += 1
          continue
        }
        if (event.eventName.startsWith(CLICK_EVENT_PREFIX)) {
          clicks += 1
          continue
        }
        if (event.eventName.startsWith(COMPLAINT_EVENT_PREFIX)) {
          complaints += 1
        }
      }

      const ctrPercent = exposures > 0 ? Number(((clicks / exposures) * 100).toFixed(1)) : 0
      const clickToConversionPercent =
        clicks > 0 ? Number(((attributedClicks / clicks) * 100).toFixed(1)) : 0
      const complaintRatePercent = clicks > 0 ? Number(((complaints / clicks) * 100).toFixed(1)) : 0
      const criteria = [
        {
          key: 'ctr_at_least_3_percent' as const,
          passed: ctrPercent >= 3,
          value: ctrPercent,
          threshold: 3,
          reason:
            exposures === 0
              ? 'No affiliate exposures recorded yet; CTR evidence is not statistically meaningful.'
              : undefined,
        },
        {
          key: 'conversion_at_least_5_percent' as const,
          passed: clickToConversionPercent >= 5,
          value: clickToConversionPercent,
          threshold: 5,
          reason:
            clicks === 0
              ? 'No affiliate clicks recorded yet; conversion evidence is not statistically meaningful.'
              : undefined,
        },
        {
          key: 'disclosure_compliance_full' as const,
          passed: disclosure.disclosureComplianceFull,
          value: disclosure.disclosureCompliancePercent,
          threshold: 100,
          reason:
            disclosure.trackedInteractions === 0
              ? 'No affiliate interactions recorded yet; disclosure compliance evidence is unavailable.'
              : disclosure.violations > 0
                ? 'Disclosure violations detected in affiliate interactions.'
                : undefined,
        },
        {
          key: 'no_retention_decline_detected' as const,
          passed: retention.hasEvidence ? retention.retentionDeltaPercent >= 0 : false,
          value: retention.retentionDeltaPercent,
          threshold: 0,
          reason:
            !retention.hasEvidence
              ? 'Retention cohort evidence requires both affiliate and control users with retention signal events.'
              : retention.retentionDeltaPercent < 0
                ? `Retention decline detected: affiliate ${retention.affiliateRetentionRatePercent}% vs control ${retention.controlRetentionRatePercent}%.`
                : undefined,
        },
        {
          key: 'hidden_sponsorship_complaints_below_1_percent' as const,
          passed: complaintRatePercent < 1,
          value: complaintRatePercent,
          threshold: 1,
          reason:
            clicks === 0
              ? 'No clicks recorded yet; complaint-rate evidence is not statistically meaningful.'
              : undefined,
        },
      ]

      const missingEvidence: string[] = []
      if (exposures === 0) {
        missingEvidence.push('affiliate_exposures')
      }
      if (clicks === 0) {
        missingEvidence.push('affiliate_clicks')
      }
      if (disclosure.trackedInteractions === 0) {
        missingEvidence.push('affiliate_disclosure_audit')
      }
      if (!retention.hasEvidence) {
        missingEvidence.push('retention_control_cohort_comparison')
      }

      commonPresenter.ok(res, {
        meta: { audience: 'admin' as const },
        ready: criteria.every((criterion) => criterion.passed) && missingEvidence.length === 0,
        criteria,
        missingEvidence,
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/kpi-gates',
    tags: [AFFILIATE_TAG, ADMIN_TAG],
    summary: 'Get affiliate phase KPI gate snapshot from persisted event aggregates',
    operationId: 'getAffiliateKpiGates',
    middlewares: [requireAdminAnalyticsRead],
    query: AffiliateKpiGatesQuerySchema,
    responses: {
      200: {
        description: 'Affiliate KPI gate snapshot',
        dataSchema: AffiliateKpiGatesResponseDataSchema,
      },
    },
    handler: async ({ req, res, query }) => {
      const events = await loadScopedEvents(req)
      let exposures = 0
      let clicks = 0
      let attributedClicks = 0
      let complaints = 0

      const isEligible = (event: (typeof events)[number]) => {
        if (query?.country && event.country !== query.country.toUpperCase()) {
          return false
        }
        if (query?.platform && event.platform !== query.platform) {
          return false
        }
        if (query?.channel && event.channel !== query.channel) {
          return false
        }
        return true
      }

      for (const event of events) {
        if (!isEligible(event)) {
          continue
        }
        if (event.eventName.startsWith(EXPOSURE_EVENT_PREFIX)) {
          exposures += 1
          continue
        }
        if (event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)) {
          clicks += 1
          attributedClicks += 1
          continue
        }
        if (event.eventName.startsWith(CLICK_EVENT_PREFIX)) {
          clicks += 1
          continue
        }
        if (event.eventName.startsWith(COMPLAINT_EVENT_PREFIX)) {
          complaints += 1
        }
      }

      const ctrPercent = exposures > 0 ? Number(((clicks / exposures) * 100).toFixed(1)) : 0
      const clickToConversionProxyPercent =
        clicks > 0 ? Number(((attributedClicks / clicks) * 100).toFixed(1)) : 0
      const complaintRatePercent = clicks > 0 ? Number(((complaints / clicks) * 100).toFixed(1)) : 0
      const retentionGuardProxyPercent =
        exposures > 0 ? Number((((exposures - complaints) / exposures) * 100).toFixed(1)) : 0

      commonPresenter.ok(res, {
        meta: { audience: 'admin' as const },
        snapshot: {
          exposures,
          clicks,
          attributedClicks,
          complaints,
          ctrPercent,
          clickToConversionProxyPercent,
          complaintRatePercent,
          retentionGuardProxyPercent,
        },
        checkpoints: {
          ctrAtLeast3Percent: ctrPercent >= 3,
          conversionProxyAtLeast5Percent: clickToConversionProxyPercent >= 5,
          complaintRateUnder1Percent: complaintRatePercent < 1,
          retentionGuardProxyAtLeast95Percent: retentionGuardProxyPercent >= 95,
        },
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/trends',
    tags: [AFFILIATE_TAG, ADMIN_TAG],
    summary: 'Get affiliate trend buckets for conversion and trust metrics',
    operationId: 'getAffiliateTrends',
    middlewares: [requireAdminAnalyticsRead],
    query: AffiliateTrendsQuerySchema,
    responses: {
      200: {
        description: 'Affiliate trends by selected granularity',
        dataSchema: AffiliateTrendsResponseDataSchema,
      },
    },
    handler: async ({ req, res, query }) => {
      const granularity = query?.granularity ?? 'day'
      const events = await loadScopedEvents(req)
      const buckets = new Map<
        string,
        { exposures: number; clicks: number; attributedClicks: number; complaints: number }
      >()

      const isEligible = (event: (typeof events)[number]) => {
        if (query?.country && event.country !== query.country.toUpperCase()) {
          return false
        }
        if (query?.platform && event.platform !== query.platform) {
          return false
        }
        if (query?.channel && event.channel !== query.channel) {
          return false
        }
        return true
      }

      const touchBucket = (bucketStart: string) => {
        const bucket = buckets.get(bucketStart) ?? {
          exposures: 0,
          clicks: 0,
          attributedClicks: 0,
          complaints: 0,
        }
        buckets.set(bucketStart, bucket)
        return bucket
      }

      for (const event of events) {
        if (!isEligible(event)) {
          continue
        }
        const bucketStart = toBucketStart(new Date(event.receivedAtServer), granularity)
        const bucket = touchBucket(bucketStart)
        if (event.eventName.startsWith(EXPOSURE_EVENT_PREFIX)) {
          bucket.exposures += 1
          continue
        }
        if (event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)) {
          bucket.clicks += 1
          bucket.attributedClicks += 1
          continue
        }
        if (event.eventName.startsWith(CLICK_EVENT_PREFIX)) {
          bucket.clicks += 1
          continue
        }
        if (event.eventName.startsWith(COMPLAINT_EVENT_PREFIX)) {
          bucket.complaints += 1
        }
      }

      const data = [...buckets.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([bucketStart, value]) => ({
          bucketStart,
          exposures: value.exposures,
          clicks: value.clicks,
          attributedClicks: value.attributedClicks,
          complaints: value.complaints,
          clickThroughPercent:
            value.exposures > 0 ? Number(((value.clicks / value.exposures) * 100).toFixed(1)) : 0,
          attributionRatePercent:
            value.clicks > 0 ? Number(((value.attributedClicks / value.clicks) * 100).toFixed(1)) : 0,
          complaintRatePercent:
            value.clicks > 0 ? Number(((value.complaints / value.clicks) * 100).toFixed(1)) : 0,
        }))

      commonPresenter.ok(res, {
        meta: { audience: 'admin' as const },
        granularity,
        buckets: data,
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/dashboard',
    tags: [AFFILIATE_TAG, ADMIN_TAG],
    summary: 'Get affiliate partner dashboard with trust segmentation',
    operationId: 'getAffiliateDashboard',
    middlewares: [requireAdminAnalyticsRead],
    query: AffiliateDashboardQuerySchema,
    responses: {
      200: {
        description: 'Affiliate dashboard summary',
        dataSchema: AffiliateDashboardResponseDataSchema,
      },
    },
    handler: async ({ req, res, query }) => {
      const events = await loadScopedEvents(req)
      const partnerStats = new Map<
        string,
        {
          partnerName: string
          offerId: string
          intentSurface: string
          category: string
          exposures: number
          clicks: number
          attributedClicks: number
        }
      >()
      const trustSegmentStats = new Map<
        string,
        { exposures: number; clicks: number; complaints: number }
      >()
      let totalExposures = 0
      let totalClicks = 0
      let totalAttributedClicks = 0
      let totalComplaints = 0

      const matchesFilter = () => {
        if (query?.country && query.country !== '') {
          return true
        }
        if (query?.platform) {
          return true
        }
        if (query?.channel) {
          return true
        }
        return false
      }

      const isEligible = (event: (typeof events)[number]) => {
        if (query?.country && event.country !== query.country.toUpperCase()) {
          return false
        }
        if (query?.platform && event.platform !== query.platform) {
          return false
        }
        if (query?.channel && event.channel !== query.channel) {
          return false
        }
        return true
      }

      const trackSegment = (event: (typeof events)[number], kind: 'exposure' | 'click' | 'complaint') => {
        const segmentKey = `${event.country}|${event.platform}|${event.channel}`
        const segment = trustSegmentStats.get(segmentKey) ?? {
          exposures: 0,
          clicks: 0,
          complaints: 0,
        }
        if (kind === 'exposure') {
          segment.exposures += 1
        }
        if (kind === 'click') {
          segment.clicks += 1
        }
        if (kind === 'complaint') {
          segment.complaints += 1
        }
        trustSegmentStats.set(segmentKey, segment)
      }

      const trackPartner = (offerId: string, kind: 'exposure' | 'click' | 'attributedClick') => {
        const offer = OFFER_BY_ID.get(offerId)
        if (!offer) {
          return
        }
        const partner = partnerStats.get(offer.id) ?? {
          partnerName: offer.partnerName,
          offerId: offer.id,
          intentSurface: offer.intentSurface,
          category: offer.category,
          exposures: 0,
          clicks: 0,
          attributedClicks: 0,
        }
        if (kind === 'exposure') {
          partner.exposures += 1
        }
        if (kind === 'click') {
          partner.clicks += 1
        }
        if (kind === 'attributedClick') {
          partner.clicks += 1
          partner.attributedClicks += 1
        }
        partnerStats.set(offer.id, partner)
      }

      for (const event of events) {
        if (matchesFilter() && !isEligible(event)) {
          continue
        }

        if (event.eventName.startsWith(EXPOSURE_EVENT_PREFIX)) {
          const offerId = event.eventName.slice(EXPOSURE_EVENT_PREFIX.length)
          totalExposures += 1
          trackPartner(offerId, 'exposure')
          trackSegment(event, 'exposure')
          continue
        }
        if (event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)) {
          const offerId = event.eventName.slice(ATTRIBUTED_CLICK_EVENT_PREFIX.length)
          totalClicks += 1
          totalAttributedClicks += 1
          trackPartner(offerId, 'attributedClick')
          trackSegment(event, 'click')
          continue
        }
        if (event.eventName.startsWith(CLICK_EVENT_PREFIX)) {
          const offerId = event.eventName.slice(CLICK_EVENT_PREFIX.length)
          totalClicks += 1
          trackPartner(offerId, 'click')
          trackSegment(event, 'click')
          continue
        }
        if (event.eventName.startsWith(COMPLAINT_EVENT_PREFIX)) {
          totalComplaints += 1
          trackSegment(event, 'complaint')
        }
      }

      commonPresenter.ok(res, {
        meta: { audience: 'admin' as const },
        totals: {
          exposures: totalExposures,
          clicks: totalClicks,
          attributedClicks: totalAttributedClicks,
          complaints: totalComplaints,
        },
        partners: [...partnerStats.values()].map((partner) => ({
          partnerName: partner.partnerName,
          offerId: partner.offerId,
          intentSurface: partner.intentSurface,
          category: partner.category,
          exposures: partner.exposures,
          clicks: partner.clicks,
          attributedClicks: partner.attributedClicks,
          clickThroughPercent:
            partner.exposures > 0 ? Number(((partner.clicks / partner.exposures) * 100).toFixed(1)) : 0,
          attributionRatePercent:
            partner.clicks > 0
              ? Number(((partner.attributedClicks / partner.clicks) * 100).toFixed(1))
              : 0,
        })),
        trustBySegment: [...trustSegmentStats.entries()].map(([segmentKey, value]) => ({
          segmentKey,
          exposures: value.exposures,
          clicks: value.clicks,
          complaints: value.complaints,
          complaintRatePercent:
            value.clicks > 0 ? Number(((value.complaints / value.clicks) * 100).toFixed(1)) : 0,
        })),
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/metrics',
    tags: [AFFILIATE_TAG, ADMIN_TAG],
    summary: 'Get affiliate click aggregates by intent surface and category',
    operationId: 'getAffiliateMetrics',
    middlewares: [requireAdminAnalyticsRead],
    responses: {
      200: {
        description: 'Affiliate click aggregate metrics',
        dataSchema: AffiliateMetricsResponseDataSchema,
      },
    },
    handler: async ({ req, res }) => {
      const events = await loadScopedEvents(req)
      const byIntent = new Map<string, { clicks: number; attributedClicks: number }>()
      const byCategory = new Map<string, { clicks: number; attributedClicks: number }>()
      let totalClicks = 0
      let totalAttributedClicks = 0

      const apply = (offerId: string, attributed: boolean) => {
        const offer = OFFER_BY_ID.get(offerId)
        if (!offer) {
          return
        }
        const intentStats = byIntent.get(offer.intentSurface) ?? { clicks: 0, attributedClicks: 0 }
        intentStats.clicks += 1
        if (attributed) {
          intentStats.attributedClicks += 1
        }
        byIntent.set(offer.intentSurface, intentStats)

        const categoryStats = byCategory.get(offer.category) ?? { clicks: 0, attributedClicks: 0 }
        categoryStats.clicks += 1
        if (attributed) {
          categoryStats.attributedClicks += 1
        }
        byCategory.set(offer.category, categoryStats)
      }

      for (const event of events) {
        if (event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)) {
          const offerId = event.eventName.slice(ATTRIBUTED_CLICK_EVENT_PREFIX.length)
          totalClicks += 1
          totalAttributedClicks += 1
          apply(offerId, true)
          continue
        }
        if (event.eventName.startsWith(CLICK_EVENT_PREFIX)) {
          const offerId = event.eventName.slice(CLICK_EVENT_PREFIX.length)
          totalClicks += 1
          apply(offerId, false)
        }
      }

      commonPresenter.ok(res, {
        meta: { audience: 'admin' as const },
        totals: {
          clicks: totalClicks,
          attributedClicks: totalAttributedClicks,
        },
        byIntentSurface: [...byIntent.entries()].map(([intentSurface, value]) => ({
          intentSurface,
          clicks: value.clicks,
          attributedClicks: value.attributedClicks,
        })),
        byCategory: [...byCategory.entries()].map(([category, value]) => ({
          category,
          clicks: value.clicks,
          attributedClicks: value.attributedClicks,
        })),
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/affiliate/impact',
    tags: [AFFILIATE_TAG, ADMIN_TAG],
    summary: 'Get affiliate trust-impact summary from exposure/click/complaint events',
    operationId: 'getAffiliateImpact',
    middlewares: [requireAdminAnalyticsRead],
    responses: {
      200: {
        description: 'Affiliate impact summary',
        dataSchema: AffiliateImpactResponseDataSchema,
      },
    },
    handler: async ({ req, res }) => {
      const events = await loadScopedEvents(req)
      let exposures = 0
      let clicks = 0
      let attributedClicks = 0
      let complaints = 0

      for (const event of events) {
        if (event.eventName.startsWith(EXPOSURE_EVENT_PREFIX)) {
          exposures += 1
          continue
        }
        if (event.eventName.startsWith(ATTRIBUTED_CLICK_EVENT_PREFIX)) {
          clicks += 1
          attributedClicks += 1
          continue
        }
        if (event.eventName.startsWith(CLICK_EVENT_PREFIX)) {
          clicks += 1
          continue
        }
        if (event.eventName.startsWith(COMPLAINT_EVENT_PREFIX)) {
          complaints += 1
        }
      }

      commonPresenter.ok(res, {
        meta: { audience: 'admin' as const },
        totals: {
          exposures,
          clicks,
          attributedClicks,
          complaints,
        },
        complaintRatePercent: clicks > 0 ? Number(((complaints / clicks) * 100).toFixed(1)) : 0,
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/affiliate/click',
    tags: [AFFILIATE_TAG],
    summary: 'Track affiliate click with disclosure and consent-aware attribution',
    operationId: 'trackAffiliateClick',
    body: TrackAffiliateClickBodySchema,
    responses: {
      200: {
        description: 'Click tracked',
        dataSchema: TrackAffiliateClickResponseDataSchema,
      },
      400: {
        description: 'Disclosure is required before affiliate click attribution',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      if (!body?.disclosed) {
        const context = buildAnalyticsContext(req)
        await appendRawEvent({
          eventId: randomUUID(),
          eventName: `${DISCLOSURE_VIOLATION_EVENT_PREFIX}${body?.offerId ?? 'unknown'}`,
          occurredAtClient: new Date().toISOString(),
          receivedAtServer: new Date().toISOString(),
          userId: req.user?.id ?? null,
          sessionId: context.sessionId,
          deviceId: context.deviceId,
          platform: context.platform,
          country: context.country,
          channel: context.channel,
          appVersion: context.appVersion,
          schemaVersion: 1,
        })
        commonPresenter.error(
          res,
          400,
          'affiliate_disclosure_required',
          'Disclosure acceptance is required before tracking affiliate click attribution',
        )
        return
      }

      const offer = OFFER_BY_ID.get(body.offerId)
      if (!offer || offer.intentSurface !== body.intentSurface) {
        commonPresenter.error(res, 400, 'affiliate_offer_invalid', 'Affiliate offer is invalid for intent surface')
        return
      }

      const context = buildAnalyticsContext(req)
      const baseEvent = {
        occurredAtClient: new Date().toISOString(),
        receivedAtServer: new Date().toISOString(),
        userId: req.user?.id ?? null,
        sessionId: context.sessionId,
        deviceId: context.deviceId,
        platform: context.platform,
        country: context.country,
        channel: context.channel,
        appVersion: context.appVersion,
        schemaVersion: 1,
      } as const
      const eventPrefix = body.consentGranted ? ATTRIBUTED_CLICK_EVENT_PREFIX : CLICK_EVENT_PREFIX
      await appendRawEvent({
        eventId: randomUUID(),
        eventName: `${eventPrefix}${body.offerId}`,
        ...baseEvent,
      })

      commonPresenter.ok(res, {
        recorded: true as const,
        attributed: body.consentGranted,
        disclosureAccepted: true as const,
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/affiliate/exposure',
    tags: [AFFILIATE_TAG],
    summary: 'Track affiliate placement exposure at high-intent surfaces',
    operationId: 'trackAffiliateExposure',
    body: TrackAffiliateExposureBodySchema,
    responses: {
      200: {
        description: 'Exposure tracked',
        dataSchema: TrackAffiliateExposureResponseDataSchema,
      },
      400: {
        description: 'Invalid affiliate exposure payload',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      if (!body) {
        commonPresenter.error(res, 400, 'validation_error', 'Invalid request body')
        return
      }
      const offer = OFFER_BY_ID.get(body.offerId)
      if (!offer || offer.intentSurface !== body.intentSurface) {
        commonPresenter.error(res, 400, 'affiliate_offer_invalid', 'Affiliate offer is invalid for intent surface')
        return
      }

      const context = buildAnalyticsContext(req)
      if (!body.disclosed) {
        await appendRawEvent({
          eventId: randomUUID(),
          eventName: `${DISCLOSURE_VIOLATION_EVENT_PREFIX}${body.offerId}`,
          occurredAtClient: new Date().toISOString(),
          receivedAtServer: new Date().toISOString(),
          userId: req.user?.id ?? null,
          sessionId: context.sessionId,
          deviceId: context.deviceId,
          platform: context.platform,
          country: context.country,
          channel: context.channel,
          appVersion: context.appVersion,
          schemaVersion: 1,
        })
      }
      await appendRawEvent({
        eventId: randomUUID(),
        eventName: `${EXPOSURE_EVENT_PREFIX}${body.offerId}`,
        occurredAtClient: new Date().toISOString(),
        receivedAtServer: new Date().toISOString(),
        userId: req.user?.id ?? null,
        sessionId: context.sessionId,
        deviceId: context.deviceId,
        platform: context.platform,
        country: context.country,
        channel: context.channel,
        appVersion: context.appVersion,
        schemaVersion: 1,
      })

      commonPresenter.ok(res, {
        recorded: true as const,
        disclosureAccepted: body.disclosed,
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/affiliate/complaint',
    tags: [AFFILIATE_TAG],
    summary: 'Report trust complaint related to affiliate placements',
    operationId: 'reportAffiliateComplaint',
    body: ReportAffiliateComplaintBodySchema,
    responses: {
      200: {
        description: 'Complaint recorded',
        dataSchema: ReportAffiliateComplaintResponseDataSchema,
      },
      400: {
        description: 'Invalid complaint payload',
        schema: ApiErrorResponseSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      if (!body) {
        commonPresenter.error(res, 400, 'validation_error', 'Invalid request body')
        return
      }

      const suffix = body.offerId ?? body.intentSurface ?? 'general'
      const context = buildAnalyticsContext(req)
      await appendRawEvent({
        eventId: randomUUID(),
        eventName: `${COMPLAINT_EVENT_PREFIX}${suffix}`,
        occurredAtClient: new Date().toISOString(),
        receivedAtServer: new Date().toISOString(),
        userId: req.user?.id ?? null,
        sessionId: context.sessionId,
        deviceId: context.deviceId,
        platform: context.platform,
        country: context.country,
        channel: context.channel,
        appVersion: context.appVersion,
        schemaVersion: 1,
      })

      commonPresenter.ok(res, { recorded: true as const })
    },
  })

  return router
}
