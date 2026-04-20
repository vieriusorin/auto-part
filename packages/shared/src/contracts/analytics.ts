import { z } from 'zod'

export const AnalyticsEventSchema = z.object({
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
export type AnalyticsEventInput = z.infer<typeof AnalyticsEventSchema>

export const IngestEventsBodySchema = z.object({
  events: z.array(AnalyticsEventSchema).default([]),
})

export const IngestEventsResponseDataSchema = z.object({
  acceptedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
})

export const AnalyticsPlatformSchema = z.enum(['ios', 'android'])

export const AnalyticsDashboardQuerySchema = z.object({
  country: z.string().optional(),
  platform: AnalyticsPlatformSchema.optional(),
  channel: z.string().optional(),
})

export const DailyRollupSchema = z.object({
  date: z.string(),
  country: z.string().optional(),
  platform: AnalyticsPlatformSchema.optional(),
  channel: z.string().optional(),
  count: z.number().int().nonnegative(),
})

export const AnalyticsDashboardResponseDataSchema = z.object({
  items: z.array(DailyRollupSchema),
})
