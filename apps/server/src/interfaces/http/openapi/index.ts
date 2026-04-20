export type { OpenApiDocumentOptions, OpenApiDocumentResult } from './build-document.js'
export {
  buildOpenApiDocument,
  buildOpenApiDocumentsByDomain,
  tagToDomainFileSlug,
} from './build-document.js'
export type { RouteDefinition, RouteResponseSpec, TypedRouteHandler } from './register-route.js'
export { registerRoute } from './register-route.js'
export { apiRegistry } from './registry.js'
