/** @type {import('next').NextConfig} */

// Content Security Policy.
// Start strict; loosen per-directive as you add third-party scripts, fonts,
// analytics, etc. 'unsafe-inline' on style-src is kept because Next.js ships
// inline <style> tags for the framework; if you eliminate those with nonces,
// remove this and switch to strict-dynamic.
const buildCsp = () => {
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      // Browser will call the API directly; add the API origin if it differs
      // from the web origin. NEXT_PUBLIC_API_URL is inlined at build time.
      process.env.NEXT_PUBLIC_API_URL,
    ].filter(Boolean),
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  }

  return Object.entries(directives)
    .map(([key, values]) => (values.length > 0 ? `${key} ${values.join(' ')}` : key))
    .join('; ')
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: buildCsp() },
  {
    key: 'Strict-Transport-Security',
    value: `max-age=${60 * 60 * 24 * 365}; includeSubDomains`,
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
