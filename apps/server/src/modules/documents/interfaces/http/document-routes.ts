import { Router } from 'express'
import { z } from 'zod'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import type { AuthModule } from '../../../auth/auth-module.js'
import {
  createAuthHttpGuards,
  type AuthHttpGuards,
} from '../../../auth/interfaces/http/auth-http-guards.js'
import { createUserAccessScope } from '../../../auth/application/access-scope.js'
import type { DocumentRole } from '../../../auth/application/document-abac.js'
import { createDocumentRepository } from '../../infrastructure/document-repository.js'

const DOCUMENTS_TAG = 'Documents'

const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isLocked: z.boolean().optional(),
  creatorId: z.string().optional(),
  lastEditedById: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

const ListDocumentsResponseSchema = z.object({
  items: z.array(DocumentResponseSchema),
})

const CreateDocumentBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isLocked: z.boolean().optional(),
})

const UpdateDocumentBodySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isLocked: z.boolean().optional(),
})

const DocumentIdParamsSchema = z.object({
  id: z.string().uuid(),
})

const mapRole = (authModuleRole: 'user' | 'admin', orgRole: string | undefined): DocumentRole => {
  if (authModuleRole === 'admin') return 'admin'
  if (orgRole === 'owner' || orgRole === 'admin') return 'admin'
  if (orgRole === 'manager') return 'editor'
  if (orgRole === 'driver') return 'author'
  return 'viewer'
}

export const createDocumentRouter = (authModule: AuthModule, guards?: AuthHttpGuards): Router => {
  const router = Router()
  const authGuards = guards ?? createAuthHttpGuards(authModule)
  const requireAuth = authGuards.requireAuth
  const repo = createDocumentRepository(authModule.db)

  registerRoute(router, '/api', {
    method: 'get',
    path: '/documents',
    tags: [DOCUMENTS_TAG],
    summary: 'List documents with field-level ABAC filtering',
    operationId: 'listDocuments',
    middlewares: [requireAuth],
    responses: {
      200: { description: 'Documents list', dataSchema: ListDocumentsResponseSchema },
    },
    handler: async ({ req, res }) => {
      if (!req.user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const user = await authModule.users.findById(req.user.id)
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const role = mapRole(user.role, user.organizationRole)
      const scope = createUserAccessScope(user)
      const items = await repo.listForRead(role, scope, authModule.clock.now())
      commonPresenter.ok(res, { items })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/documents',
    tags: [DOCUMENTS_TAG],
    summary: 'Create document with ABAC write filtering',
    operationId: 'createDocument',
    middlewares: [requireAuth],
    body: CreateDocumentBodySchema,
    responses: {
      201: { description: 'Document created', dataSchema: DocumentResponseSchema },
    },
    handler: async ({ req, res, body }) => {
      if (!req.user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const user = await authModule.users.findById(req.user.id)
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const role = mapRole(user.role, user.organizationRole)
      const scope = createUserAccessScope(user)
      const created = await repo.create(role, scope, authModule.clock.now(), body ?? {})
      if (!created) {
        commonPresenter.error(res, 403, 'forbidden_permission', 'Document create not allowed')
        return
      }
      commonPresenter.created(res, created)
    },
  })

  registerRoute(router, '/api', {
    method: 'patch',
    path: '/documents/:id',
    tags: [DOCUMENTS_TAG],
    summary: 'Update document with field-level ABAC and weekend rules',
    operationId: 'updateDocument',
    middlewares: [requireAuth],
    params: DocumentIdParamsSchema,
    body: UpdateDocumentBodySchema,
    responses: {
      200: { description: 'Document updated', dataSchema: DocumentResponseSchema },
    },
    handler: async ({ req, res, body, params }) => {
      if (!req.user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const user = await authModule.users.findById(req.user.id)
      if (!user) {
        commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
        return
      }
      const role = mapRole(user.role, user.organizationRole)
      const scope = createUserAccessScope(user)
      if (!params) {
        commonPresenter.error(res, 400, 'validation_error', 'Invalid route params')
        return
      }
      const updated = await repo.update(role, scope, authModule.clock.now(), params.id, body ?? {})
      if (!updated) {
        commonPresenter.error(res, 403, 'forbidden_permission', 'Document update not allowed')
        return
      }
      commonPresenter.ok(res, updated)
    },
  })

  return router
}

