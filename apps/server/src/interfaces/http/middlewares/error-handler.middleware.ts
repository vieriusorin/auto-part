import type { ErrorRequestHandler } from 'express'
import { AuthError } from '../../../modules/auth/domain/errors.js'
import { commonPresenter } from '../../../presenters/common.presenter.js'

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const logger = req.log ?? console

  if (error instanceof AuthError) {
    logger.warn({ err: error, code: error.code }, 'Auth error')
    commonPresenter.error(res, error.status, error.code, error.message)
    return
  }

  logger.error({ err: error }, 'Unhandled request error')

  // Never leak internal error detail (stack traces, DB messages, ORM internals)
  // to clients in production. Detail is useful in development only.
  const details =
    process.env.NODE_ENV === 'production'
      ? undefined
      : { cause: error instanceof Error ? error.message : String(error) }

  commonPresenter.error(res, 500, 'internal_server_error', 'Internal server error', details)
}
