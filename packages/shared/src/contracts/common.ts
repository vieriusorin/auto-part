import { z } from 'zod'

export const UuidSchema = z.string().uuid()

export const IsoDateTimeSchema = z.string().datetime()

export const IntegrityHashSchema = z.string().length(64)

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
})

export const ApiErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
})

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorPayloadSchema,
})

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  })

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
export type SuccessResponse<T> = {
  success: true
  data: T
}
