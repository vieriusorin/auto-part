import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { apiRegistry } from './registry.js'

export type OpenApiDocumentOptions = {
  title: string
  version: string
  description: string
  serverUrl: string
  serverDescription?: string
}

export type OpenApiDocumentResult = {
  merged: ReturnType<typeof buildOpenApiDocument>
  /** Keys are kebab-case slugs suitable for filenames (e.g. `vehicles`, `analytics`). */
  byDomain: Record<string, ReturnType<typeof buildOpenApiDocument>>
}

const HTTP_METHODS = ['get', 'put', 'post', 'patch', 'delete', 'options', 'head', 'trace'] as const

/** Maps tag labels like `Vehicles` or `AI` to filename stems (`vehicles`, `ai`). */
export const tagToDomainFileSlug = (tag: string): string => {
  const trimmed = tag.trim()
  if (!trimmed) {
    return 'untagged'
  }
  const words = trimmed.split(/\s+/).map((w) => w.toLowerCase())
  return words.join('-')
}

const UNTAGGED_DOMAIN = 'untagged'

const getFirstTagForPathItem = (pathItem: Record<string, unknown>): string => {
  for (const method of HTTP_METHODS) {
    const op = pathItem[method]
    if (op && typeof op === 'object' && op !== null && 'tags' in op) {
      const tags = (op as { tags?: string[] }).tags
      if (tags && tags.length > 0 && typeof tags[0] === 'string' && tags[0].trim()) {
        return tagToDomainFileSlug(tags[0])
      }
    }
  }
  return UNTAGGED_DOMAIN
}

export const buildOpenApiDocument = (options: OpenApiDocumentOptions) => {
  const generator = new OpenApiGeneratorV31(apiRegistry.definitions)

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: options.title,
      version: options.version,
      description: options.description,
    },
    servers: [
      {
        url: options.serverUrl,
        description: options.serverDescription ?? 'Primary API base path',
      },
    ],
  })
}

/**
 * Builds the full merged OpenAPI document plus one partial document per domain.
 * Each path is assigned to a domain using the first tag on the first operation
 * (HTTP methods ordered: get, put, post, patch, delete, options, head, trace).
 */
export const buildOpenApiDocumentsByDomain = (
  options: OpenApiDocumentOptions,
): OpenApiDocumentResult => {
  const merged = buildOpenApiDocument(options)
  const paths = merged.paths
  if (!paths || typeof paths !== 'object') {
    return { merged, byDomain: {} }
  }

  const buckets: Record<string, Record<string, (typeof paths)[string]>> = {}

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue
    }
    const pathItemRecord = pathItem as Record<string, unknown>
    const domain = getFirstTagForPathItem(pathItemRecord)
    if (!buckets[domain]) {
      buckets[domain] = {}
    }
    buckets[domain][pathKey] = pathItem as (typeof paths)[string]
  }

  const byDomain: Record<string, ReturnType<typeof buildOpenApiDocument>> = {}
  for (const [slug, domainPaths] of Object.entries(buckets)) {
    const label = slug === UNTAGGED_DOMAIN ? 'Untagged' : slug
    byDomain[slug] = {
      ...merged,
      info: {
        ...merged.info,
        title: `${options.title} – ${label}`,
      },
      paths: domainPaths,
    }
  }

  return { merged, byDomain }
}
