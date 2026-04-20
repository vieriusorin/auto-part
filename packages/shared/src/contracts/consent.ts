import { z } from 'zod'

export const LegalBasisSchema = z.enum(['consent', 'legitimate_interest'])
export const ConsentSourceSchema = z.enum(['app', 'api', 'admin'])
export const ConsentStatusSchema = z.enum(['granted', 'revoked', 'expired'])

export const ConsentInputSchema = z.object({
  userId: z.string().min(1),
  consentType: z.string().min(1),
  legalBasis: LegalBasisSchema,
  policyVersion: z.string().min(1),
  source: ConsentSourceSchema,
  requestId: z.string().min(1),
})
export type ConsentInput = z.infer<typeof ConsentInputSchema>

export const ConsentEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  consentType: z.string(),
  status: ConsentStatusSchema,
  legalBasis: LegalBasisSchema,
  policyVersion: z.string(),
  source: ConsentSourceSchema,
  requestId: z.string(),
  createdAt: z.string().datetime(),
})

export const ConsentJobInputSchema = z.object({
  userId: z.string().min(1),
  requestId: z.string().min(1),
})

export const ConsentJobSchema = z.object({
  jobId: z.string(),
  userId: z.string(),
  kind: z.enum(['export', 'delete']),
  status: z.literal('accepted'),
  requestId: z.string(),
})
