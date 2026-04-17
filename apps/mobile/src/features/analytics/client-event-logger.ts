import { Platform } from 'react-native'
import type { Phase0EventName } from './event-constants'

type ClientEventInput = {
  eventName: Phase0EventName
  occurredAtClient: string
  sessionId: string
  deviceId: string
  country: string
  channel: string
  appVersion: string
  schemaVersion: number
  userId?: string
}

export const buildClientEventPayload = (input: ClientEventInput): Record<string, unknown> => {
  return {
    event_id: crypto.randomUUID(),
    event_name: input.eventName,
    occurred_at_client: input.occurredAtClient,
    user_id: input.userId ?? null,
    session_id: input.sessionId,
    device_id: input.deviceId,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    country: input.country,
    channel: input.channel,
    app_version: input.appVersion,
    schema_version: input.schemaVersion,
  }
}
