import { ApiClientProvider } from '@autocare/api-client/react'
import { parseMobileEnv, resolveMobileApiBaseUrl } from '@autocare/config/mobile'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { Stack } from 'expo-router'
import { useState } from 'react'
import { createMobileApiClient } from '../src/features/auth/auth-client'

const mobileEnv = parseMobileEnv({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
})

const getBaseUrl = (): string =>
  resolveMobileApiBaseUrl(mobileEnv, {
    expoConfigExtra: Constants.expoConfig?.extra as { apiUrl?: string } | undefined,
    fallback: 'http://localhost:4000',
  })

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              const status = (error as { status?: number } | null)?.status
              if (status === 401 || status === 403) return false
              return failureCount < 1
            },
          },
        },
      }),
  )

  const [apiClient] = useState(() => createMobileApiClient({ baseUrl: getBaseUrl() }))

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={apiClient}>
        <Stack />
      </ApiClientProvider>
    </QueryClientProvider>
  )
}
