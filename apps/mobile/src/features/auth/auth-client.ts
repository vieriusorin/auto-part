import { type ApiClient, createApiClient } from '@autocare/api-client'
import { tokenStorage } from '../../lib/token-storage'

type CreateMobileApiClientOptions = {
  baseUrl: string
}

export const createMobileApiClient = ({ baseUrl }: CreateMobileApiClientOptions): ApiClient => {
  let refreshInFlight: Promise<boolean> | null = null

  const refreshOnce = async (): Promise<boolean> => {
    const refreshToken = await tokenStorage.getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client': 'mobile',
        },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        await tokenStorage.clear()
        return false
      }
      const body = (await res.json()) as {
        success: boolean
        data: {
          tokens: { accessToken: string; refreshToken?: string }
        }
      }
      if (!body.success) {
        await tokenStorage.clear()
        return false
      }
      const { accessToken, refreshToken: nextRefresh } = body.data.tokens
      if (!accessToken || !nextRefresh) {
        await tokenStorage.clear()
        return false
      }
      await tokenStorage.setTokens({ accessToken, refreshToken: nextRefresh })
      return true
    } catch {
      return false
    }
  }

  return createApiClient({
    baseUrl,
    clientKind: 'mobile',
    getAuthToken: () => tokenStorage.getAccessToken(),
    onUnauthorized: async () => {
      refreshInFlight = refreshInFlight ?? refreshOnce()
      const ok = await refreshInFlight
      refreshInFlight = null
      return ok
    },
  })
}
