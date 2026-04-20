import { z } from 'zod'

export const HealthResponseDataSchema = z.object({
  status: z.string(),
  uptime: z.number().nonnegative().optional(),
  timestamp: z.string().datetime().optional(),
})

export const UserIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const WeeklySummaryResponseDataSchema = z.object({
  spent: z.number(),
  nextServiceInDays: z.number().int(),
  issuesDetected: z.number().int().nonnegative(),
})

export const SyncActionSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.any()),
})

export const SyncBodySchema = z.object({
  actions: z.array(SyncActionSchema),
})
export type SyncInput = z.infer<typeof SyncBodySchema>

export const SyncResponseDataSchema = z.object({
  synced: z.number().int().nonnegative(),
})

export const syncPayloadSchema = SyncBodySchema
