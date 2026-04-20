import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../client.js'
import { queryKeys } from '../query-keys.js'
import type { operations } from '../types.gen.js'
import { useApiClient } from './context.js'

type SuccessEnvelope<T> = {
  success: true
  data: T
}

type SuccessBody<Op> = Op extends {
  responses: { 200: { content: { 'application/json': infer Body } } }
}
  ? Body
  : Op extends {
        responses: { 201: { content: { 'application/json': infer Body } } }
      }
    ? Body
    : never

type SuccessData<Op> = SuccessBody<Op> extends SuccessEnvelope<infer D> ? D : never

const unwrap = <T>(payload: unknown): T => {
  if (
    payload === null ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    (payload as { success: unknown }).success !== true
  ) {
    throw new ApiError({ status: 500, message: 'Unexpected API response envelope' })
  }
  return (payload as SuccessEnvelope<T>).data
}

type AnalyticsFilters = {
  country?: string
  platform?: 'ios' | 'android'
  channel?: string
}

type WeeklySummary = SuccessData<operations['getWeeklySummary']>
type WashSuggestion = SuccessData<operations['getWashSuggestion']>
type LezCheck = SuccessData<operations['checkLezRule']>
type TireRecommendations = SuccessData<operations['listTireRecommendations']>
type AuditLogs = SuccessData<operations['listAuditLogs']>
type Dashboard = SuccessData<operations['getAnalyticsDashboard']>
type FairPriceResult = SuccessData<operations['estimateFairPrice']>
type MaintenanceCreated = SuccessData<operations['createMaintenanceLog']>
type SyncResult = SuccessData<operations['syncClientActions']>
type VehicleList = SuccessData<operations['listVehicles']>
type VehicleDetail = SuccessData<operations['getVehicle']>
type VehicleCreated = SuccessData<operations['createVehicle']>
type MaintenanceList = SuccessData<operations['listMaintenanceLogs']>
type FuelList = SuccessData<operations['listFuelEntries']>
type BannerList = SuccessData<operations['listBanners']>
type BannerDismissResult = SuccessData<operations['dismissBanner']>
type SpendKpis = SuccessData<operations['getSpendKpis']>

export const useVehicles = (
  options?: Omit<UseQueryOptions<VehicleList>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<VehicleList>({
    queryKey: queryKeys.vehicles.list(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles', {})
      if (error) throw error
      return unwrap<VehicleList>(data)
    },
    ...options,
  })
}

export const useVehicle = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<VehicleDetail>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<VehicleDetail>({
    ...options,
    queryKey: queryKeys.vehicles.detail(vehicleId ?? ''),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<VehicleDetail>(data)
    },
    enabled: Boolean(vehicleId) && (options?.enabled ?? true),
  })
}

export const useVehicleMaintenanceLogs = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<MaintenanceList>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<MaintenanceList>({
    ...options,
    queryKey: queryKeys.vehicles.maintenance(vehicleId ?? ''),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}/maintenance', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<MaintenanceList>(data)
    },
    enabled: Boolean(vehicleId) && (options?.enabled ?? true),
  })
}

type SpendKpiFilters = {
  from: string
  to: string
  granularity?: 'day' | 'week' | 'month'
  vehicleIds?: string[] | string
  categories?: string[] | string
}

export const useSpendKpis = (
  filters: SpendKpiFilters,
  options?: Omit<UseQueryOptions<SpendKpis>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<SpendKpis>({
    queryKey: queryKeys.kpis.spend(filters),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/kpis/spend', {
        params: { query: filters },
      })
      if (error) throw error
      return unwrap<SpendKpis>(data)
    },
    ...options,
  })
}

export const useVehicleFuelEntries = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<FuelList>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<FuelList>({
    ...options,
    queryKey: queryKeys.vehicles.fuel(vehicleId ?? ''),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}/fuel', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<FuelList>(data)
    },
    enabled: Boolean(vehicleId) && (options?.enabled ?? true),
  })
}

type CreateVehicleBody = {
  make: string
  model: string
  year: number
  vin: string
  plate?: string
}

export const useCreateVehicle = (
  options?: UseMutationOptions<VehicleCreated, unknown, CreateVehicleBody>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<VehicleCreated, unknown, CreateVehicleBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/vehicles', { body })
      if (error) throw error
      return unwrap<VehicleCreated>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.list() })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

export const useWeeklySummary = (
  userId: string,
  options?: Omit<UseQueryOptions<WeeklySummary>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<WeeklySummary>({
    queryKey: queryKeys.system.weeklySummary(userId),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/users/{id}/weekly-summary', {
        params: { path: { id: userId } },
      })
      if (error) throw error
      return unwrap<WeeklySummary>(data)
    },
    ...options,
  })
}

export const useWashSuggestion = (
  options?: Omit<UseQueryOptions<WashSuggestion>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<WashSuggestion>({
    queryKey: queryKeys.utility.washSuggestion(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/wash/suggestion', {})
      if (error) throw error
      return unwrap<WashSuggestion>(data)
    },
    ...options,
  })
}

export const useLezCheck = (options?: Omit<UseQueryOptions<LezCheck>, 'queryKey' | 'queryFn'>) => {
  const client = useApiClient()
  return useQuery<LezCheck>({
    queryKey: queryKeys.utility.lezCheck(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/lez/check', {})
      if (error) throw error
      return unwrap<LezCheck>(data)
    },
    ...options,
  })
}

export const useTireRecommendations = (
  options?: Omit<UseQueryOptions<TireRecommendations>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<TireRecommendations>({
    queryKey: queryKeys.utility.tireRecommendations(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/parts/tires/recommendations', {})
      if (error) throw error
      return unwrap<TireRecommendations>(data)
    },
    ...options,
  })
}

export const useAuditLogs = (
  options?: Omit<UseQueryOptions<AuditLogs>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<AuditLogs>({
    queryKey: queryKeys.audit.logs(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/audit-logs', {})
      if (error) throw error
      return unwrap<AuditLogs>(data)
    },
    ...options,
  })
}

export const useBanners = (
  options?: Omit<UseQueryOptions<BannerList>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<BannerList>({
    queryKey: queryKeys.banners.list(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/banners', {})
      if (error) throw error
      return unwrap<BannerList>(data)
    },
    ...options,
  })
}

type DismissBannerInput = {
  bannerKey: string
}

export const useDismissBanner = (
  options?: UseMutationOptions<BannerDismissResult, unknown, DismissBannerInput>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<BannerDismissResult, unknown, DismissBannerInput>({
    mutationFn: async ({ bannerKey }) => {
      const { data, error } = await client.POST('/api/banners/{bannerKey}/dismiss', {
        params: { path: { bannerKey } },
      })
      if (error) throw error
      return unwrap<BannerDismissResult>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.banners.list() })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

export const useAnalyticsDashboard = (
  filters: AnalyticsFilters = {},
  options?: Omit<UseQueryOptions<Dashboard>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<Dashboard>({
    queryKey: queryKeys.analytics.dashboard(filters),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/analytics/dashboard', {
        params: { query: filters },
      })
      if (error) throw error
      return unwrap<Dashboard>(data)
    },
    ...options,
  })
}

type FairPriceBody = {
  userPaid: number
}

export const useEstimateFairPrice = (
  options?: UseMutationOptions<FairPriceResult, unknown, FairPriceBody>,
) => {
  const client = useApiClient()
  return useMutation<FairPriceResult, unknown, FairPriceBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/ai/fair-price', { body })
      if (error) throw error
      return unwrap<FairPriceResult>(data)
    },
    ...options,
  })
}

type CreateMaintenanceBody = Record<string, unknown> & {
  odometer: number
  category: string
  description?: string
  totalCost?: number
}

export const useCreateMaintenanceLog = (
  vehicleId: string,
  options?: UseMutationOptions<MaintenanceCreated, unknown, CreateMaintenanceBody>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<MaintenanceCreated, unknown, CreateMaintenanceBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/vehicles/{id}/maintenance', {
        params: { path: { id: vehicleId } },
        body,
      })
      if (error) throw error
      return unwrap<MaintenanceCreated>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.maintenance(vehicleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.list() })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

type SyncActionInput = { id: string; type: string; payload: Record<string, unknown> }
type SyncBody = {
  actions: SyncActionInput[]
}

export const useSyncActions = (options?: UseMutationOptions<SyncResult, unknown, SyncBody>) => {
  const client = useApiClient()
  return useMutation<SyncResult, unknown, SyncBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/sync', { body })
      if (error) throw error
      return unwrap<SyncResult>(data)
    },
    ...options,
  })
}
