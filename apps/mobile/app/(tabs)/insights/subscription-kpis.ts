import type { ConfidenceTier } from '../../components/kpi-with-confidence.helpers'

export type SubscriptionRetentionSummaryForUi = {
  trialStartRatePercent: number
  trialToPaidPercent: number
  month2PayerRetentionPercent: number
  refundRatePercent: number
  freeTierD30RetentionDeltaPercent: number
  confidence: {
    trialStartRate: ConfidenceTier
    trialToPaidRate: ConfidenceTier
    payerLifecycleRates: ConfidenceTier
    freeTierD30Delta: ConfidenceTier
  }
}

export type SubscriptionKpiItem = {
  key: 'trialStartRate' | 'trialToPaidRate' | 'month2PayerRetention' | 'refundRate' | 'freeTierD30Delta'
  label: string
  value: number
  confidence: ConfidenceTier
}

const isConfidenceTier = (value: unknown): value is ConfidenceTier =>
  value === 'low' || value === 'medium' || value === 'high'

function assertConfidencePayload(
  retention: SubscriptionRetentionSummaryForUi,
): asserts retention is SubscriptionRetentionSummaryForUi {
  const confidence = retention.confidence as Record<string, unknown> | undefined
  const confidenceValues = [
    confidence?.trialStartRate,
    confidence?.trialToPaidRate,
    confidence?.payerLifecycleRates,
    confidence?.freeTierD30Delta,
  ]
  if (confidenceValues.every((value) => isConfidenceTier(value))) {
    return
  }
  throw new Error('Invalid retention confidence payload')
}

export const buildSubscriptionKpiItems = (
  retention: SubscriptionRetentionSummaryForUi,
): SubscriptionKpiItem[] => {
  assertConfidencePayload(retention)
  return [
    {
      key: 'trialStartRate',
      label: 'Trial start rate',
      value: retention.trialStartRatePercent,
      confidence: retention.confidence.trialStartRate,
    },
    {
      key: 'trialToPaidRate',
      label: 'Trial to paid',
      value: retention.trialToPaidPercent,
      confidence: retention.confidence.trialToPaidRate,
    },
    {
      key: 'month2PayerRetention',
      label: 'Month-2 payer retention',
      value: retention.month2PayerRetentionPercent,
      confidence: retention.confidence.payerLifecycleRates,
    },
    {
      key: 'refundRate',
      label: 'Refund rate',
      value: retention.refundRatePercent,
      confidence: retention.confidence.payerLifecycleRates,
    },
    {
      key: 'freeTierD30Delta',
      label: 'Free-tier D30 delta',
      value: retention.freeTierD30RetentionDeltaPercent,
      confidence: retention.confidence.freeTierD30Delta,
    },
  ]
}
