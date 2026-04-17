import type { PersistedCohortRow, PersistedRollupRow } from './repository.js'

type RollupInputEvent = {
  userId: string | null
  eventName: string
  occurredAtClient?: string
  receivedAtServer: string
  country: string
  platform: 'ios' | 'android'
  channel: string
}

type RollupResult = {
  activationCount: number
  dailyRollups: PersistedRollupRow[]
  userCohorts: PersistedCohortRow[]
}

const toDateKey = (isoTimestamp: string): string =>
  new Date(isoTimestamp).toISOString().slice(0, 10)

const addDays = (dateKey: string, days: number): string => {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const getEventTimestamp = (event: RollupInputEvent): string =>
  event.occurredAtClient ?? event.receivedAtServer

const buildSegmentKey = (country: string, platform: 'ios' | 'android', channel: string): string =>
  `${country}::${platform}::${channel}`

const parseSegmentKey = (
  key: string,
): { country: string; platform: 'ios' | 'android'; channel: string } => {
  const [country, platform, channel] = key.split('::')
  return {
    country: country ?? 'UNKNOWN',
    platform: (platform as 'ios' | 'android') ?? 'ios',
    channel: channel ?? 'unknown',
  }
}

export const computeRollups = (events: RollupInputEvent[]): RollupResult => {
  const eventsByUser = new Map<string, RollupInputEvent[]>()
  const userSegmentByUser = new Map<
    string,
    { country: string; platform: 'ios' | 'android'; channel: string }
  >()
  const dateSegmentUsers = new Map<string, Set<string>>()
  const dateSegmentMaintenanceCount = new Map<string, number>()
  const allDates = new Set<string>()

  for (const event of events) {
    if (event.userId === null) {
      continue
    }

    const dateKey = toDateKey(getEventTimestamp(event))
    const segmentKey = buildSegmentKey(event.country, event.platform, event.channel)
    const dateSegmentKey = `${dateKey}::${segmentKey}`

    allDates.add(dateKey)
    const userEvents = eventsByUser.get(event.userId) ?? []
    userEvents.push(event)
    eventsByUser.set(event.userId, userEvents)
    userSegmentByUser.set(event.userId, {
      country: event.country,
      platform: event.platform,
      channel: event.channel,
    })

    const users = dateSegmentUsers.get(dateSegmentKey) ?? new Set<string>()
    users.add(event.userId)
    dateSegmentUsers.set(dateSegmentKey, users)

    if (event.eventName === 'maintenance_action.completed') {
      const current = dateSegmentMaintenanceCount.get(dateSegmentKey) ?? 0
      dateSegmentMaintenanceCount.set(dateSegmentKey, current + 1)
    }
  }

  let activationCount = 0
  const activationByDateSegment = new Map<string, number>()
  const d1ByDateSegment = new Map<string, number>()
  const d7ByDateSegment = new Map<string, number>()
  const d30ByDateSegment = new Map<string, number>()
  const userCohorts: PersistedCohortRow[] = []

  for (const [userId, userEvents] of eventsByUser) {
    userEvents.sort(
      (a, b) => new Date(getEventTimestamp(a)).getTime() - new Date(getEventTimestamp(b)).getTime(),
    )
    const firstEvent = userEvents[0]
    if (firstEvent === undefined) {
      continue
    }

    const signupDate = toDateKey(getEventTimestamp(firstEvent))
    const segmentKey = buildSegmentKey(firstEvent.country, firstEvent.platform, firstEvent.channel)
    const cohortDateSegment = `${signupDate}::${segmentKey}`
    const userEventDates = new Set(userEvents.map((event) => toDateKey(getEventTimestamp(event))))

    userCohorts.push({
      userId,
      signupDate,
      country: firstEvent.country,
      platform: firstEvent.platform,
      channel: firstEvent.channel,
    })

    const names = new Set(userEvents.map((event) => event.eventName))
    const hasRequiredEvents =
      names.has('vehicle.created') &&
      names.has('maintenance_item.created') &&
      names.has('reminder.created')
    if (hasRequiredEvents) {
      const timestamps = userEvents
        .filter(
          (event) =>
            event.eventName === 'vehicle.created' ||
            event.eventName === 'maintenance_item.created' ||
            event.eventName === 'reminder.created',
        )
        .map((event) => new Date(getEventTimestamp(event)).getTime())
      const min = Math.min(...timestamps)
      const max = Math.max(...timestamps)
      const within24Hours = max - min <= 24 * 60 * 60 * 1000
      if (within24Hours) {
        activationCount += 1
        const current = activationByDateSegment.get(cohortDateSegment) ?? 0
        activationByDateSegment.set(cohortDateSegment, current + 1)
      }
    }

    if (userEventDates.has(addDays(signupDate, 1))) {
      const current = d1ByDateSegment.get(cohortDateSegment) ?? 0
      d1ByDateSegment.set(cohortDateSegment, current + 1)
    }
    if (userEventDates.has(addDays(signupDate, 7))) {
      const current = d7ByDateSegment.get(cohortDateSegment) ?? 0
      d7ByDateSegment.set(cohortDateSegment, current + 1)
    }
    if (userEventDates.has(addDays(signupDate, 30))) {
      const current = d30ByDateSegment.get(cohortDateSegment) ?? 0
      d30ByDateSegment.set(cohortDateSegment, current + 1)
    }
  }

  const sortedDates = Array.from(allDates).sort()
  const knownSegments = new Set<string>(
    Array.from(userSegmentByUser.values()).map((segment) =>
      buildSegmentKey(segment.country, segment.platform, segment.channel),
    ),
  )
  const dailyRollups: PersistedRollupRow[] = []

  for (const date of sortedDates) {
    for (const segmentKey of knownSegments) {
      const dateSegmentKey = `${date}::${segmentKey}`
      const { country, platform, channel } = parseSegmentKey(segmentKey)

      const wauUsers = new Set<string>()
      const mauUsers = new Set<string>()
      for (let index = 0; index < 30; index += 1) {
        const backDate = addDays(date, -index)
        const users = dateSegmentUsers.get(`${backDate}::${segmentKey}`) ?? new Set<string>()
        if (index < 7) {
          users.forEach((userId) => {
            wauUsers.add(userId)
          })
        }
        users.forEach((userId) => {
          mauUsers.add(userId)
        })
      }

      dailyRollups.push({
        date,
        country,
        platform,
        channel,
        activationCount: activationByDateSegment.get(dateSegmentKey) ?? 0,
        d1Retained: d1ByDateSegment.get(dateSegmentKey) ?? 0,
        d7Retained: d7ByDateSegment.get(dateSegmentKey) ?? 0,
        d30Retained: d30ByDateSegment.get(dateSegmentKey) ?? 0,
        wau: wauUsers.size,
        mau: mauUsers.size,
        maintenanceActionsCompleted: dateSegmentMaintenanceCount.get(dateSegmentKey) ?? 0,
      })
    }
  }

  return { activationCount, dailyRollups, userCohorts }
}
