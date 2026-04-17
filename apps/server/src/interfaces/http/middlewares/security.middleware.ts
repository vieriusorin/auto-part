import { rateLimit } from 'express-rate-limit'
import { slowDown } from 'express-slow-down'
import type { RequestHandler } from 'express'
import { validationResult } from 'express-validator'
import { commonPresenter } from '../../../presenters/common.presenter.js'

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'too_many_requests',
      message: 'Too many requests. Please try again later.',
    },
  },
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'too_many_auth_attempts',
      message: 'Too many auth attempts. Please try again later.',
    },
  },
})

export const apiSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: () => 250,
  maxDelayMs: 3_000,
})

export const handleValidationErrors: RequestHandler = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    commonPresenter.error(res, 400, 'validation_failed', 'Validation failed', errors.array())
    return
  }

  next()
}
