import { useSpendKpis } from '@autocare/api-client/react'
import { useMemo } from 'react'
import { ActivityIndicator, ScrollView, Text } from 'react-native'

const InsightsScreen = () => {
  const filters = useMemo(() => {
    const to = new Date()
    const from = new Date(to)
    from.setUTCDate(from.getUTCDate() - 60)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: 'month' as const,
    }
  }, [])
  const spend = useSpendKpis(filters)

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>AI Insights</Text>
      {spend.isLoading ? <ActivityIndicator /> : null}
      {spend.error ? <Text>Failed to load insights.</Text> : null}
      {spend.data ? (
        <>
          <Text>Trend delta: {spend.data.advanced.trendDeltaPercent}%</Text>
          <Text>Forecast next period: {spend.data.advanced.forecastNextPeriodSpend}</Text>
          <Text>Anomalies: {spend.data.advanced.anomalies.length}</Text>
        </>
      ) : null}
    </ScrollView>
  )
}

export default InsightsScreen
