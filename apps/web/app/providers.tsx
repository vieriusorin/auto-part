'use client'

import { type ApiClient, createApiClient } from '@autocare/api-client'
import { ApiClientProvider } from '@autocare/api-client/react'
import { parseWebEnv, resolveWebApiBaseUrl } from '@autocare/config/web'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

const webEnv = parseWebEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_URL: process.env.API_URL,
})

const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? 'autocare.csrf'

const getBaseUrl = (): string => {
  const isServer = typeof window === 'undefined'
  const resolved = resolveWebApiBaseUrl(webEnv, {
    isServer,
    fallback: isServer ? 'http://localhost:4000' : undefined,
  })
  if (resolved.length > 0) return resolved
  return window.location.origin
}

const readCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1] ?? '') : undefined
}

type ProvidersProps = {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
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
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  const [apiClient] = useState<ApiClient>(() => {
    const baseUrl = getBaseUrl()
    let refreshing: Promise<boolean> | null = null

    const doRefresh = async (): Promise<boolean> => {
      try {
        const res = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'X-Client': 'web',
            'Content-Type': 'application/json',
          },
          body: '{}',
        })
        return res.ok
      } catch {
        return false
      }
    }

    return createApiClient({
      baseUrl,
      clientKind: 'web',
      credentials: 'include',
      getCsrfToken: () => readCookie(CSRF_COOKIE_NAME),
      onUnauthorized: async () => {
        refreshing = refreshing ?? doRefresh()
        const ok = await refreshing
        refreshing = null
        return ok
      },
    })
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={apiClient}>{children}</ApiClientProvider>
    </QueryClientProvider>
  )
}
