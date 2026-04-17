import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import type { Container } from 'inversify'
import morgan from 'morgan'
import type pino from 'pino'
import { pinoHttp } from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import type { GetHealthUseCase } from '../../application/system/get-health-use-case.js'
import { openApiSpec } from '../../docs/openapi.js'
import { commonPresenter } from '../../presenters/common.presenter.js'
import { createHttpRoutes } from './routes.js'
import { errorHandler } from './middlewares/error-handler.middleware.js'
import { helmetMiddleware } from './middlewares/helmet.middleware.js'
import { apiLimiter, swaggerLimiter } from './middlewares/rate-limiter.middleware.js'
import { payloadLimiter, speedLimiter } from './middlewares/request-limiter.middleware.js'
import { securityHeaders } from './middlewares/security-header.middleware.js'

type CreateServerParams = {
  container: Container
  logger: pino.Logger
  getHealthUseCase: GetHealthUseCase
}

export const createServer = ({ container, logger, getHealthUseCase }: CreateServerParams) => {
  const app = express()

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ]

  app.use(helmetMiddleware)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true)
          return
        }

        if (process.env.NODE_ENV === 'development') {
          if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true)
            return
          }
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    }),
  )
  app.use(morgan('dev'))
  app.use(cookieParser())
  app.use(payloadLimiter)
  app.use(speedLimiter)
  app.use(pinoHttp({ logger }))
  app.use(apiLimiter)
  app.use(securityHeaders)

  app.get('/health', (_req, res) => {
    commonPresenter.ok(res, getHealthUseCase.execute())
  })

  const swaggerHandler = swaggerUi.setup(openApiSpec)
  app.get('/docs.json', (_req, res) => {
    res.json(openApiSpec)
  })
  app.use('/docs', swaggerLimiter, swaggerUi.serve)
  app.get('/docs', swaggerLimiter, swaggerHandler)
  app.get('/docs/', swaggerLimiter, swaggerHandler)
  app.use('/api/docs', swaggerLimiter, swaggerUi.serve)
  app.get('/api/docs', swaggerLimiter, swaggerHandler)
  app.get('/api/docs/', swaggerLimiter, swaggerHandler)
  app.get('/api/docs.json', (_req, res) => {
    res.json(openApiSpec)
  })

  app.use(createHttpRoutes(container))
  app.use(errorHandler)

  return app
}
