import {
  useMarkSubscriptionMonth2Active,
  useSpendKpis,
  useSubscriptionCancelReasons,
  useSubscriptionRetentionSummary,
} from '@autocare/api-client/react'
import { useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text } from 'react-native'

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
  const retention = useSubscriptionRetentionSummary()
  const cancelReasons = useSubscriptionCancelReasons()
  const markMonth2Active = useMarkSubscriptionMonth2Active()

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
      <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600' }}>Subscription health</Text>
      {retention.isLoading ? <ActivityIndicator /> : null}
      {retention.data ? (
        <>
          <Text>Trial start rate: {retention.data.trialStartRatePercent.toFixed(1)}%</Text>
          <Text>Trial to paid: {retention.data.trialToPaidPercent.toFixed(1)}%</Text>
          <Text>Month-2 payer retention: {retention.data.month2PayerRetentionPercent.toFixed(1)}%</Text>
          <Text>Refund rate: {retention.data.refundRatePercent.toFixed(1)}%</Text>
          <Text>
            Free-tier D30 delta: {retention.data.freeTierD30RetentionDeltaPercent.toFixed(1)}%
          </Text>
          <Pressable
            onPress={() => markMonth2Active.mutate()}
            disabled={markMonth2Active.isPending}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#111827',
              borderRadius: 8,
              opacity: markMonth2Active.isPending ? 0.6 : 1,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Mark month-2 active</Text>
          </Pressable>
          {markMonth2Active.error ? <Text>Unable to mark month-2 active right now.</Text> : null}
        </>
      ) : null}
      <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600' }}>Cancellation reasons</Text>
      {cancelReasons.data?.items?.length ? (
        cancelReasons.data.items.map((item) => (
          <Text key={item.reason}>
            {item.reason}: {item.count}
          </Text>
        ))
      ) : (
        <Text>No cancellation reasons recorded yet.</Text>
      )}
    </ScrollView>
  )
}

export default InsightsScreen
