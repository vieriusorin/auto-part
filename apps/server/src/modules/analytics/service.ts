import {
  appendRawEvent,
  listDailyRollups,
  listRawEvents,
  replaceDailyRollups,
  replaceUserCohorts,
} from './repository.js'
import { computeRollups } from './rollups.js'
import {
  analyticsEventSchema,
  type NormalizedAnalyticsEvent,
  normalizePlatform,
} from './schemas.js'

type IngestBatchResult = {
  acceptedCount: number
  rejectedCount: number
  persisted: NormalizedAnalyticsEvent[]
}

const normalizeEvent = (rawEvent: unknown): NormalizedAnalyticsEvent | null => {
  const parsed = analyticsEventSchema.safeParse(rawEvent)
  if (!parsed.success) {
    return null
  }

  const event = parsed.data

  try {
    return {
      eventId: event.event_id,
      eventName: event.event_name,
      occurredAtClient: event.occurred_at_client,
      receivedAtServer: new Date(event.occurred_at_client).toISOString(),
      sessionId: event.session_id,
      deviceId: event.device_id,
      platform: normalizePlatform(event.platform),
      country: event.country.trim().toUpperCase(),
      channel: event.channel.trim().toLowerCase(),
      appVersion: event.app_version,
      schemaVersion: event.schema_version,
      userId: event.user_id ?? null,
    }
  } catch {
    return null
  }
}

export const ingestEventBatch = async (rawEvents: unknown[]): Promise<IngestBatchResult> => {
  const persisted: NormalizedAnalyticsEvent[] = []
  let rejectedCount = 0

  for (const rawEvent of rawEvents) {
    const normalized = normalizeEvent(rawEvent)
    if (normalized === null) {
      rejectedCount += 1
      continue
    }

    await appendRawEvent(normalized)
    persisted.push(normalized)
  }

  const allEvents = await listRawEvents()
  const rollups = computeRollups(allEvents)
  await replaceDailyRollups(rollups.dailyRollups)
  await replaceUserCohorts(rollups.userCohorts)

  return {
    acceptedCount: persisted.length,
    rejectedCount,
    persisted,
  }
}

export const getCriticalEventIntegrity = async (): Promise<number> => {
  const allEvents = await listRawEvents()
  if (allEvents.length === 0) {
    return 0
  }

  let validCount = 0
  for (const event of allEvents) {
    const hasAllFields =
      event.eventId.length > 0 &&
      event.eventName.length > 0 &&
      event.sessionId.length > 0 &&
      event.deviceId.length > 0 &&
      event.country.length > 0 &&
      event.channel.length > 0
    if (hasAllFields) {
      validCount += 1
    }
  }

  return (validCount / allEvents.length) * 100
}

type RollupFilters = {
  country?: string
  platform?: 'ios' | 'android'
  channel?: string
}

export const getDashboardRollups = async (filters?: RollupFilters) => listDailyRollups(filters)
