import { z } from 'zod'

export const ParsedReportItemSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
  cost: z.number().optional(),
})

export const ParseServiceReportResponseDataSchema = z.object({
  items: z.array(ParsedReportItemSchema),
  model: z.string(),
})

export const ScanReceiptResponseDataSchema = z.object({
  items: z.array(ParsedReportItemSchema),
  model: z.string(),
})

export const FairPriceBodySchema = z.object({
  userPaid: z.coerce.number().nonnegative(),
})
export type FairPriceInput = z.infer<typeof FairPriceBodySchema>

export const FairPriceResponseDataSchema = z.object({
  userPaid: z.number(),
  regionalAverage: z.number(),
  currency: z.string(),
})
