import helmet from 'helmet'

/**
 * helmet() defaults set ~12 security-relevant response headers. We keep the
 * defaults and only make HSTS explicit so its behaviour does not drift across
 * helmet major versions.
 *
 * Notes on scope:
 * - This is a JSON API; CSP on API responses does not protect any rendered
 *   content. The browser-facing CSP belongs in apps/web (next.config.js).
 * - Swagger UI is served from /docs. If you tighten CSP further here, add a
 *   /docs-specific exception or Swagger UI will stop loading.
 */
export const helmetMiddleware = helmet({
  hsts: {
    maxAge: 60 * 60 * 24 * 365,
    includeSubDomains: true,
    preload: false,
  },
  crossOriginEmbedderPolicy: false,
})
