import { useSpendKpis } from '@autocare/api-client/react'
import { useMemo } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

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
    </ScrollView>
  )
}

export default CostsScreen
