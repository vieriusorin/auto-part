import createOpenApiClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './types.gen'

export type ApiClient = ReturnType<typeof createOpenApiClient<paths>>

export type ClientKind = 'web' | 'mobile' | 'server'

export type CreateApiClientOptions = {
  baseUrl: string
  clientKind: ClientKind
  /** Access token provider, used only for non-cookie clients (mobile/server). */
  getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>
  /** CSRF token provider, used only for cookie-based clients (web). */
  getCsrfToken?: () => string | null | undefined
  /** Called when a 401 is returned; if it returns true, the request is retried once. */
  onUnauthorized?: (request: Request) => boolean | Promise<boolean>
  /** Called on every response with a fresh CSRF token header so clients can cache it. */
  onCsrfTokenRotated?: (token: string) => void
  fetch?: typeof fetch
  headers?: Record<string, string>
  /** Include credentials on every request (needed for cookie clients). */
  credentials?: RequestCredentials
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor({
    status,
    message,
    code,
    details,
  }: {
    status: number
    message: string
    code?: string
    details?: unknown
  }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const AUTH_REFRESH_PATH = '/auth/refresh'

const buildClientKindMiddleware = (clientKind: ClientKind): Middleware => ({
  async onRequest({ request }) {
    request.headers.set('X-Client', clientKind)
    return request
  },
})

const buildAuthMiddleware = (getAuthToken: CreateApiClientOptions['getAuthToken']): Middleware => ({
  async onRequest({ request }) {
    if (!getAuthToken) return request
    const token = await getAuthToken()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
})

const buildCsrfMiddleware = (
  getCsrfToken: CreateApiClientOptions['getCsrfToken'],
  onRotated: CreateApiClientOptions['onCsrfTokenRotated'],
): Middleware => ({
  async onRequest({ request }) {
    if (!getCsrfToken) return request
    if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) return request
    const token = getCsrfToken()
    if (token) {
      request.headers.set('X-CSRF-Token', token)
    }
    return request
  },
  async onResponse({ response }) {
    if (!onRotated) return response
    const header = response.headers.get('X-CSRF-Token')
    if (header) onRotated(header)
    return response
  },
})

const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.ok) return response

    let code: string | undefined
    let message = response.statusText || 'Request failed'
    let details: unknown

    try {
      const cloned = response.clone()
      const body = (await cloned.json()) as {
        error?: { code?: string; message?: string; details?: unknown }
      }
      if (body?.error) {
        code = body.error.code
        message = body.error.message ?? message
        details = body.error.details
      }
    } catch {
      // Non-JSON error body; keep defaults.
    }

    throw new ApiError({ status: response.status, message, code, details })
  },
}

const buildRefreshMiddleware = (
  onUnauthorized: CreateApiClientOptions['onUnauthorized'],
): Middleware => {
  let inFlight: Promise<boolean> | null = null
  return {
    async onResponse({ request, response }) {
      if (response.status !== 401) return response
      if (!onUnauthorized) return response
      const url = new URL(request.url)
      if (url.pathname.endsWith(AUTH_REFRESH_PATH)) return response
      if (request.headers.get('X-Skip-Refresh') === '1') return response

      inFlight = inFlight ?? Promise.resolve(onUnauthorized(request))
      let ok = false
      try {
        ok = await inFlight
      } finally {
        inFlight = null
      }
      if (!ok) return response

      const retry = new Request(request, {})
      retry.headers.set('X-Skip-Refresh', '1')
      const retryResponse = await fetch(retry)
      return retryResponse
    },
  }
}

export const createApiClient = (options: CreateApiClientOptions): ApiClient => {
  const client = createOpenApiClient<paths>({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
    headers: options.headers,
    credentials: options.credentials,
  })

  client.use(
    buildClientKindMiddleware(options.clientKind),
    buildAuthMiddleware(options.getAuthToken),
    buildCsrfMiddleware(options.getCsrfToken, options.onCsrfTokenRotated),
    buildRefreshMiddleware(options.onUnauthorized),
    errorMiddleware,
  )

  return client
}
