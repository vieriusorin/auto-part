import { z } from 'zod'
import { EnvValidationError, formatZodIssues } from './errors'

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  API_URL: z.string().url().optional(),
})

export type WebEnv = z.infer<typeof webEnvSchema>

export const parseWebEnv = (raw: Record<string, string | undefined>): WebEnv => {
  const result = webEnvSchema.safeParse(raw)
  if (!result.success) {
    throw new EnvValidationError('web', formatZodIssues(result.error))
  }
  return result.data
}

export const resolveWebApiBaseUrl = (
  env: WebEnv,
  options: { isServer: boolean; fallback?: string },
): string => {
  if (options.isServer) {
    return env.NEXT_PUBLIC_API_URL ?? env.API_URL ?? options.fallback ?? 'http://localhost:4000'
  }
  return env.NEXT_PUBLIC_API_URL ?? options.fallback ?? ''
}
