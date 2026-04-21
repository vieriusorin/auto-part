import {
  useCreateMaintenanceLog,
  useCreateVehicleDocument,
  useCreateVehicleReminder,
  useAuth,
  useSyncActions,
  useUpsertVehicleMember,
  useVehicle,
  useVehicleActionFeed,
  useVehicleDocuments,
  useVehicleForecast,
  useVehicleMaintenanceLogs,
  useVehicleMembers,
  useVehicleReminders,
} from '@autocare/api-client/react'
import { Link, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { getTimelineEmptyMessage } from '../../../src/screen-messages'
import {
  buildMaintenanceCompletedAction,
  buildMaintenanceCreatedAction,
  buildReminderCreatedAction,
  getTimeToFirstLogMs,
  markFirstLogCompleted,
  markVehicleTimelineOpened,
} from '../../../src/features/analytics/entry-friction'

const VehicleTimelineScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const vehicleId = typeof id === 'string' ? id : id?.[0]
  const vehicle = useVehicle(vehicleId)
  const { user } = useAuth()
  const logs = useVehicleMaintenanceLogs(vehicleId)
  const reminders = useVehicleReminders(vehicleId)
  const actionFeed = useVehicleActionFeed(vehicleId)
  const forecast = useVehicleForecast(vehicleId)
  const documents = useVehicleDocuments(vehicleId)
  const members = useVehicleMembers(vehicleId)
  const createReminder = useCreateVehicleReminder(vehicleId ?? '')
  const createMaintenanceLog = useCreateMaintenanceLog(vehicleId ?? '')
  const createDocument = useCreateVehicleDocument(vehicleId ?? '')
  const upsertVehicleMember = useUpsertVehicleMember(vehicleId ?? '')
  const syncActions = useSyncActions()

  useEffect(() => {
    if (!vehicleId) return
    markVehicleTimelineOpened(vehicleId)
  }, [vehicleId])

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

  if (
    vehicle.isPending ||
    logs.isPending ||
    reminders.isPending ||
    actionFeed.isPending ||
    forecast.isPending ||
    documents.isPending ||
    members.isPending
  ) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (
    vehicle.isError ||
    logs.isError ||
    reminders.isError ||
    actionFeed.isError ||
    forecast.isError ||
    documents.isError ||
    members.isError
  ) {
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
  const reminderItems = reminders.data?.items ?? []
  const actionItems = actionFeed.data?.items ?? []
  const forecastItems = forecast.data?.items ?? []
  const documentItems = documents.data?.items ?? []
  const memberItems = members.data?.items ?? []

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
      <Pressable
        onPress={() =>
          createMaintenanceLog.mutate(
            {
              odometer: v?.currentOdometer ?? 10000,
              category: 'General service',
              description: 'Added from timeline quick action',
              totalCost: 250,
            },
            {
              onSuccess: () => {
                const actions = [buildMaintenanceCreatedAction()]
                if (vehicleId && markFirstLogCompleted(vehicleId)) {
                  const timeToFirstLogMs = getTimeToFirstLogMs(vehicleId)
                  const maintenanceCompletedAction = buildMaintenanceCompletedAction()
                  actions.push({
                    ...maintenanceCompletedAction,
                    payload: {
                      ...maintenanceCompletedAction.payload,
                      time_to_first_log_ms: timeToFirstLogMs,
                    },
                  })
                }
                syncActions.mutate({ actions })
              },
            },
          )
        }
        disabled={createMaintenanceLog.isPending}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#111827',
          borderRadius: 8,
          opacity: createMaintenanceLog.isPending ? 0.6 : 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Add maintenance</Text>
      </Pressable>
      {items.length === 0 ? (
        <Text style={{ color: '#666' }}>{getTimelineEmptyMessage()}</Text>
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
      <View style={{ marginTop: 8, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Reminders</Text>
        <Pressable
          onPress={() => {
            if (!vehicleId) return
            createReminder.mutate(
              {
                title: 'Oil change',
                frequencyType: 'days',
                intervalValue: 180,
                dueAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                onSuccess: () => {
                  syncActions.mutate({ actions: [buildReminderCreatedAction()] })
                },
              },
            )
          }}
          disabled={createReminder.isPending || !vehicleId}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#111827',
            borderRadius: 8,
            opacity: createReminder.isPending ? 0.6 : 1,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Add reminder</Text>
        </Pressable>
        {reminderItems.length === 0 ? (
          <Text style={{ color: '#666' }}>No reminders yet.</Text>
        ) : (
          reminderItems.slice(0, 3).map((reminder) => (
            <View
              key={reminder.id}
              style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 12, gap: 4 }}
            >
              <Text style={{ fontWeight: '600' }}>{reminder.title}</Text>
              <Text style={{ color: '#555' }}>
                {reminder.frequencyType} every {reminder.intervalValue}
              </Text>
              <Text style={{ color: '#555' }}>status: {reminder.status}</Text>
            </View>
          ))
        )}
      </View>
      <View style={{ marginTop: 8, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Evidence</Text>
        <Pressable
          onPress={() => {
            if (!vehicleId) return
            createDocument.mutate({
              type: 'photo',
              title: 'Engine bay photo',
              storageKey: `vehicles/${vehicleId}/docs/${Date.now().toString(36)}.jpg`,
              mimeType: 'image/jpeg',
              sizeBytes: 145_000,
            })
          }}
          disabled={createDocument.isPending}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#111827',
            borderRadius: 8,
            opacity: createDocument.isPending ? 0.6 : 1,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Attach evidence</Text>
        </Pressable>
        {documentItems.length === 0 ? (
          <Text style={{ color: '#666' }}>No documents yet.</Text>
        ) : (
          documentItems.slice(0, 3).map((document) => (
            <View
              key={document.id}
              style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 12, gap: 4 }}
            >
              <Text style={{ fontWeight: '600' }}>{document.title}</Text>
              <Text style={{ color: '#555' }}>
                {document.type} - {document.mimeType}
              </Text>
            </View>
          ))
        )}
      </View>
      <View style={{ marginTop: 8, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Members</Text>
        <Pressable
          onPress={() => {
            if (!user?.id) return
            upsertVehicleMember.mutate({
              userId: user.id,
              role: 'driver',
            })
          }}
          disabled={upsertVehicleMember.isPending || !user?.id}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#111827',
            borderRadius: 8,
            opacity: upsertVehicleMember.isPending || !user?.id ? 0.6 : 1,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Assign me as driver</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (memberItems.length === 0) return
            upsertVehicleMember.mutate({
              userId: memberItems[0].userId,
              role: memberItems[0].role === 'driver' ? 'manager' : 'driver',
            })
          }}
          disabled={upsertVehicleMember.isPending || memberItems.length === 0}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#111827',
            borderRadius: 8,
            opacity: upsertVehicleMember.isPending || memberItems.length === 0 ? 0.6 : 1,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Toggle first member role</Text>
        </Pressable>
        {memberItems.length === 0 ? (
          <Text style={{ color: '#666' }}>No members assigned yet.</Text>
        ) : (
          memberItems.slice(0, 3).map((member) => (
            <View
              key={member.id}
              style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 12, gap: 4 }}
            >
              <Text style={{ fontWeight: '600' }}>{member.userId}</Text>
              <Text style={{ color: '#555' }}>{member.role}</Text>
            </View>
          ))
        )}
      </View>
      <View style={{ marginTop: 8, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Action feed</Text>
        {actionItems.length === 0 ? (
          <Text style={{ color: '#666' }}>No actions yet.</Text>
        ) : (
          actionItems.slice(0, 3).map((action) => (
            <View
              key={action.id}
              style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 12, gap: 4 }}
            >
              <Text style={{ fontWeight: '600' }}>{action.title}</Text>
              <Text style={{ color: '#555' }}>
                {action.urgency} - {action.rationale}
              </Text>
            </View>
          ))
        )}
      </View>
      <View style={{ marginTop: 8, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>6-month forecast</Text>
        <Text style={{ color: '#555' }}>
          Expected total: {forecast.data?.totalExpectedCost ?? 0}
        </Text>
        {forecastItems.length === 0 ? (
          <Text style={{ color: '#666' }}>No forecast items yet.</Text>
        ) : (
          forecastItems.slice(0, 3).map((item) => (
            <View
              key={`${item.category}-${item.dueAt ?? 'none'}`}
              style={{ borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 12, gap: 4 }}
            >
              <Text style={{ fontWeight: '600' }}>{item.category}</Text>
              <Text style={{ color: '#555' }}>{item.expectedCost}</Text>
              <Text style={{ color: '#555' }}>{item.rationale}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

export default VehicleTimelineScreen
