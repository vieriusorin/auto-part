import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { listTrustAuditEvents, resetTrustAuditStore } from '../audit-service.js'
import {
  createConsentController,
  deleteConsentDataController,
  exportConsentDataController,
  revokeConsentController,
} from '../consent-controller.js'
import { listConsentsForUser, resetConsentStore } from '../consent-service.js'

describe('consent routes', () => {
  const app = express()
  app.use(express.json())
  app.post('/api/v1/consent', createConsentController)
  app.post('/api/v1/consent/revoke', revokeConsentController)
  app.post('/api/v1/consent/export', exportConsentDataController)
  app.post('/api/v1/consent/delete', deleteConsentDataController)

  beforeEach(async () => {
    await resetConsentStore()
    await resetTrustAuditStore()
  })

  it('mounts consent create/revoke/export/delete API routes', async () => {
    const payload = {
      userId: 'u-route',
      consentType: 'analytics',
      legalBasis: 'consent',
      policyVersion: 'v1',
      source: 'api',
      requestId: 'req-create',
    }

    const createResponse = await request(app).post('/api/v1/consent').send(payload)
    const revokeResponse = await request(app)
      .post('/api/v1/consent/revoke')
      .send({ ...payload, requestId: 'req-revoke' })
    const exportResponse = await request(app)
      .post('/api/v1/consent/export')
      .send({ userId: payload.userId, requestId: 'req-export' })
    const deleteResponse = await request(app)
      .post('/api/v1/consent/delete')
      .send({ userId: payload.userId, requestId: 'req-delete' })

    expect(createResponse.status).toBe(201)
    expect(revokeResponse.status).toBe(202)
    expect(exportResponse.status).toBe(202)
    expect(deleteResponse.status).toBe(202)

    const consentRows = await listConsentsForUser(payload.userId)
    const auditRows = await listTrustAuditEvents()

    expect(consentRows).toHaveLength(2)
    expect(consentRows.map((entry) => entry.status)).toEqual(['granted', 'revoked'])
    expect(auditRows.some((entry) => entry.action === 'consent.granted')).toBe(true)
    expect(auditRows.some((entry) => entry.action === 'consent.revoked')).toBe(true)
    expect(auditRows.some((entry) => entry.action === 'consent.export')).toBe(true)
    expect(auditRows.some((entry) => entry.action === 'consent.delete')).toBe(true)
  })
})
