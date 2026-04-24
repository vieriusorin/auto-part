import type { ReactNode } from 'react'
import type { ApiClient } from '../client'
import { ApiClientContext } from './context'

type ApiClientProviderProps = {
  client: ApiClient
  children: ReactNode
}

export const ApiClientProvider = ({ client, children }: ApiClientProviderProps) => {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>
}
