import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ServerEnv } from '@autocare/config/server'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import type { Container } from 'inversify'
import morgan from 'morgan'
import type pino from 'pino'
import { pinoHttp } from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import type { GetHealthUseCase } from '../../application/system/get-health-use-case.js'
import type { AuthModule } from '../../modules/auth/auth-module.js'
import { commonPresenter } from '../../presenters/common.presenter.js'
import { errorHandler } from './middlewares/error-handler.middleware.js'
import { helmetMiddleware } from './middlewares/helmet.middleware.js'
import { apiLimiter, swaggerLimiter } from './middlewares/rate-limiter.middleware.js'
import { payloadLimiter, speedLimiter } from './middlewares/request-limiter.middleware.js'
import { securityHeaders } from './middlewares/security-header.middleware.js'
import { buildOpenApiDocumentsByDomain } from './openapi/index.js'
import { createHttpRoutes } from './routes.js'

type CreateServerParams = {
  config: ServerEnv
  container: Container
  authModule: AuthModule
  logger: pino.Logger
  getHealthUseCase: GetHealthUseCase
}

const SERVER_PACKAGE_VERSION = '0.1.0'

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
]

const maybeDumpOpenApiDocuments = (
  result: ReturnType<typeof buildOpenApiDocumentsByDomain>,
  logger: pino.Logger,
  nodeEnv: ServerEnv['NODE_ENV'],
): void => {
  if (nodeEnv === 'production') {
    return
  }

  try {
    const mergedPath = resolve(process.cwd(), 'openapi.json')
    writeFileSync(mergedPath, `${JSON.stringify(result.merged, null, 2)}\n`)
    logger.info({ outputPath: mergedPath }, 'OpenAPI document written for client codegen')

    const domainDir = resolve(process.cwd(), 'openapi')
    mkdirSync(domainDir, { recursive: true })
    for (const name of readdirSync(domainDir)) {
      if (name.endsWith('.json')) {
        unlinkSync(join(domainDir, name))
      }
    }
    const domainPaths: string[] = []
    for (const [slug, document] of Object.entries(result.byDomain)) {
      const path = join(domainDir, `${slug}.json`)
      writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`)
      domainPaths.push(path)
    }
    logger.info({ domainSpecs: domainPaths.sort() }, 'OpenAPI domain specs written for client codegen')
  } catch (error) {
    logger.warn({ error }, 'Failed to dump OpenAPI document')
  }
}

const resolveAllowedOrigins = (config: ServerEnv): string[] => {
  const configured = config.ALLOWED_ORIGINS ?? []
  if (config.NODE_ENV === 'development') {
    // Explicit dev allowlist (no substring matching) so localhost tooling works
    // out of the box without opening the gate for `localhost.attacker.com`.
    const merged = new Set<string>([...configured, ...DEV_ORIGINS])
    return Array.from(merged)
  }
  return configured
}

export const createServer = ({
  config,
  container,
  authModule,
  logger,
  getHealthUseCase,
}: CreateServerParams) => {
  const app = express()

  // Behind a reverse proxy (Azure App Service, Front Door, nginx) express must
  // trust X-Forwarded-* headers so rate limiting and req.ip work correctly.
  // Mis-setting this in production can enable IP spoofing for rate limits, so
  // the value is explicit and validated at startup.
  app.set('trust proxy', config.TRUST_PROXY)

  const allowedOrigins = resolveAllowedOrigins(config)

  app.use(helmetMiddleware)
  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header: server-to-server, curl, React Native. CORS is a
        // browser mechanism; these clients are gated by auth, not CORS.
        if (!origin) {
          callback(null, true)
          return
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

  // Build routers first so the OpenAPI registry is populated before we
  // generate the document (module routers call registerRoute at construction).
  const apiRoutes = createHttpRoutes(container, authModule)

  const openApiPayload = buildOpenApiDocumentsByDomain({
    title: 'Autocare API',
    version: SERVER_PACKAGE_VERSION,
    description:
      'API documentation for Autocare server endpoints. Generated from Zod contracts in @autocare/shared.',
    serverUrl: '/api',
    serverDescription: 'Primary API base path',
  })
  const openApiDocument = openApiPayload.merged

  maybeDumpOpenApiDocuments(openApiPayload, logger, config.NODE_ENV)

  const swaggerHandler = swaggerUi.setup(openApiDocument)
  app.get('/docs.json', (_req, res) => {
    res.json(openApiDocument)
  })
  app.use('/docs', swaggerLimiter, swaggerUi.serve)
  app.get('/docs', swaggerLimiter, swaggerHandler)
  app.get('/docs/', swaggerLimiter, swaggerHandler)
  app.use('/api/docs', swaggerLimiter, swaggerUi.serve)
  app.get('/api/docs', swaggerLimiter, swaggerHandler)
  app.get('/api/docs/', swaggerLimiter, swaggerHandler)
  app.get('/api/docs.json', (_req, res) => {
    res.json(openApiDocument)
  })
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiDocument)
  })

  app.use(apiRoutes)
  app.use(errorHandler)

  return app
}
