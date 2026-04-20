import { z } from 'zod'

export const BannerSeveritySchema = z.enum(['info', 'warning', 'critical'])
export type BannerSeverity = z.infer<typeof BannerSeveritySchema>

export const BannerCtaSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
})

export const BannerSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  severity: BannerSeveritySchema,
  cta: BannerCtaSchema.nullable(),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
})

export const ListBannersResponseDataSchema = z.object({
  items: z.array(BannerSchema),
})

export const DismissBannerParamsSchema = z.object({
  bannerKey: z.string().min(1),
})

export const DismissBannerResponseDataSchema = z.object({
  dismissed: z.literal(true),
})
