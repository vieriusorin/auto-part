import { rateLimit } from 'express-rate-limit'
import { apiRateLimiter, authRateLimiter } from './security.middleware.js'

export const apiLimiter = apiRateLimiter
export const authLimiter = authRateLimiter

export const swaggerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'swagger_rate_limit_exceeded',
      message: 'Too many requests to API docs. Please try again later.',
    },
  },
})
