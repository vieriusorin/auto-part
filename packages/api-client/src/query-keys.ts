export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  system: {
    all: ['system'] as const,
    weeklySummary: (userId: string) => ['system', 'weekly-summary', userId] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    list: () => [...queryKeys.vehicles.all, 'list'] as const,
    detail: (vehicleId: string) => [...queryKeys.vehicles.all, vehicleId] as const,
    maintenance: (vehicleId: string) => [...queryKeys.vehicles.all, vehicleId, 'maintenance'] as const,
    reminders: (vehicleId: string) => [...queryKeys.vehicles.all, vehicleId, 'reminders'] as const,
    actionFeed: (vehicleId: string) => [...queryKeys.vehicles.all, vehicleId, 'action-feed'] as const,
    forecast: (vehicleId: string) => [...queryKeys.vehicles.all, vehicleId, 'forecast'] as const,
    fuel: (vehicleId: string) => [...queryKeys.vehicles.all, vehicleId, 'fuel'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    dashboard: (
      filters: { country?: string; platform?: 'ios' | 'android'; channel?: string } = {},
    ) => ['analytics', 'dashboard', filters] as const,
  },
  kpis: {
    all: ['kpis'] as const,
    spend: (filters: {
      from: string
      to: string
      granularity?: 'day' | 'week' | 'month'
      vehicleIds?: string[] | string
      categories?: string[] | string
    }) => ['kpis', 'spend', filters] as const,
  },
  audit: {
    all: ['audit'] as const,
    logs: () => ['audit', 'logs'] as const,
  },
  banners: {
    all: ['banners'] as const,
    list: () => ['banners', 'list'] as const,
  },
  subscription: {
    all: ['subscription'] as const,
    status: () => ['subscription', 'status'] as const,
    offers: () => ['subscription', 'offers'] as const,
    cancelReasons: () => ['subscription', 'cancel-reasons'] as const,
    retentionSummary: () => ['subscription', 'retention-summary'] as const,
  },
  affiliate: {
    all: ['affiliate'] as const,
    offers: (intentSurface?: 'maintenance_due' | 'service_report_ready' | 'cost_anomaly_detected') =>
      ['affiliate', 'offers', intentSurface ?? 'all'] as const,
  },
  utility: {
    all: ['utility'] as const,
    washSuggestion: () => ['utility', 'wash-suggestion'] as const,
    lezCheck: () => ['utility', 'lez-check'] as const,
    tireRecommendations: () => ['utility', 'tires'] as const,
  },
} as const

export type QueryKeys = typeof queryKeys
