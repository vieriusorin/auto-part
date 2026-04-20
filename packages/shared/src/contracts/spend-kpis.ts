import { z } from 'zod'

export const SpendKpiGranularitySchema = z.enum(['day', 'week', 'month'])
export type SpendKpiGranularity = z.infer<typeof SpendKpiGranularitySchema>

const csvOrArray = z.union([z.string().min(1), z.array(z.string().min(1))])

const normalizeList = (value: z.infer<typeof csvOrArray>): string[] | undefined => {
  const input = Array.isArray(value) ? value : value.split(',')
  const normalized = input.map((entry) => entry.trim()).filter(Boolean)
  return normalized.length > 0 ? normalized : undefined
}

export const SpendKpisQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  granularity: SpendKpiGranularitySchema.default('month'),
  vehicleIds: csvOrArray.transform(normalizeList).optional(),
  categories: csvOrArray.transform(normalizeList).optional(),
})
export type SpendKpisQuery = z.infer<typeof SpendKpisQuerySchema>

export const SpendByPeriodSchema = z.object({
  periodStart: z.string().datetime(),
  spend: z.number().nonnegative(),
})
export type SpendByPeriod = z.infer<typeof SpendByPeriodSchema>

export const SpendByCategorySchema = z.object({
  category: z.string(),
  spend: z.number().nonnegative(),
})
export type SpendByCategory = z.infer<typeof SpendByCategorySchema>

export const SpendByVehicleSchema = z.object({
  vehicleId: z.string().uuid(),
  spend: z.number().nonnegative(),
})
export type SpendByVehicle = z.infer<typeof SpendByVehicleSchema>

export const SpendKpiAnomalySchema = z.object({
  periodStart: z.string().datetime(),
  spend: z.number().nonnegative(),
  threshold: z.number().nonnegative(),
  reason: z.string(),
})
export type SpendKpiAnomaly = z.infer<typeof SpendKpiAnomalySchema>

export const SpendKpisResponseDataSchema = z.object({
  range: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    granularity: SpendKpiGranularitySchema,
  }),
  totals: z.object({
    totalSpend: z.number().nonnegative(),
    maintenanceSpend: z.number().nonnegative(),
    fuelSpend: z.number().nonnegative(),
  }),
  byPeriod: z.array(SpendByPeriodSchema),
  byCategory: z.array(SpendByCategorySchema),
  byVehicle: z.array(SpendByVehicleSchema),
  advanced: z.object({
    trendDeltaPercent: z.number(),
    forecastNextPeriodSpend: z.number().nonnegative(),
    anomalies: z.array(SpendKpiAnomalySchema),
  }),
})
export type SpendKpisResponseData = z.infer<typeof SpendKpisResponseDataSchema>
