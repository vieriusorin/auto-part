import { useVehicle, useVehicleMaintenanceLogs } from '@autocare/api-client/react'
import { Link, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

const VehicleTimelineScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const vehicleId = typeof id === 'string' ? id : id?.[0]
  const vehicle = useVehicle(vehicleId)
  const logs = useVehicleMaintenanceLogs(vehicleId)

  if (!vehicleId) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Missing vehicle id.</Text>
        <Link href="/(tabs)/garage">
          <Text style={{ marginTop: 8 }}>Back to garage</Text>
        </Link>
      </View>
    )
  }

  if (vehicle.isPending || logs.isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (vehicle.isError || logs.isError) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Could not load vehicle or maintenance history.</Text>
        <Link href="/(tabs)/garage">
          <Text style={{ marginTop: 8 }}>Back to garage</Text>
        </Link>
      </View>
    )
  }

  const v = vehicle.data
  const items = logs.data?.items ?? []

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Link href="/(tabs)/garage">
        <Text style={{ color: '#2563eb' }}>← Garage</Text>
      </Link>
      {v ? (
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '600' }}>
            {v.make} {v.model}
          </Text>
          <Text style={{ color: '#444' }}>
            {v.year} · {v.vin}
          </Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 8 }}>Maintenance</Text>
      {items.length === 0 ? (
        <Text style={{ color: '#666' }}>No entries yet.</Text>
      ) : (
        items.map((entry) => (
          <View
            key={entry.id}
            style={{
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 8,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontWeight: '600' }}>{entry.category}</Text>
            <Text style={{ color: '#555', fontSize: 13 }}>
              {entry.date} · {entry.odometer} km
            </Text>
            {entry.description ? (
              <Text style={{ color: '#444' }}>{entry.description}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  )
}

export default VehicleTimelineScreen
