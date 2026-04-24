import { createUserAccessScopeFromAuthUser } from '../../auth/application/access-scope.js'

type AuthUserLike = {
  id: string
  role: 'user' | 'admin'
  organizationId: string | null
}

export type AnalyticsResourceScope = {
  actorId: string | null
  organizationId: string | null
  isElevated: boolean
}

export type AnalyticsDashboardFilters = {
  country?: string
  platform?: 'ios' | 'android'
  channel?: string
}

export const resolveAnalyticsResourceScope = (
  user?: AuthUserLike | null,
): AnalyticsResourceScope => {
  if (!user) {
    return {
      actorId: null,
      organizationId: null,
      isElevated: false,
    }
  }
  const scope = createUserAccessScopeFromAuthUser(user)
  return {
    actorId: scope.actorId,
    organizationId: scope.organizationId,
    isElevated: scope.isElevated,
  }
}

export const resolveAnalyticsDashboardFilters = ({
  scope,
  requested,
}: {
  scope: AnalyticsResourceScope
  requested: AnalyticsDashboardFilters
}): AnalyticsDashboardFilters => {
  // Current analytics rollups are segmented by country/platform/channel only.
  // Keep requested visibility filters centralized here so future ABAC attributes
  // can be introduced without changing route/controller logic.
  const country = requested.country?.trim().toUpperCase()
  const channel = requested.channel?.trim().toLowerCase()
  const normalized = {
    country: country && country.length > 0 ? country : undefined,
    platform: requested.platform,
    channel: channel && channel.length > 0 ? channel : undefined,
  }
  if (scope.isElevated) {
    return normalized
  }
  return normalized
}

