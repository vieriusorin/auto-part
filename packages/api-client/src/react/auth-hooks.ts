import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../client.js'
import { queryKeys } from '../query-keys.js'
import type { operations } from '../types.gen.js'
import { useApiClient } from './context.js'

type SuccessEnvelope<T> = {
  success: true
  data: T
}

type SuccessBody<Op> = Op extends {
  responses: { 200: { content: { 'application/json': infer Body } } }
}
  ? Body
  : Op extends {
        responses: { 201: { content: { 'application/json': infer Body } } }
      }
    ? Body
    : never

type SuccessData<Op> = SuccessBody<Op> extends SuccessEnvelope<infer D> ? D : never

const unwrap = <T>(payload: unknown): T => {
  if (
    payload === null ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    (payload as { success: unknown }).success !== true
  ) {
    throw new ApiError({ status: 500, message: 'Unexpected API response envelope' })
  }
  return (payload as SuccessEnvelope<T>).data
}

export type Me = SuccessData<operations['authMe']>
export type AuthSession = SuccessData<operations['authLogin']>
export type LogoutResult = SuccessData<operations['authLogout']>

type BodyOf<Op> = Op extends {
  requestBody?: { content: { 'application/json': infer Body } }
}
  ? Body
  : never

type LoginBody = BodyOf<operations['authLogin']>
type RegisterBody = BodyOf<operations['authRegister']>
type ChangePasswordBody = BodyOf<operations['authChangePassword']>

export const useMe = (options?: Omit<UseQueryOptions<Me, ApiError>, 'queryKey' | 'queryFn'>) => {
  const client = useApiClient()
  return useQuery<Me, ApiError>({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const { data, error } = await client.GET('/auth/me', {})
      if (error) throw error
      return unwrap<Me>(data)
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false
      return failureCount < 2
    },
    ...options,
  })
}

export const useLogin = (options?: UseMutationOptions<AuthSession, ApiError, LoginBody>) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<AuthSession, ApiError, LoginBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/auth/login', { body })
      if (error) throw error
      return unwrap<AuthSession>(data)
    },
    onSuccess: (data, ...rest) => {
      queryClient.setQueryData<Me>(queryKeys.auth.me(), data.user)
      options?.onSuccess?.(data, ...rest)
    },
    ...options,
  })
}

export const useRegister = (options?: UseMutationOptions<AuthSession, ApiError, RegisterBody>) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<AuthSession, ApiError, RegisterBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/auth/register', { body })
      if (error) throw error
      return unwrap<AuthSession>(data)
    },
    onSuccess: (data, ...rest) => {
      queryClient.setQueryData<Me>(queryKeys.auth.me(), data.user)
      options?.onSuccess?.(data, ...rest)
    },
    ...options,
  })
}

export const useLogout = (options?: UseMutationOptions<LogoutResult, ApiError, void>) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<LogoutResult, ApiError, void>({
    mutationFn: async () => {
      const { data, error } = await client.POST('/auth/logout', {})
      if (error) throw error
      return unwrap<LogoutResult>(data)
    },
    onSuccess: (data, ...rest) => {
      queryClient.setQueryData<Me | undefined>(queryKeys.auth.me(), undefined)
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
      options?.onSuccess?.(data, ...rest)
    },
    ...options,
  })
}

export const useLogoutAll = (options?: UseMutationOptions<LogoutResult, ApiError, void>) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<LogoutResult, ApiError, void>({
    mutationFn: async () => {
      const { data, error } = await client.POST('/auth/logout-all', {})
      if (error) throw error
      return unwrap<LogoutResult>(data)
    },
    onSuccess: (data, ...rest) => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
      options?.onSuccess?.(data, ...rest)
    },
    ...options,
  })
}

export const useChangePassword = (
  options?: UseMutationOptions<LogoutResult, ApiError, ChangePasswordBody>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<LogoutResult, ApiError, ChangePasswordBody>({
    mutationFn: async (body) => {
      const { data, error } = await client.POST('/auth/change-password', { body })
      if (error) throw error
      return unwrap<LogoutResult>(data)
    },
    onSuccess: (data, ...rest) => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
      options?.onSuccess?.(data, ...rest)
    },
    ...options,
  })
}

export const useRefresh = (
  options?: UseMutationOptions<AuthSession, ApiError, { refreshToken?: string } | void>,
) => {
  const client = useApiClient()
  const queryClient = useQueryClient()
  return useMutation<AuthSession, ApiError, { refreshToken?: string } | void>({
    mutationFn: async (body) => {
      const requestBody = body && 'refreshToken' in body ? { refreshToken: body.refreshToken } : {}
      const { data, error } = await client.POST('/auth/refresh', { body: requestBody })
      if (error) throw error
      return unwrap<AuthSession>(data)
    },
    onSuccess: (data, ...rest) => {
      queryClient.setQueryData<Me>(queryKeys.auth.me(), data.user)
      options?.onSuccess?.(data, ...rest)
    },
    ...options,
  })
}
