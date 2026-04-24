import { describe, expect, it } from 'vitest'
import { buildSubscriptionKpiItems } from './subscription-kpis'

describe('buildSubscriptionKpiItems', () => {
  it('builds all five subscription KPI rows with expected labels and confidence mapping', () => {
    const rows = buildSubscriptionKpiItems({
      trialStartRatePercent: 60,
      trialToPaidPercent: 66.7,
      month2PayerRetentionPercent: 50,
      refundRatePercent: 50,
      freeTierD30RetentionDeltaPercent: -3,
      confidence: {
        trialStartRate: 'medium',
        trialToPaidRate: 'medium',
        payerLifecycleRates: 'low',
        freeTierD30Delta: 'high',
      },
    })

    expect(rows).toHaveLength(5)
    expect(rows.map((row) => row.label)).toEqual([
      'Trial start rate',
      'Trial to paid',
      'Month-2 payer retention',
      'Refund rate',
      'Free-tier D30 delta',
    ])
    expect(rows.map((row) => row.key)).toEqual([
      'trialStartRate',
      'trialToPaidRate',
      'month2PayerRetention',
      'refundRate',
      'freeTierD30Delta',
    ])
    expect(rows[0]?.confidence).toBe('medium')
    expect(rows[1]?.confidence).toBe('medium')
    expect(rows[2]?.confidence).toBe('low')
    expect(rows[3]?.confidence).toBe('low')
    expect(rows[4]?.confidence).toBe('high')
  })

  it('preserves negative free-tier D30 delta values without normalization side effects', () => {
    const rows = buildSubscriptionKpiItems({
      trialStartRatePercent: 12.5,
      trialToPaidPercent: 10,
      month2PayerRetentionPercent: 20,
      refundRatePercent: 5,
      freeTierD30RetentionDeltaPercent: -3.4,
      confidence: {
        trialStartRate: 'low',
        trialToPaidRate: 'low',
        payerLifecycleRates: 'low',
        freeTierD30Delta: 'medium',
      },
    })

    const deltaRow = rows.find((row) => row.key === 'freeTierD30Delta')
    expect(deltaRow?.value).toBe(-3.4)
    expect(deltaRow?.label).toBe('Free-tier D30 delta')
    expect(deltaRow?.confidence).toBe('medium')
  })

  it('keeps all KPI rows when values are zero', () => {
    const rows = buildSubscriptionKpiItems({
      trialStartRatePercent: 0,
      trialToPaidPercent: 0,
      month2PayerRetentionPercent: 0,
      refundRatePercent: 0,
      freeTierD30RetentionDeltaPercent: 0,
      confidence: {
        trialStartRate: 'low',
        trialToPaidRate: 'low',
        payerLifecycleRates: 'low',
        freeTierD30Delta: 'low',
      },
    })

    expect(rows).toHaveLength(5)
    expect(rows.every((row) => row.value === 0)).toBe(true)
    expect(rows.map((row) => row.key)).toEqual([
      'trialStartRate',
      'trialToPaidRate',
      'month2PayerRetention',
      'refundRate',
      'freeTierD30Delta',
    ])
  })

  it('always maps confidence tiers for every KPI row', () => {
    const rows = buildSubscriptionKpiItems({
      trialStartRatePercent: 0,
      trialToPaidPercent: 0,
      month2PayerRetentionPercent: 0,
      refundRatePercent: 0,
      freeTierD30RetentionDeltaPercent: 0,
      confidence: {
        trialStartRate: 'low',
        trialToPaidRate: 'medium',
        payerLifecycleRates: 'high',
        freeTierD30Delta: 'low',
      },
    })

    expect(rows).toHaveLength(5)
    expect(rows.every((row) => row.confidence === 'low' || row.confidence === 'medium' || row.confidence === 'high')).toBe(true)
    expect(rows.find((row) => row.key === 'trialStartRate')?.confidence).toBe('low')
    expect(rows.find((row) => row.key === 'trialToPaidRate')?.confidence).toBe('medium')
    expect(rows.find((row) => row.key === 'month2PayerRetention')?.confidence).toBe('high')
    expect(rows.find((row) => row.key === 'refundRate')?.confidence).toBe('high')
    expect(rows.find((row) => row.key === 'freeTierD30Delta')?.confidence).toBe('low')
  })

  it('throws when confidence payload includes unsupported tier values', () => {
    expect(() =>
      buildSubscriptionKpiItems({
        trialStartRatePercent: 1,
        trialToPaidPercent: 2,
        month2PayerRetentionPercent: 3,
        refundRatePercent: 4,
        freeTierD30RetentionDeltaPercent: 5,
        confidence: {
          trialStartRate: 'unknown' as 'low',
          trialToPaidRate: 'medium',
          payerLifecycleRates: 'high',
          freeTierD30Delta: 'low',
        },
      }),
    ).toThrow('Invalid retention confidence payload')
  })

  it('throws when confidence payload is missing a required tier', () => {
    expect(() =>
      buildSubscriptionKpiItems({
        trialStartRatePercent: 1,
        trialToPaidPercent: 2,
        month2PayerRetentionPercent: 3,
        refundRatePercent: 4,
        freeTierD30RetentionDeltaPercent: 5,
        confidence: {
          trialStartRate: 'low',
          trialToPaidRate: 'medium',
          payerLifecycleRates: undefined as unknown as 'low',
          freeTierD30Delta: 'high',
        },
      }),
    ).toThrow('Invalid retention confidence payload')
  })
})
