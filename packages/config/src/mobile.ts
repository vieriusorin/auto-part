import { z } from 'zod'
import { EnvValidationError, formatZodIssues } from './errors'

const mobileEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
})

export type MobileEnv = z.infer<typeof mobileEnvSchema>

export const parseMobileEnv = (raw: Record<string, string | undefined>): MobileEnv => {
  const result = mobileEnvSchema.safeParse(raw)
  if (!result.success) {
    throw new EnvValidationError('mobile', formatZodIssues(result.error))
  }
  return result.data
}

type ExpoConfigExtra = { apiUrl?: string } | undefined

export const resolveMobileApiBaseUrl = (
  env: MobileEnv,
  options: { expoConfigExtra?: ExpoConfigExtra; fallback?: string },
): string => {
  const extraApiUrl = options.expoConfigExtra?.apiUrl
  if (extraApiUrl && extraApiUrl.length > 0) {
    return extraApiUrl
  }
  if (env.EXPO_PUBLIC_API_URL && env.EXPO_PUBLIC_API_URL.length > 0) {
    return env.EXPO_PUBLIC_API_URL
  }
  return options.fallback ?? 'http://localhost:4000'
}
