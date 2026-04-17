import { z } from 'zod'

const platformSchema = z.enum(['ios', 'android'])

export const analyticsEventSchema = z.object({
  event_id: z.string().min(1),
  event_name: z.string().min(1),
  occurred_at_client: z.string().datetime(),
  session_id: z.string().min(1),
  device_id: z.string().min(1),
  platform: z.string().min(1),
  country: z.string().min(2),
  channel: z.string().min(1),
  app_version: z.string().min(1),
  schema_version: z.number().int().positive(),
  user_id: z.string().optional(),
})

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>

export type NormalizedAnalyticsEvent = {
  eventId: string
  eventName: string
  occurredAtClient: string
  receivedAtServer: string
  sessionId: string
  deviceId: string
  platform: 'ios' | 'android'
  country: string
  channel: string
  appVersion: string
  schemaVersion: number
  userId: string | null
}

export const normalizePlatform = (platform: string): 'ios' | 'android' => {
  const value = platform.trim().toLowerCase()
  return platformSchema.parse(value)
}
