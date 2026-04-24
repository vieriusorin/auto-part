import { Text } from 'react-native'
import {
  confidenceBadgeStyle,
  formatKpiLabel,
  getConfidenceLabel,
  type ConfidenceTier,
} from './kpi-with-confidence.helpers'

type KpiWithConfidenceProps = {
  label: string
  value: number
  confidence: ConfidenceTier
}

export const KpiWithConfidence = ({ label, value, confidence }: KpiWithConfidenceProps) => {
  const badgeStyle = confidenceBadgeStyle(confidence)
  return (
    <>
      <Text>{formatKpiLabel(label, value)}</Text>
      <Text
        style={{
          alignSelf: 'flex-start',
          backgroundColor: badgeStyle.backgroundColor,
          borderRadius: 999,
          color: badgeStyle.color,
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
      >
        {getConfidenceLabel(confidence)}
      </Text>
    </>
  )
}
