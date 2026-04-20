import { queryKeys } from '@autocare/api-client'
import { type Me, useAuth, useLogin, useLogout, useRegister } from '@autocare/api-client/react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { tokenStorage } from '../../lib/token-storage'

type Tokens = { accessToken: string; refreshToken?: string }

const persistTokens = async (tokens: Tokens): Promise<void> => {
  if (!tokens.accessToken || !tokens.refreshToken) return
  await tokenStorage.setTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  })
}

/**
 * Wraps the generic `useAuth` flow with mobile-specific token persistence:
 * each successful login/register/refresh writes the new tokens to Expo
 * SecureStore so they survive app restarts and power the Authorization
 * header on every request.
 */
export const useMobileAuth = () => {
  const queryClient = useQueryClient()
  const auth = useAuth()
  const login = useLogin({
    onSuccess: async (session) => {
      await persistTokens(session.tokens)
      queryClient.setQueryData<Me>(queryKeys.auth.me(), session.user)
    },
  })
  const register = useRegister({
    onSuccess: async (session) => {
      await persistTokens(session.tokens)
      queryClient.setQueryData<Me>(queryKeys.auth.me(), session.user)
    },
  })
  const logout = useLogout({
    onSettled: async () => {
      await tokenStorage.clear()
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
    },
  })

  const signOut = useCallback(async () => {
    await logout.mutateAsync().catch(() => undefined)
    await tokenStorage.clear()
    queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
  }, [logout, queryClient])

  return {
    ...auth,
    login,
    register,
    logout,
    signOut,
  }
}
