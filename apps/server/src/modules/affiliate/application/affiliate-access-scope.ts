import { createUserAccessScopeFromAuthUser } from '../../auth/application/access-scope.js'
import type { listRawEvents } from '../../analytics/repository.js'

type AuthUserLike = {
  id: string
  role: 'user' | 'admin'
  organizationId: string | null
}

export type AffiliateResourceScope = {
  actorId: string
  organizationId: string | null
  isElevated: boolean
}

type EventRecord = Awaited<ReturnType<typeof listRawEvents>>[number]

export const resolveAffiliateResourceScope = (user: AuthUserLike): AffiliateResourceScope => {
  const scope = createUserAccessScopeFromAuthUser(user)
  return {
    actorId: scope.actorId,
    organizationId: scope.organizationId,
    isElevated: scope.isElevated,
  }
}

export const affiliateEventPolicyConditions = (
  scope: AffiliateResourceScope,
): Array<Record<string, unknown>> => {
  if (scope.isElevated) {
    return [{}]
  }
  return [{ userId: scope.actorId }]
}

export const filterAffiliateEventsByPolicy = (
  events: EventRecord[],
  policyConditions: readonly Record<string, unknown>[],
): EventRecord[] => {
  if (policyConditions.some((conditions) => Object.keys(conditions).length === 0)) {
    return events
  }
  return events.filter((event) =>
    policyConditions.some((conditions) =>
      Object.entries(conditions).every(([key, value]) => {
        const eventValue = event[key as keyof EventRecord]
        return eventValue === value
      }),
    ),
  )
}

