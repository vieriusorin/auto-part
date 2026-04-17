import { beforeEach, describe, expect, it } from 'vitest'
import { listTrustAuditEvents, resetTrustAuditStore } from '../audit-service.js'
import { emitTrustDenialAudit } from '../denial-audit-emitter.js'

describe('trust policy audit', () => {
  beforeEach(async () => {
    await resetTrustAuditStore()
  })

  it('emits reason coded audit record on denial', async () => {
    await emitTrustDenialAudit({
      actorId: 'u-1',
      resourceId: 'maintenance-1',
      reasonCode: 'LOCK_OVERRIDE_REQUIRED',
      requestId: 'req-1',
    })

    const rows = await listTrustAuditEvents()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.reasonCode).toBe('LOCK_OVERRIDE_REQUIRED')
  })
})
