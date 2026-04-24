import { describe, expect, it } from 'vitest'
import type {
  SpendKpisResponseData,
  SubscriptionRetentionSummaryResponseDataSchema,
} from '@autocare/shared'
import {
  filterSpendKpisResponse,
  filterSubscriptionRetentionResponse,
} from '../application/report-field-filter.js'
import type { infer as ZodInfer } from 'zod'

type SubscriptionRetentionSummaryResponseData = ZodInfer<
  typeof SubscriptionRetentionSummaryResponseDataSchema
>

const elevatedScope = {
  actorId: 'user-1',
  organizationId: 'org-1',
  isElevated: true,
}

const nonElevatedScope = {
  actorId: 'user-2',
  organizationId: 'org-1',
  isElevated: false,
}

const spendPayload: SpendKpisResponseData = {
  range: {
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-01-31T00:00:00.000Z',
    granularity: 'month',
  },
  totals: {
    totalSpend: 1000,
    maintenanceSpend: 1000,
    fuelSpend: 0,
  },
  byPeriod: [{ periodStart: '2026-01-01T00:00:00.000Z', spend: 1000 }],
  byCategory: [{ category: 'oil', spend: 1000 }],
  byVehicle: [{ vehicleId: '11111111-1111-4111-8111-111111111111', spend: 1000 }],
  advanced: {
    trendDeltaPercent: 12,
    forecastNextPeriodSpend: 900,
    anomalies: [
      {
        periodStart: '2026-01-01T00:00:00.000Z',
        spend: 1000,
        threshold: 500,
        reason: 'spend_above_threshold',
      },
    ],
  },
}

const retentionPayload: SubscriptionRetentionSummaryResponseData = {
  trialStartRatePercent: 80,
  trialToPaidPercent: 40,
  month2PayerRetentionPercent: 50,
  refundRatePercent: 5,
  freeTierD30RetentionDeltaPercent: 3.2,
  confidence: {
    trialStartRate: 'high',
    trialToPaidRate: 'medium',
    payerLifecycleRates: 'medium',
    freeTierD30Delta: 'low',
  },
  sampleSize: {
    paywallViews: 120,
    trialStarts: 96,
    paidConversions: 38,
    lowSampleThreshold: 10,
  },
  notes: [
    'Summary derived from billing analytics events.',
    'trialStartRatePercent is based on a low sample size (<10 paywall views); interpret trend directionally.',
  ],
}

describe('report field filters', () => {
  it('keeps full spend payload for elevated scope', () => {
    const result = filterSpendKpisResponse(elevatedScope, spendPayload)
    expect(result.byVehicle).toHaveLength(1)
    expect(result.advanced.anomalies).toHaveLength(1)
  })

  it('redacts spend sensitive fields for non-elevated scope', () => {
    const result = filterSpendKpisResponse(nonElevatedScope, spendPayload)
    expect(result.byVehicle).toEqual([])
    expect(result.advanced.anomalies).toEqual([])
  })

  it('keeps retention sample size for elevated scope', () => {
    const result = filterSubscriptionRetentionResponse(elevatedScope, retentionPayload)
    expect(result.sampleSize.paywallViews).toBe(120)
  })

  it('redacts retention sample size for non-elevated scope', () => {
    const result = filterSubscriptionRetentionResponse(nonElevatedScope, retentionPayload)
    expect(result.sampleSize.paywallViews).toBe(0)
    expect(result.sampleSize.trialStarts).toBe(0)
    expect(result.sampleSize.paidConversions).toBe(0)
    expect(result.notes[0]).toBe('Detailed sample size fields are hidden for non-elevated report readers.')
  })
})

