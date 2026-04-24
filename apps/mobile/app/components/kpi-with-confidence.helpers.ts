export type ConfidenceTier = 'low' | 'medium' | 'high'

export const confidenceBadgeStyle = (tier: ConfidenceTier) => {
  if (tier === 'high') {
    return { backgroundColor: '#DCFCE7', color: '#166534' }
  }
  if (tier === 'medium') {
    return { backgroundColor: '#FEF3C7', color: '#92400E' }
  }
  return { backgroundColor: '#FEE2E2', color: '#991B1B' }
}

const confidenceLabel = (tier: ConfidenceTier) => {
  if (tier === 'high') {
    return 'High confidence'
  }
  if (tier === 'medium') {
    return 'Medium confidence'
  }
  return 'Low confidence'
}

export const formatKpiLabel = (label: string, value: number) => `${label}: ${value.toFixed(1)}%`
export const getConfidenceLabel = (tier: ConfidenceTier) => confidenceLabel(tier)
