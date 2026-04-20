import { Router } from 'express'
import {
  ConsentEntrySchema,
  ConsentInputSchema,
  ConsentJobInputSchema,
  ConsentJobSchema,
} from '@autocare/shared'
import {
  createConsentController,
  deleteConsentDataController,
  exportConsentDataController,
  revokeConsentController,
} from '../../consent-controller.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'

const CONSENT_TAG = 'Consent'

export const createTrustRouter = (): Router => {
  const router = Router()

  registerRoute(router, '/api', {
    method: 'post',
    path: '/v1/consent',
    tags: [CONSENT_TAG],
    summary: 'Create consent',
    operationId: 'createConsent',
    body: ConsentInputSchema,
    responses: {
      200: {
        description: 'Consent created',
        dataSchema: ConsentEntrySchema,
      },
    },
    handler: async ({ req, res }) => {
      await createConsentController(req, res)
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/v1/consent/revoke',
    tags: [CONSENT_TAG],
    summary: 'Revoke consent',
    operationId: 'revokeConsent',
    body: ConsentInputSchema,
    responses: {
      200: {
        description: 'Consent revoked',
        dataSchema: ConsentEntrySchema,
      },
    },
    handler: async ({ req, res }) => {
      await revokeConsentController(req, res)
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/v1/consent/export',
    tags: [CONSENT_TAG],
    summary: 'Export consent data',
    operationId: 'exportConsentData',
    body: ConsentJobInputSchema,
    responses: {
      200: {
        description: 'Export job accepted',
        dataSchema: ConsentJobSchema,
      },
    },
    handler: async ({ req, res }) => {
      await exportConsentDataController(req, res)
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/v1/consent/delete',
    tags: [CONSENT_TAG],
    summary: 'Delete consent data',
    operationId: 'deleteConsentData',
    body: ConsentJobInputSchema,
    responses: {
      200: {
        description: 'Delete job accepted',
        dataSchema: ConsentJobSchema,
      },
    },
    handler: async ({ req, res }) => {
      await deleteConsentDataController(req, res)
    },
  })

  return router
}
