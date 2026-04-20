import { z } from 'zod'

export const WashSuggestionResponseDataSchema = z.object({
  shouldWash: z.boolean(),
  message: z.string(),
})

export const LezCheckResponseDataSchema = z.object({
  city: z.string(),
  allowed: z.boolean(),
  details: z.string(),
})

export const TireRecommendationSchema = z.object({
  size: z.string(),
  brand: z.string(),
  model: z.string(),
  price: z.number().nonnegative(),
  currency: z.string(),
})

export const TireRecommendationsResponseDataSchema = z.object({
  items: z.array(TireRecommendationSchema),
})
