import { beforeEach, describe, expect, it } from 'vitest'
import {
  appendTrustAuditEvent,
  listTrustAuditEvents,
  resetTrustAuditStore,
} from '../audit-service.js'

describe('audit append only', () => {
  beforeEach(async () => {
    await resetTrustAuditStore()
  })

  it('appends audit records with metadata', async () => {
    await appendTrustAuditEvent({
      actorType: 'user',
      actorId: 'u-1',
      action: 'consent.granted',
      resourceType: 'consent',
      resourceId: 'analytics',
      requestId: 'req-1',
      source: 'api',
      reasonCode: null,
    })

    const items = await listTrustAuditEvents()
    expect(items).toHaveLength(1)
    expect(items[0]?.requestId).toBe('req-1')
  })
})
