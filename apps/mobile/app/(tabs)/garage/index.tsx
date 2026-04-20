import { useAuth, useCreateVehicle, useVehicles } from '@autocare/api-client/react'
import { Link } from 'expo-router'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native'

const GarageScreen = () => {
  const { isAuthenticated } = useAuth()
  const vehicles = useVehicles({ enabled: isAuthenticated })
  const createVehicle = useCreateVehicle()

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>Garage</Text>
        <Text>Sign in to see your vehicles and maintenance timeline.</Text>
        <Link href="/login">
          <Text style={{ color: '#2563eb', marginTop: 8 }}>Go to login</Text>
        </Link>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Garage</Text>
      <Text style={{ color: '#555' }}>Your vehicles and quick access to timelines.</Text>
      <Pressable
        onPress={() =>
          createVehicle.mutate({
            make: 'Skoda',
            model: 'Octavia',
            year: 2020,
            vin: `VIN${Date.now().toString(36).toUpperCase().slice(-10)}`,
          })
        }
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#111827',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 8,
          opacity: createVehicle.isPending ? 0.6 : 1,
        }}
        disabled={createVehicle.isPending}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Add sample vehicle</Text>
      </Pressable>
      {vehicles.isPending ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : vehicles.isError ? (
        <Text style={{ color: '#b91c1c', marginTop: 8 }}>Could not load vehicles.</Text>
      ) : (
        <FlatList
          data={vehicles.data?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8, paddingTop: 8 }}
          renderItem={({ item }) => (
            <Link href={`/vehicle/${item.id}`} asChild>
              <Pressable
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e5e5',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                  {item.make} {item.model}
                </Text>
                <Text style={{ color: '#555', marginTop: 4 }}>
                  {item.year} · {item.currentOdometer} km
                </Text>
              </Pressable>
            </Link>
          )}
          ListEmptyComponent={<Text style={{ color: '#666' }}>No vehicles yet.</Text>}
        />
      )}
    </View>
  )
}

export default GarageScreen
