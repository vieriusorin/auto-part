import {
  useCancelSubscription,
  useSpendKpis,
  useStartSubscriptionTrial,
  useSubscriptionOffers,
  useSubscriptionStatus,
} from '@autocare/api-client/react'
import { useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'

const CostsScreen = () => {
  const filters = useMemo(() => {
    const to = new Date()
    const from = new Date(to)
    from.setUTCDate(from.getUTCDate() - 30)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: 'week' as const,
    }
  }, [])
  const spend = useSpendKpis(filters)
  const subscription = useSubscriptionStatus()
  const offers = useSubscriptionOffers()
  const startTrial = useStartSubscriptionTrial()
  const cancelSubscription = useCancelSubscription()

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Cost Dashboard</Text>
      {spend.isLoading ? <ActivityIndicator /> : null}
      {spend.error ? <Text>Failed to load spend KPIs.</Text> : null}
      {spend.data ? (
        <View style={{ gap: 8 }}>
          <Text>Total spend: {spend.data.totals.totalSpend}</Text>
          <Text>Maintenance: {spend.data.totals.maintenanceSpend}</Text>
          <Text>Fuel: {spend.data.totals.fuelSpend}</Text>
          <Text>Top categories:</Text>
          {spend.data.byCategory.slice(0, 3).map((item) => (
            <Text key={item.category}>
              - {item.category}: {item.spend}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={{ marginTop: 16, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Subscription</Text>
        {subscription.isLoading ? <ActivityIndicator /> : null}
        {subscription.data ? (
          <>
            <Text>Current plan: {subscription.data.effectivePlan}</Text>
            <Text>
              Paywall eligibility: {subscription.data.paywallEligible ? 'eligible' : 'not eligible'}
            </Text>
            <Text style={{ color: '#555' }}>{subscription.data.paywallReason}</Text>
          </>
        ) : null}
        {offers.data?.items?.map((offer) => (
          <View
            key={offer.id}
            style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 10, gap: 4 }}
          >
            <Text style={{ fontWeight: '600' }}>
              {offer.billingCycle} {offer.plan}
            </Text>
            <Text>
              Price: {offer.priceCents / 100} | Trial days: {offer.trialDays}
            </Text>
            <Pressable
              onPress={() => startTrial.mutate({ billingCycle: offer.billingCycle, variant: offers.data?.variant })}
              disabled={startTrial.isPending}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#111827',
                borderRadius: 8,
                opacity: startTrial.isPending ? 0.6 : 1,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Start trial</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() =>
            cancelSubscription.mutate({
              reason: 'too_expensive',
              feedback: 'Need more fleet features before upgrading.',
            })
          }
          disabled={cancelSubscription.isPending}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#b91c1c',
            borderRadius: 8,
            opacity: cancelSubscription.isPending ? 0.6 : 1,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel subscription</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

export default CostsScreen
