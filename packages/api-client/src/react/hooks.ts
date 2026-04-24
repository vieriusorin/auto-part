import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../client'
import { queryKeys } from '../query-keys'
import type { operations } from '../types.gen'
import { useApiClient } from './context'

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
type ReminderList = SuccessData<operations['listVehicleReminders']>
type ReminderCreated = SuccessData<operations['createVehicleReminder']>
type ReminderUpdated = SuccessData<operations['updateVehicleReminder']>
type ActionFeedList = SuccessData<operations['getVehicleActionFeed']>
type VehicleForecast = SuccessData<operations['getVehicleForecast']>
type VehicleDocuments = SuccessData<operations['listVehicleDocuments']>
type VehicleDocumentCreated = SuccessData<operations['createVehicleDocument']>
type VehicleMembers = SuccessData<operations['listVehicleMembers']>
type VehicleMemberUpserted = SuccessData<operations['upsertVehicleMember']>
type FuelList = SuccessData<operations['listFuelEntries']>
type BannerList = SuccessData<operations['listBanners']>
type BannerDismissResult = SuccessData<operations['dismissBanner']>
type SpendKpis = SuccessData<operations['getSpendKpis']>
type SubscriptionStatus = SuccessData<operations['getSubscriptionStatus']>
type SubscriptionOffers = SuccessData<operations['listSubscriptionOffers']>
type StartedTrial = SuccessData<operations['startSubscriptionTrial']>
type CanceledSubscription = SuccessData<operations['cancelSubscription']>
type MarkedMonth2Active = SuccessData<operations['markSubscriptionMonth2Active']>
type CancelReasonsSummary = SuccessData<operations['listSubscriptionCancelReasons']>
type SubscriptionRetentionSummary = SuccessData<operations['getSubscriptionRetentionSummary']>
type AffiliateOffers = SuccessData<operations['listAffiliateOffers']>
type AffiliateClickTracked = SuccessData<operations['trackAffiliateClick']>
type AffiliateExposureTracked = SuccessData<operations['trackAffiliateExposure']>
type AffiliateComplaintReported = SuccessData<operations['reportAffiliateComplaint']>

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

export const useVehicleReminders = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<ReminderList>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<ReminderList>({
    ...options,
    queryKey: queryKeys.vehicles.reminders(vehicleId ?? ''),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}/reminders', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<ReminderList>(data)
    },
    enabled: Boolean(vehicleId) && (options?.enabled ?? true),
  })
}

export const useVehicleActionFeed = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<ActionFeedList>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<ActionFeedList>({
    ...options,
    queryKey: queryKeys.vehicles.actionFeed(vehicleId ?? ''),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}/action-feed', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<ActionFeedList>(data)
    },
    enabled: Boolean(vehicleId) && (options?.enabled ?? true),
  })
}

export const useVehicleForecast = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<VehicleForecast>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<VehicleForecast>({
    ...options,
    queryKey: queryKeys.vehicles.forecast(vehicleId ?? ''),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}/forecast', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<VehicleForecast>(data)
    },
    enabled: Boolean(vehicleId) && (options?.enabled ?? true),
  })
}

export const useVehicleDocuments = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<VehicleDocuments>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<VehicleDocuments>({
    ...options,
    queryKey: [...queryKeys.vehicles.detail(vehicleId ?? ''), 'documents'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}/documents', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<VehicleDocuments>(data)
    },
    enabled: Boolean(vehicleId) && (options?.enabled ?? true),
  })
}

export const useVehicleMembers = (
  vehicleId: string | undefined,
  options?: Omit<UseQueryOptions<VehicleMembers>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<VehicleMembers>({
    ...options,
    queryKey: [...queryKeys.vehicles.detail(vehicleId ?? ''), 'members'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/vehicles/{id}/members', {
        params: { path: { id: vehicleId ?? '' } },
      })
      if (error) throw error
      return unwrap<VehicleMembers>(data)
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

export const useSubscriptionStatus = (
  options?: Omit<UseQueryOptions<SubscriptionStatus>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<SubscriptionStatus>({
    queryKey: queryKeys.subscription.status(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/subscription/status', {})
      if (error) throw error
      return unwrap<SubscriptionStatus>(data)
    },
    ...options,
  })
}

export const useSubscriptionOffers = (
  options?: Omit<UseQueryOptions<SubscriptionOffers>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<SubscriptionOffers>({
    queryKey: queryKeys.subscription.offers(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/subscription/offers', {})
      if (error) throw error
      return unwrap<SubscriptionOffers>(data)
    },
    ...options,
  })
}

export const useSubscriptionCancelReasons = (
  options?: Omit<UseQueryOptions<CancelReasonsSummary>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<CancelReasonsSummary>({
    queryKey: queryKeys.subscription.cancelReasons(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/subscription/cancel-reasons', {})
      if (error) throw error
      return unwrap<CancelReasonsSummary>(data)
    },
    ...options,
  })
}

export const useSubscriptionRetentionSummary = (
  options?: Omit<UseQueryOptions<SubscriptionRetentionSummary>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<SubscriptionRetentionSummary>({
    queryKey: queryKeys.subscription.retentionSummary(),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/subscription/retention-summary', {})
      if (error) throw error
      return unwrap<SubscriptionRetentionSummary>(data)
    },
    ...options,
  })
}

type AffiliateIntentSurface = 'maintenance_due' | 'service_report_ready' | 'cost_anomaly_detected'

type AffiliateOffersFilters = {
  intentSurface?: AffiliateIntentSurface
}

export const useAffiliateOffers = (
  filters: AffiliateOffersFilters = {},
  options?: Omit<UseQueryOptions<AffiliateOffers>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient()
  return useQuery<AffiliateOffers>({
    queryKey: queryKeys.affiliate.offers(filters.intentSurface),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/affiliate/offers', {
        params: { query: filters },
      })
      if (error) throw error
      return unwrap<AffiliateOffers>(data)
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

type CreateReminderBody = {
  title: string
  notes?: string
  frequencyType: 'days' | 'miles'
  intervalValue: number
  dueAt?: string
  dueOdometer?: number
}

type UpdateReminderBody = {
  title?: string
  notes?: string | null
  status?: 'due_now' | 'upcoming' | 'deferred' | 'done'
  deferredUntil?: string | null
}

export const useCreateVehicleReminder = (
  vehicleId: string,
  options?: UseMutationOptions<ReminderCreated, unknown, CreateReminderBody>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<ReminderCreated, unknown, CreateReminderBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/vehicles/{id}/reminders', {
        params: { path: { id: vehicleId } },
        body,
      })
      if (error) throw error
      return unwrap<ReminderCreated>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.reminders(vehicleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.actionFeed(vehicleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.forecast(vehicleId) })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

export const useUpdateVehicleReminder = (
  vehicleId: string,
  options?: UseMutationOptions<ReminderUpdated, unknown, { reminderId: string; body: UpdateReminderBody }>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<ReminderUpdated, unknown, { reminderId: string; body: UpdateReminderBody }>({
    mutationFn: async ({ reminderId, body }) => {
      const { data, error } = await client.PUT('/api/vehicles/{id}/reminders/{reminderId}', {
        params: { path: { id: vehicleId, reminderId } },
        body,
      })
      if (error) throw error
      return unwrap<ReminderUpdated>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.reminders(vehicleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.actionFeed(vehicleId) })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

type CreateVehicleDocumentBody = {
  maintenanceLogId?: string
  type: 'invoice' | 'inspection' | 'photo' | 'insurance' | 'other'
  title: string
  storageKey: string
  mimeType: string
  sizeBytes: number
}

export const useCreateVehicleDocument = (
  vehicleId: string,
  options?: UseMutationOptions<VehicleDocumentCreated, unknown, CreateVehicleDocumentBody>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<VehicleDocumentCreated, unknown, CreateVehicleDocumentBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/vehicles/{id}/documents', {
        params: { path: { id: vehicleId } },
        body,
      })
      if (error) throw error
      return unwrap<VehicleDocumentCreated>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.vehicles.detail(vehicleId), 'documents'] })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

type UpsertVehicleMemberBody = {
  userId: string
  role: 'owner' | 'manager' | 'driver' | 'viewer'
}

export const useUpsertVehicleMember = (
  vehicleId: string,
  options?: UseMutationOptions<VehicleMemberUpserted, unknown, UpsertVehicleMemberBody>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<VehicleMemberUpserted, unknown, UpsertVehicleMemberBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.PUT('/api/vehicles/{id}/members', {
        params: { path: { id: vehicleId } },
        body,
      })
      if (error) throw error
      return unwrap<VehicleMemberUpserted>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.vehicles.detail(vehicleId), 'members'] })
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

type StartTrialInput = {
  billingCycle: 'monthly' | 'annual'
  variant?: string
}

export const useStartSubscriptionTrial = (
  options?: UseMutationOptions<StartedTrial, unknown, StartTrialInput>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<StartedTrial, unknown, StartTrialInput>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/subscription/trial/start', { body })
      if (error) throw error
      return unwrap<StartedTrial>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.status() })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

type CancelSubscriptionInput = {
  reason: string
  feedback?: string
}

export const useCancelSubscription = (
  options?: UseMutationOptions<CanceledSubscription, unknown, CancelSubscriptionInput>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<CanceledSubscription, unknown, CancelSubscriptionInput>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/subscription/cancel', { body })
      if (error) throw error
      return unwrap<CanceledSubscription>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.status() })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

export const useMarkSubscriptionMonth2Active = (
  options?: UseMutationOptions<MarkedMonth2Active, unknown, void>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<MarkedMonth2Active, unknown, void>({
    mutationFn: async () => {
      const { data, error } = await client.POST('/api/subscription/lifecycle/month2-active', {})
      if (error) throw error
      return unwrap<MarkedMonth2Active>(data)
    },
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscription.retentionSummary() })
      options?.onSuccess?.(...args)
    },
    ...options,
  })
}

type TrackAffiliateClickInput = {
  offerId: string
  intentSurface: AffiliateIntentSurface
  disclosed: boolean
  consentGranted: boolean
}

export const useTrackAffiliateClick = (
  options?: UseMutationOptions<AffiliateClickTracked, unknown, TrackAffiliateClickInput>,
) => {
  const client = useApiClient()
  return useMutation<AffiliateClickTracked, unknown, TrackAffiliateClickInput>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/affiliate/click', { body })
      if (error) throw error
      return unwrap<AffiliateClickTracked>(data)
    },
    ...options,
  })
}

type TrackAffiliateExposureInput = {
  offerId: string
  intentSurface: AffiliateIntentSurface
  disclosed: boolean
}

export const useTrackAffiliateExposure = (
  options?: UseMutationOptions<AffiliateExposureTracked, unknown, TrackAffiliateExposureInput>,
) => {
  const client = useApiClient()
  return useMutation<AffiliateExposureTracked, unknown, TrackAffiliateExposureInput>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/affiliate/exposure', { body })
      if (error) throw error
      return unwrap<AffiliateExposureTracked>(data)
    },
    ...options,
  })
}

type ReportAffiliateComplaintInput = {
  reason: string
  offerId?: string
  intentSurface?: AffiliateIntentSurface
  disclosureVisible: boolean
}

export const useReportAffiliateComplaint = (
  options?: UseMutationOptions<AffiliateComplaintReported, unknown, ReportAffiliateComplaintInput>,
) => {
  const client = useApiClient()
  return useMutation<AffiliateComplaintReported, unknown, ReportAffiliateComplaintInput>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/api/affiliate/complaint', { body })
      if (error) throw error
      return unwrap<AffiliateComplaintReported>(data)
    },
    ...options,
  })
}
