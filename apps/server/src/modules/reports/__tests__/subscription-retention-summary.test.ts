import { describe, expect, it } from 'vitest'
import type { NormalizedAnalyticsEvent } from '../../analytics/schemas.js'
import type { PersistedRollupRow } from '../../analytics/repository.js'
import { buildSubscriptionRetentionSummary } from '../application/subscription-retention-summary.js'

const createEvent = (eventName: string, id: string): NormalizedAnalyticsEvent => ({
  eventId: id,
  eventName,
  occurredAtClient: new Date('2026-04-22T10:00:00.000Z').toISOString(),
  receivedAtServer: new Date('2026-04-22T10:00:01.000Z').toISOString(),
  sessionId: `session-${id}`,
  deviceId: `device-${id}`,
  platform: 'ios',
  country: 'RO',
  channel: 'organic',
  appVersion: '1.0.0',
  schemaVersion: 1,
  userId: null,
})

describe('buildSubscriptionRetentionSummary', () => {
  it('computes rates from analytics subscription events', () => {
    const events: NormalizedAnalyticsEvent[] = [
      createEvent('subscription_paywall_viewed', '1'),
      createEvent('subscription_paywall_viewed', '2'),
      createEvent('subscription_paywall_viewed', '3'),
      createEvent('subscription_paywall_viewed', '4'),
      createEvent('subscription_trial_started', '5'),
      createEvent('subscription_trial_started', '6'),
      createEvent('subscription_converted_to_paid', '7'),
      createEvent('subscription_month2_active', '8'),
      createEvent('subscription_refunded', '9'),
    ]

    const summary = buildSubscriptionRetentionSummary(events, [])

    expect(summary.trialStartRatePercent).toBe(50)
    expect(summary.trialToPaidPercent).toBe(50)
    expect(summary.month2PayerRetentionPercent).toBe(100)
    expect(summary.refundRatePercent).toBe(100)
    expect(summary.freeTierD30RetentionDeltaPercent).toBe(0)
  })

  it('returns zeros when required billing signals are missing', () => {
    const summary = buildSubscriptionRetentionSummary(
      [createEvent('subscription_paywall_viewed', '1'), createEvent('subscription_paywall_viewed', '2')],
      [],
    )

    expect(summary.trialStartRatePercent).toBe(0)
    expect(summary.trialToPaidPercent).toBe(0)
    expect(summary.month2PayerRetentionPercent).toBe(0)
    expect(summary.refundRatePercent).toBe(0)
    expect(summary.freeTierD30RetentionDeltaPercent).toBe(0)
    expect(summary.notes[0]).toBe(
      'Summary derived from billing analytics events (paywall, trial, conversion, refund).',
    )
    expect(summary.notes[1]).toBe(
      'freeTierD30RetentionDeltaPercent defaults to 0 until free_pre_paywall and free_post_paywall baseline cohorts are available.',
    )
  })

  it('computes free-tier D30 delta from pre/post paywall baseline channels', () => {
    const rollups: PersistedRollupRow[] = [
      {
        date: '2026-04-01',
        country: 'RO',
        platform: 'ios',
        channel: 'free_pre_paywall',
        activationCount: 100,
        d1Retained: 55,
        d7Retained: 36,
        d30Retained: 20,
        wau: 100,
        mau: 220,
        maintenanceActionsCompleted: 20,
      },
      {
        date: '2026-04-08',
        country: 'RO',
        platform: 'ios',
        channel: 'free_post_paywall',
        activationCount: 100,
        d1Retained: 50,
        d7Retained: 30,
        d30Retained: 17,
        wau: 90,
        mau: 210,
        maintenanceActionsCompleted: 18,
      },
    ]

    const summary = buildSubscriptionRetentionSummary([], rollups)

    expect(summary.freeTierD30RetentionDeltaPercent).toBe(-3)
    expect(summary.notes[1]).toBe(
      'freeTierD30RetentionDeltaPercent derived from free_pre_paywall and free_post_paywall rollup cohorts.',
    )
  })
})
