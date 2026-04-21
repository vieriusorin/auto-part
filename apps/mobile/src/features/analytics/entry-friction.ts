import { buildClientEventPayload } from './client-event-logger'

type SyncAction = {
  id: string
  type: string
  payload: Record<string, unknown>
}

const sessionId = crypto.randomUUID()
const deviceId = `mobile-${sessionId.slice(0, 8)}`
const startedAtByVehicle: Record<string, number> = {}
const firstLogTrackedByVehicle: Record<string, boolean> = {}

const createSyncAction = (eventName: 'maintenance_item.created' | 'maintenance_action.completed' | 'reminder.created') => {
  const payload = buildClientEventPayload({
    eventName,
    occurredAtClient: new Date().toISOString(),
    sessionId,
    deviceId,
    country: 'ro',
    channel: 'direct',
    appVersion: '0.1.0',
    schemaVersion: 1,
  })
  return {
    id: crypto.randomUUID(),
    type: 'analytics.event',
    payload,
  } satisfies SyncAction
}

export const markVehicleTimelineOpened = (vehicleId: string): void => {
  if (!startedAtByVehicle[vehicleId]) {
    startedAtByVehicle[vehicleId] = Date.now()
  }
}

export const getTimeToFirstLogMs = (vehicleId: string): number | null => {
  const startedAt = startedAtByVehicle[vehicleId]
  if (!startedAt) return null
  return Date.now() - startedAt
}

export const markFirstLogCompleted = (vehicleId: string): boolean => {
  if (firstLogTrackedByVehicle[vehicleId]) return false
  firstLogTrackedByVehicle[vehicleId] = true
  return true
}

export const buildMaintenanceCreatedAction = (): SyncAction =>
  createSyncAction('maintenance_item.created')

export const buildMaintenanceCompletedAction = (): SyncAction =>
  createSyncAction('maintenance_action.completed')

export const buildReminderCreatedAction = (): SyncAction =>
  createSyncAction('reminder.created')
