import type { Response } from 'express'

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class BasePresenter {
  protected sendSuccess<T>(res: Response, data: T, statusCode = 200): Response<ApiSuccess<T>> {
    return res.status(statusCode).json({
      success: true,
      data,
    })
  }

  protected sendError(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ): Response<ApiError> {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details,
      },
    })
  }

  ok<T>(res: Response, data: T): Response<ApiSuccess<T>> {
    return this.sendSuccess(res, data, 200)
  }

  created<T>(res: Response, data: T): Response<ApiSuccess<T>> {
    return this.sendSuccess(res, data, 201)
  }

  accepted<T>(res: Response, data: T): Response<ApiSuccess<T>> {
    return this.sendSuccess(res, data, 202)
  }

  error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
  ): Response<ApiError> {
    return this.sendError(res, statusCode, code, message, details)
  }
}
