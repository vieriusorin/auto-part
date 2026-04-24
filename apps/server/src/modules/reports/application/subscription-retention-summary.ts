import type { NormalizedAnalyticsEvent } from '../../analytics/schemas.js'
import type { PersistedRollupRow } from '../../analytics/repository.js'

type SubscriptionRetentionSummary = {
  trialStartRatePercent: number
  trialToPaidPercent: number
  month2PayerRetentionPercent: number
  refundRatePercent: number
  freeTierD30RetentionDeltaPercent: number
  confidence: {
    trialStartRate: 'low' | 'medium' | 'high'
    trialToPaidRate: 'low' | 'medium' | 'high'
    payerLifecycleRates: 'low' | 'medium' | 'high'
    freeTierD30Delta: 'low' | 'medium' | 'high'
  }
  sampleSize: {
    paywallViews: number
    trialStarts: number
    paidConversions: number
    lowSampleThreshold: number
  }
  notes: string[]
}

const TRIAL_STARTED_EVENTS = new Set(['subscription_trial_started', 'subscription_trial_start'])
const PAYWALL_VIEWED_EVENTS = new Set(['subscription_paywall_viewed', 'paywall_viewed'])
const PAID_CONVERTED_EVENTS = new Set([
  'subscription_converted_to_paid',
  'subscription_paid_started',
])
const MONTH2_ACTIVE_EVENTS = new Set(['subscription_month2_active'])
const REFUNDED_EVENTS = new Set(['subscription_refunded'])

const toPercent = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {
    return 0
  }
  return Number(((numerator / denominator) * 100).toFixed(1))
}
const LOW_SAMPLE_THRESHOLD = 10
const MEDIUM_SAMPLE_THRESHOLD = 30
const LOW_FREE_TIER_BASELINE_THRESHOLD = 100
const MEDIUM_FREE_TIER_BASELINE_THRESHOLD = 500

const confidenceFromDenominator = (denominator: number): 'low' | 'medium' | 'high' => {
  if (denominator < LOW_SAMPLE_THRESHOLD) {
    return 'low'
  }
  if (denominator < MEDIUM_SAMPLE_THRESHOLD) {
    return 'medium'
  }
  return 'high'
}

const confidenceFromFreeTierBaseline = (
  prePaywallActivations: number,
  postPaywallActivations: number,
): 'low' | 'medium' | 'high' => {
  const baselineDenominator = Math.min(prePaywallActivations, postPaywallActivations)
  if (baselineDenominator < LOW_FREE_TIER_BASELINE_THRESHOLD) {
    return 'low'
  }
  if (baselineDenominator < MEDIUM_FREE_TIER_BASELINE_THRESHOLD) {
    return 'medium'
  }
  return 'high'
}

export const buildSubscriptionRetentionSummary = (
  events: NormalizedAnalyticsEvent[],
  rollups: PersistedRollupRow[],
): SubscriptionRetentionSummary => {
  const seenEventIds = new Set<string>()
  let paywallViews = 0
  let trialStarts = 0
  let paidConversions = 0
  let month2ActivePayers = 0
  let refunds = 0

  for (const event of events) {
    if (seenEventIds.has(event.eventId)) {
      continue
    }
    seenEventIds.add(event.eventId)

    if (PAYWALL_VIEWED_EVENTS.has(event.eventName)) {
      paywallViews += 1
      continue
    }
    if (TRIAL_STARTED_EVENTS.has(event.eventName)) {
      trialStarts += 1
      continue
    }
    if (PAID_CONVERTED_EVENTS.has(event.eventName)) {
      paidConversions += 1
      continue
    }
    if (MONTH2_ACTIVE_EVENTS.has(event.eventName)) {
      month2ActivePayers += 1
      continue
    }
    if (REFUNDED_EVENTS.has(event.eventName)) {
      refunds += 1
    }
  }

  const prePaywallRows = rollups.filter((row) => row.channel === 'free_pre_paywall')
  const postPaywallRows = rollups.filter((row) => row.channel === 'free_post_paywall')
  const prePaywallActivations = prePaywallRows.reduce((sum, row) => sum + row.activationCount, 0)
  const prePaywallD30 = prePaywallRows.reduce((sum, row) => sum + row.d30Retained, 0)
  const postPaywallActivations = postPaywallRows.reduce((sum, row) => sum + row.activationCount, 0)
  const postPaywallD30 = postPaywallRows.reduce((sum, row) => sum + row.d30Retained, 0)
  const prePaywallD30Rate = toPercent(prePaywallD30, prePaywallActivations)
  const postPaywallD30Rate = toPercent(postPaywallD30, postPaywallActivations)
  const freeTierD30RetentionDeltaPercent =
    prePaywallActivations > 0 && postPaywallActivations > 0
      ? Number((postPaywallD30Rate - prePaywallD30Rate).toFixed(1))
      : 0

  const hasPrePostBaselines = prePaywallActivations > 0 && postPaywallActivations > 0
  const sampleSizeNotes: string[] = []
  if (paywallViews > 0 && paywallViews < LOW_SAMPLE_THRESHOLD) {
    sampleSizeNotes.push(
      'trialStartRatePercent is based on a low sample size (<10 paywall views); interpret trend directionally.',
    )
  }
  if (trialStarts > 0 && trialStarts < LOW_SAMPLE_THRESHOLD) {
    sampleSizeNotes.push(
      'trialToPaidPercent is based on a low sample size (<10 trial starts); interpret trend directionally.',
    )
  }
  if (paidConversions > 0 && paidConversions < LOW_SAMPLE_THRESHOLD) {
    sampleSizeNotes.push(
      'month2PayerRetentionPercent and refundRatePercent are based on a low sample size (<10 paid conversions).',
    )
  }

  return {
    trialStartRatePercent: toPercent(trialStarts, paywallViews),
    trialToPaidPercent: toPercent(paidConversions, trialStarts),
    month2PayerRetentionPercent: toPercent(month2ActivePayers, paidConversions),
    refundRatePercent: toPercent(refunds, paidConversions),
    freeTierD30RetentionDeltaPercent,
    confidence: {
      trialStartRate: confidenceFromDenominator(paywallViews),
      trialToPaidRate: confidenceFromDenominator(trialStarts),
      payerLifecycleRates: confidenceFromDenominator(paidConversions),
      freeTierD30Delta: confidenceFromFreeTierBaseline(prePaywallActivations, postPaywallActivations),
    },
    sampleSize: {
      paywallViews,
      trialStarts,
      paidConversions,
      lowSampleThreshold: LOW_SAMPLE_THRESHOLD,
    },
    notes: [
      'Summary derived from billing analytics events (paywall, trial, conversion, refund).',
      hasPrePostBaselines
        ? 'freeTierD30RetentionDeltaPercent derived from free_pre_paywall and free_post_paywall rollup cohorts.'
        : 'freeTierD30RetentionDeltaPercent defaults to 0 until free_pre_paywall and free_post_paywall baseline cohorts are available.',
      ...sampleSizeNotes,
    ],
  }
}
