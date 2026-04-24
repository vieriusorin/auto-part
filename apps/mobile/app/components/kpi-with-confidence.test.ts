import { describe, expect, it } from 'vitest'
import { confidenceBadgeStyle, formatKpiLabel, getConfidenceLabel } from './kpi-with-confidence.helpers'

describe('kpi-with-confidence helpers', () => {
  it('formats KPI label with one decimal percentage', () => {
    expect(formatKpiLabel('Trial start rate', 66.666)).toBe('Trial start rate: 66.7%')
  })

  it('maps confidence tiers to expected badge text', () => {
    expect(getConfidenceLabel('low')).toBe('Low confidence')
    expect(getConfidenceLabel('medium')).toBe('Medium confidence')
    expect(getConfidenceLabel('high')).toBe('High confidence')
  })

  it('maps confidence tiers to deterministic badge colors', () => {
    expect(confidenceBadgeStyle('low')).toEqual({
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
    })
    expect(confidenceBadgeStyle('medium')).toEqual({
      backgroundColor: '#FEF3C7',
      color: '#92400E',
    })
    expect(confidenceBadgeStyle('high')).toEqual({
      backgroundColor: '#DCFCE7',
      color: '#166534',
    })
  })
})
