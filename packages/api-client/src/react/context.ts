import { createContext, useContext } from 'react'
import type { ApiClient } from '../client.js'

export const ApiClientContext = createContext<ApiClient | null>(null)

export const useApiClient = (): ApiClient => {
  const client = useContext(ApiClientContext)
  if (!client) {
    throw new Error(
      'useApiClient must be used within an ApiClientProvider. Wrap your app with <ApiClientProvider client={...}>.',
    )
  }
  return client
}
