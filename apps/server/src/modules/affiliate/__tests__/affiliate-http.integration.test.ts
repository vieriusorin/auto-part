import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { errorHandler } from '../../../interfaces/http/middlewares/error-handler.middleware.js'
import { appendRawEvent, clearRawEvents } from '../../analytics/repository.js'
import { createAffiliateRouter } from '../interfaces/http/affiliate-routes.js'

const buildApp = () => {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = {
      id: 'admin-user',
      email: 'admin@example.com',
      role: 'admin',
      organizationId: 'org-admin',
      organizationPlan: 'premium',
      planOverride: null,
      effectivePlan: 'premium',
      permissions: ['*'],
      tokenId: 'token-admin',
    }
    next()
  })
  app.use('/api', createAffiliateRouter())
  app.use(errorHandler)
  return app
}

describe('affiliate HTTP routes', () => {
  beforeEach(async () => {
    await clearRawEvents()
  })

  it('lists all offers and supports intent-surface filtering', async () => {
    const app = buildApp()

    const all = await request(app).get('/api/affiliate/offers')
    expect(all.status).toBe(200)
    expect(all.body.data.items.length).toBeGreaterThanOrEqual(3)

    const filtered = await request(app).get('/api/affiliate/offers').query({
      intentSurface: 'maintenance_due',
    })
    expect(filtered.status).toBe(200)
    expect(filtered.body.data.items.length).toBeGreaterThanOrEqual(1)
    expect(
      filtered.body.data.items.every(
        (item: { intentSurface: string }) => item.intentSurface === 'maintenance_due',
      ),
    ).toBe(true)
    expect(
      all.body.data.items.every(
        (item: { disclosureLabel: string }) => item.disclosureLabel === 'Sponsored recommendation',
      ),
    ).toBe(true)
  })

  it('rejects click tracking if disclosure is not accepted', async () => {
    const app = buildApp()

    const rejected = await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: false,
      consentGranted: true,
    })
    expect(rejected.status).toBe(400)
    expect(rejected.body.error.code).toBe('affiliate_disclosure_required')
  })

  it('returns disclosure compliance audit metrics for admin analytics', async () => {
    const app = buildApp()

    await request(app).post('/api/affiliate/exposure').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
    })
    await request(app).post('/api/affiliate/exposure').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: false,
    })
    await request(app).post('/api/affiliate/click').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: true,
    })

    const audit = await request(app).get('/api/affiliate/disclosure-audit').query({
      country: 'RO',
      platform: 'ios',
      channel: 'organic',
    })
    expect(audit.status).toBe(200)
    expect(audit.body.data.meta).toEqual({ audience: 'admin' })
    expect(audit.body.data.totals).toEqual({
      trackedInteractions: 3,
      compliantInteractions: 2,
      violations: 1,
    })
    expect(audit.body.data.disclosureCompliancePercent).toBe(66.7)
    expect(audit.body.data.checkpoint.disclosureComplianceFull).toBe(false)
  })

  it('tracks click with consent-aware attribution', async () => {
    const app = buildApp()

    const accepted = await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: false,
    })
    expect(accepted.status).toBe(200)
    expect(accepted.body.data.recorded).toBe(true)
    expect(accepted.body.data.disclosureAccepted).toBe(true)
    expect(accepted.body.data.attributed).toBe(false)
  })

  it('aggregates persisted affiliate click metrics by intent surface and category', async () => {
    const app = buildApp()

    await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: false,
    })
    await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: true,
    })
    await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: true,
      consentGranted: true,
    })

    const metrics = await request(app).get('/api/affiliate/metrics')
    expect(metrics.status).toBe(200)
    expect(metrics.body.data.meta).toEqual({ audience: 'admin' })
    expect(metrics.body.data.totals).toEqual({
      clicks: 3,
      attributedClicks: 2,
    })

    expect(metrics.body.data.byIntentSurface).toEqual(
      expect.arrayContaining([
        {
          intentSurface: 'maintenance_due',
          clicks: 2,
          attributedClicks: 1,
        },
        {
          intentSurface: 'service_report_ready',
          clicks: 1,
          attributedClicks: 1,
        },
      ]),
    )

    expect(metrics.body.data.byCategory).toEqual(
      expect.arrayContaining([
        {
          category: 'maintenance_parts',
          clicks: 2,
          attributedClicks: 1,
        },
        {
          category: 'inspection_service',
          clicks: 1,
          attributedClicks: 1,
        },
      ]),
    )
  })

  it('rejects click tracking when offer is invalid for intent surface', async () => {
    const app = buildApp()

    const invalid = await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'service_report_ready',
      disclosed: true,
      consentGranted: true,
    })

    expect(invalid.status).toBe(400)
    expect(invalid.body.error.code).toBe('affiliate_offer_invalid')
  })

  it('tracks exposures and complaints then returns affiliate impact summary', async () => {
    const app = buildApp()

    await request(app).post('/api/affiliate/exposure').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
    })
    await request(app).post('/api/affiliate/exposure').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: true,
    })

    await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: false,
    })
    await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: true,
      consentGranted: true,
    })

    await request(app).post('/api/affiliate/complaint').send({
      reason: 'Label looked unclear on placement',
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosureVisible: false,
    })

    const impact = await request(app).get('/api/affiliate/impact')
    expect(impact.status).toBe(200)
    expect(impact.body.data.meta).toEqual({ audience: 'admin' })
    expect(impact.body.data.totals).toEqual({
      exposures: 2,
      clicks: 2,
      attributedClicks: 1,
      complaints: 1,
    })
    expect(impact.body.data.complaintRatePercent).toBe(50)
  })

  it('builds partner dashboard metrics and respects country/platform/channel filters', async () => {
    const app = buildApp()

    await request(app).post('/api/affiliate/exposure').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
    })
    await request(app).post('/api/affiliate/click').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: true,
    })
    await request(app).post('/api/affiliate/complaint').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      reason: 'Disclosure not clear enough',
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosureVisible: false,
    })

    await request(app).post('/api/affiliate/exposure').set('X-Platform', 'android').set('X-Country', 'DE').set('X-Channel', 'paid-social').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: true,
    })
    await request(app).post('/api/affiliate/click').set('X-Platform', 'android').set('X-Country', 'DE').set('X-Channel', 'paid-social').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: true,
      consentGranted: false,
    })

    const all = await request(app).get('/api/affiliate/dashboard')
    expect(all.status).toBe(200)
    expect(all.body.data.meta).toEqual({ audience: 'admin' })
    expect(all.body.data.totals).toEqual({
      exposures: 2,
      clicks: 2,
      attributedClicks: 1,
      complaints: 1,
    })
    expect(all.body.data.partners).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          offerId: 'offer-maint-oil-kit',
          partnerName: 'AutoParts Direct',
          clickThroughPercent: 100,
          attributionRatePercent: 100,
        }),
        expect.objectContaining({
          offerId: 'offer-report-inspection',
          partnerName: 'Trusted Garage Network',
          clickThroughPercent: 100,
          attributionRatePercent: 0,
        }),
      ]),
    )
    expect(all.body.data.trustBySegment).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          segmentKey: 'RO|ios|organic',
          exposures: 1,
          clicks: 1,
          complaints: 1,
          complaintRatePercent: 100,
        }),
      ]),
    )

    const filtered = await request(app).get('/api/affiliate/dashboard').query({
      country: 'RO',
      platform: 'ios',
      channel: 'organic',
    })
    expect(filtered.status).toBe(200)
    expect(filtered.body.data.meta).toEqual({ audience: 'admin' })
    expect(filtered.body.data.totals).toEqual({
      exposures: 1,
      clicks: 1,
      attributedClicks: 1,
      complaints: 1,
    })
    expect(filtered.body.data.partners).toHaveLength(1)
    expect(filtered.body.data.partners[0]?.offerId).toBe('offer-maint-oil-kit')
  })

  it('returns day and week trend buckets for affiliate conversion and trust metrics', async () => {
    const app = buildApp()

    await appendRawEvent({
      eventId: 'exp-1',
      eventName: 'affiliate_exposure__offer-maint-oil-kit',
      occurredAtClient: '2026-04-14T08:00:00.000Z',
      receivedAtServer: '2026-04-14T08:00:01.000Z',
      userId: null,
      sessionId: 's-1',
      deviceId: 'd-1',
      platform: 'ios',
      country: 'RO',
      channel: 'organic',
      appVersion: '1.0.0',
      schemaVersion: 1,
    })
    await appendRawEvent({
      eventId: 'click-1',
      eventName: 'affiliate_click_attributed__offer-maint-oil-kit',
      occurredAtClient: '2026-04-14T09:00:00.000Z',
      receivedAtServer: '2026-04-14T09:00:01.000Z',
      userId: null,
      sessionId: 's-2',
      deviceId: 'd-2',
      platform: 'ios',
      country: 'RO',
      channel: 'organic',
      appVersion: '1.0.0',
      schemaVersion: 1,
    })
    await appendRawEvent({
      eventId: 'complaint-1',
      eventName: 'affiliate_complaint__offer-maint-oil-kit',
      occurredAtClient: '2026-04-16T10:00:00.000Z',
      receivedAtServer: '2026-04-16T10:00:01.000Z',
      userId: null,
      sessionId: 's-3',
      deviceId: 'd-3',
      platform: 'ios',
      country: 'RO',
      channel: 'organic',
      appVersion: '1.0.0',
      schemaVersion: 1,
    })

    const day = await request(app).get('/api/affiliate/trends').query({ granularity: 'day' })
    expect(day.status).toBe(200)
    expect(day.body.data.meta).toEqual({ audience: 'admin' })
    expect(day.body.data.granularity).toBe('day')
    expect(day.body.data.buckets).toHaveLength(2)
    expect(day.body.data.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bucketStart: '2026-04-14T00:00:00.000Z',
          exposures: 1,
          clicks: 1,
          attributedClicks: 1,
          complaints: 0,
          clickThroughPercent: 100,
          attributionRatePercent: 100,
          complaintRatePercent: 0,
        }),
        expect.objectContaining({
          bucketStart: '2026-04-16T00:00:00.000Z',
          exposures: 0,
          clicks: 0,
          attributedClicks: 0,
          complaints: 1,
          complaintRatePercent: 0,
        }),
      ]),
    )

    const week = await request(app).get('/api/affiliate/trends').query({
      granularity: 'week',
      country: 'RO',
      platform: 'ios',
      channel: 'organic',
    })
    expect(week.status).toBe(200)
    expect(week.body.data.meta).toEqual({ audience: 'admin' })
    expect(week.body.data.granularity).toBe('week')
    expect(week.body.data.buckets).toHaveLength(1)
    expect(week.body.data.buckets[0]).toMatchObject({
      bucketStart: '2026-04-13T00:00:00.000Z',
      exposures: 1,
      clicks: 1,
      attributedClicks: 1,
      complaints: 1,
      clickThroughPercent: 100,
      attributionRatePercent: 100,
      complaintRatePercent: 100,
    })
  })

  it('returns KPI gate snapshot and checkpoint booleans', async () => {
    const app = buildApp()

    await request(app).post('/api/affiliate/exposure').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
    })
    await request(app).post('/api/affiliate/exposure').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: true,
    })
    await request(app).post('/api/affiliate/click').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: true,
    })
    await request(app).post('/api/affiliate/click').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosed: true,
      consentGranted: false,
    })
    await request(app).post('/api/affiliate/complaint').set('X-Platform', 'ios').set('X-Country', 'RO').set('X-Channel', 'organic').send({
      reason: 'sponsored label too subtle',
      offerId: 'offer-report-inspection',
      intentSurface: 'service_report_ready',
      disclosureVisible: false,
    })

    const snapshot = await request(app).get('/api/affiliate/kpi-gates').query({
      country: 'RO',
      platform: 'ios',
      channel: 'organic',
    })

    expect(snapshot.status).toBe(200)
    expect(snapshot.body.data.meta).toEqual({ audience: 'admin' })
    expect(snapshot.body.data.snapshot).toEqual({
      exposures: 2,
      clicks: 2,
      attributedClicks: 1,
      complaints: 1,
      ctrPercent: 100,
      clickToConversionProxyPercent: 50,
      complaintRatePercent: 50,
      retentionGuardProxyPercent: 50,
    })
    expect(snapshot.body.data.checkpoints).toEqual({
      ctrAtLeast3Percent: true,
      conversionProxyAtLeast5Percent: true,
      complaintRateUnder1Percent: false,
      retentionGuardProxyAtLeast95Percent: false,
    })
  })

  it('reports phase exit readiness with missing evidence reasons', async () => {
    const app = buildApp()

    const empty = await request(app).get('/api/affiliate/phase-exit-readiness')
    expect(empty.status).toBe(200)
    expect(empty.body.data.meta).toEqual({ audience: 'admin' })
    expect(empty.body.data.ready).toBe(false)
    expect(empty.body.data.criteria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'ctr_at_least_3_percent', passed: false }),
        expect.objectContaining({ key: 'conversion_at_least_5_percent', passed: false }),
        expect.objectContaining({ key: 'disclosure_compliance_full', passed: false }),
      ]),
    )
    expect(empty.body.data.missingEvidence).toEqual(
      expect.arrayContaining([
        'affiliate_exposures',
        'affiliate_clicks',
        'affiliate_disclosure_audit',
        'retention_control_cohort_comparison',
      ]),
    )

    await request(app).post('/api/affiliate/exposure').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
    })
    await request(app).post('/api/affiliate/click').send({
      offerId: 'offer-maint-oil-kit',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: true,
    })

    const populated = await request(app).get('/api/affiliate/phase-exit-readiness')
    expect(populated.status).toBe(200)
    expect(populated.body.data.meta).toEqual({ audience: 'admin' })
    expect(populated.body.data.criteria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'ctr_at_least_3_percent', passed: true }),
        expect.objectContaining({ key: 'conversion_at_least_5_percent', passed: true }),
        expect.objectContaining({ key: 'disclosure_compliance_full', passed: true }),
      ]),
    )
    expect(populated.body.data.missingEvidence).toEqual(
      expect.arrayContaining(['retention_control_cohort_comparison']),
    )
  })

  it('evaluates retention decline criterion using affiliate vs control cohorts', async () => {
    const app = buildApp()

    await appendRawEvent({
      eventId: 'aff-exp',
      eventName: 'affiliate_exposure__offer-maint-oil-kit',
      occurredAtClient: '2026-04-14T08:00:00.000Z',
      receivedAtServer: '2026-04-14T08:00:01.000Z',
      userId: 'user-affiliate',
      sessionId: 's-aff-1',
      deviceId: 'd-aff-1',
      platform: 'ios',
      country: 'RO',
      channel: 'organic',
      appVersion: '1.0.0',
      schemaVersion: 1,
    })
    await appendRawEvent({
      eventId: 'ctrl-paywall',
      eventName: 'subscription_paywall_viewed',
      occurredAtClient: '2026-04-14T09:00:00.000Z',
      receivedAtServer: '2026-04-14T09:00:01.000Z',
      userId: 'user-control',
      sessionId: 's-ctrl-1',
      deviceId: 'd-ctrl-1',
      platform: 'ios',
      country: 'RO',
      channel: 'organic',
      appVersion: '1.0.0',
      schemaVersion: 1,
    })
    await appendRawEvent({
      eventId: 'ctrl-month2',
      eventName: 'subscription_month2_active',
      occurredAtClient: '2026-04-15T09:00:00.000Z',
      receivedAtServer: '2026-04-15T09:00:01.000Z',
      userId: 'user-control',
      sessionId: 's-ctrl-2',
      deviceId: 'd-ctrl-2',
      platform: 'ios',
      country: 'RO',
      channel: 'organic',
      appVersion: '1.0.0',
      schemaVersion: 1,
    })

    const readiness = await request(app).get('/api/affiliate/phase-exit-readiness')
    expect(readiness.status).toBe(200)
    const retentionCriterion = readiness.body.data.criteria.find(
      (item: { key: string }) => item.key === 'no_retention_decline_detected',
    )
    expect(retentionCriterion).toMatchObject({
      key: 'no_retention_decline_detected',
      passed: false,
      value: -100,
      threshold: 0,
    })
    expect(readiness.body.data.missingEvidence).not.toContain('retention_control_cohort_comparison')
  })
})
