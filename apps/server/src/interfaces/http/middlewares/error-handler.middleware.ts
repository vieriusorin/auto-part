import type { ErrorRequestHandler } from 'express'
import { commonPresenter } from '../../../presenters/common.presenter.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error)

  commonPresenter.error(res, 500, 'internal_server_error', 'Internal server error', {
    cause: String(error),
  })
}
