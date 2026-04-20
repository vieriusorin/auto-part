import { z } from 'zod'

export const GenerateReportBodySchema = z.record(z.string(), z.unknown()).optional()

export const GenerateReportResponseDataSchema = z.object({
  publicUrl: z.string().url(),
  reportHash: z.string(),
})
