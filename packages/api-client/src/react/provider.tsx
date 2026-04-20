import type { ReactNode } from 'react'
import type { ApiClient } from '../client.js'
import { ApiClientContext } from './context.js'

type ApiClientProviderProps = {
  client: ApiClient
  children: ReactNode
}

export const ApiClientProvider = ({ client, children }: ApiClientProviderProps) => {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>
}
