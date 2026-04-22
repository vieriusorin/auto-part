import { ApiErrorResponseSchema, successResponseSchema } from '@autocare/shared'
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import type { ZodType, z } from 'zod'
import { apiRegistry } from './registry.js'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type RouteResponseSpec<TData extends ZodType = ZodType> = {
  description: string
  dataSchema?: TData
  schema?: ZodType
}

export type TypedRouteHandler<
  TParams extends ZodType | undefined,
  TQuery extends ZodType | undefined,
  TBody extends ZodType | undefined,
> = (context: {
  req: Request
  res: Response
  next: NextFunction
  params: TParams extends ZodType ? z.infer<TParams> : undefined
  query: TQuery extends ZodType ? z.infer<TQuery> : undefined
  body: TBody extends ZodType ? z.infer<TBody> : undefined
}) => void | Promise<void>

export type RouteDefinition<
  TParams extends ZodType | undefined = undefined,
  TQuery extends ZodType | undefined = undefined,
  TBody extends ZodType | undefined = undefined,
> = {
  method: HttpMethod
  path: string
  tags: readonly string[]
  summary: string
  description?: string
  operationId?: string
  params?: TParams
  query?: TQuery
  body?: TBody
  headers?: ZodType
  responses: Record<number, RouteResponseSpec>
  middlewares?: RequestHandler[]
  handler: TypedRouteHandler<TParams, TQuery, TBody>
}

const expressPathToOpenApi = (path: string): string =>
  path.replace(/:(\w+)/g, (_match, name: string) => `{${name}}`)

const sendValidationError = (res: Response, section: string, issues: unknown): void => {
  res.status(400).json({
    success: false,
    error: {
      code: 'validation_error',
      message: `Invalid request ${section}`,
      details: issues,
    },
  })
}

const createValidationMiddleware = <
  TParams extends ZodType | undefined,
  TQuery extends ZodType | undefined,
  TBody extends ZodType | undefined,
>(
  definition: RouteDefinition<TParams, TQuery, TBody>,
): RequestHandler => {
  return (req, res, next) => {
    if (definition.params) {
      const parsed = definition.params.safeParse(req.params)
      if (!parsed.success) {
        sendValidationError(res, 'params', parsed.error.issues)
        return
      }
      ;(req as Request & { valid?: Record<string, unknown> }).valid = {
        ...((req as Request & { valid?: Record<string, unknown> }).valid ?? {}),
        params: parsed.data,
      }
    }

    if (definition.query) {
      const parsed = definition.query.safeParse(req.query)
      if (!parsed.success) {
        sendValidationError(res, 'query', parsed.error.issues)
        return
      }
      ;(req as Request & { valid?: Record<string, unknown> }).valid = {
        ...((req as Request & { valid?: Record<string, unknown> }).valid ?? {}),
        query: parsed.data,
      }
    }

    if (definition.body) {
      const parsed = definition.body.safeParse(req.body)
      if (!parsed.success) {
        sendValidationError(res, 'body', parsed.error.issues)
        return
      }
      ;(req as Request & { valid?: Record<string, unknown> }).valid = {
        ...((req as Request & { valid?: Record<string, unknown> }).valid ?? {}),
        body: parsed.data,
      }
    }

    next()
  }
}

const buildOpenApiResponses = (
  responses: Record<number, RouteResponseSpec>,
): Record<
  string,
  { description: string; content?: { 'application/json': { schema: ZodType } } }
> => {
  const entries: [
    string,
    { description: string; content?: { 'application/json': { schema: ZodType } } },
  ][] = []

  for (const [status, spec] of Object.entries(responses)) {
    const schema = spec.schema
      ? spec.schema
      : spec.dataSchema
        ? successResponseSchema(spec.dataSchema)
        : undefined

    entries.push([
      status,
      schema
        ? {
            description: spec.description,
            content: {
              'application/json': {
                schema,
              },
            },
          }
        : { description: spec.description },
    ])
  }

  return Object.fromEntries(entries)
}

export const registerRoute = <
  TParams extends ZodType | undefined = undefined,
  TQuery extends ZodType | undefined = undefined,
  TBody extends ZodType | undefined = undefined,
>(
  router: Router,
  basePath: string,
  definition: RouteDefinition<TParams, TQuery, TBody>,
): void => {
  const openApiPath = expressPathToOpenApi(`${basePath}${definition.path}`)

  const requestConfig: Record<string, unknown> = {}

  if (definition.params) {
    requestConfig.params = definition.params
  }
  if (definition.query) {
    requestConfig.query = definition.query
  }
  if (definition.body) {
    requestConfig.body = {
      content: {
        'application/json': {
          schema: definition.body,
        },
      },
    }
  }
  if (definition.headers) {
    requestConfig.headers = definition.headers
  }

  const responses = buildOpenApiResponses({
    ...definition.responses,
    400: definition.responses[400] ?? {
      description: 'Validation error',
      schema: ApiErrorResponseSchema,
    },
  })

  apiRegistry.registerPath({
    method: definition.method,
    path: openApiPath,
    tags: [...definition.tags],
    summary: definition.summary,
    description: definition.description,
    operationId: definition.operationId,
    request: requestConfig as Parameters<typeof apiRegistry.registerPath>[0]['request'],
    responses: responses as Parameters<typeof apiRegistry.registerPath>[0]['responses'],
  })

  const validationMiddleware = createValidationMiddleware(definition)
  const extraMiddlewares = definition.middlewares ?? []

  const wrappedHandler: RequestHandler = async (req, res, next) => {
    try {
      const valid =
        (req as Request & { valid?: { params?: unknown; query?: unknown; body?: unknown } })
          .valid ?? {}
      await definition.handler({
        req,
        res,
        next,
        params: valid.params as TParams extends ZodType ? z.infer<TParams> : undefined,
        query: valid.query as TQuery extends ZodType ? z.infer<TQuery> : undefined,
        body: valid.body as TBody extends ZodType ? z.infer<TBody> : undefined,
      })
    } catch (error) {
      next(error)
    }
  }

  router[definition.method](
    definition.path,
    ...extraMiddlewares,
    validationMiddleware,
    wrappedHandler,
  )
}
