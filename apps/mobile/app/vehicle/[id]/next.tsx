import { useUpdateVehicleReminder, useVehicleActionFeed } from '@autocare/api-client/react'
import { useLocalSearchParams } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

const NextActionsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const vehicleId = typeof id === 'string' ? id : id?.[0]
  const feed = useVehicleActionFeed(vehicleId)
  const updateReminder = useUpdateVehicleReminder(vehicleId ?? '')

  if (!vehicleId) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Missing vehicle id.</Text>
      </View>
    )
  }

  const items = feed.data?.items ?? []
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>What should I do next?</Text>
      {items.length === 0 ? <Text>No pending actions.</Text> : null}
      {items.map((item) => (
        <View
          key={item.id}
          style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 10, gap: 8 }}
        >
          <Text style={{ fontWeight: '600' }}>{item.title}</Text>
          <Text style={{ color: '#555' }}>
            {item.urgency} - {item.rationale}
          </Text>
          {item.sourceType === 'reminder' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() =>
                  updateReminder.mutate({ reminderId: item.sourceId, body: { status: 'due_now' } })
                }
              >
                <Text style={{ color: '#2563eb' }}>Do now</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  updateReminder.mutate({ reminderId: item.sourceId, body: { status: 'upcoming' } })
                }
              >
                <Text style={{ color: '#2563eb' }}>Plan</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  updateReminder.mutate({
                    reminderId: item.sourceId,
                    body: { status: 'deferred', deferredUntil: new Date(Date.now() + 7 * 86400000).toISOString() },
                  })
                }
              >
                <Text style={{ color: '#2563eb' }}>Defer</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

export default NextActionsScreen
