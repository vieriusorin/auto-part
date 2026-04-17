import { beforeEach, describe, expect, it } from 'vitest'
import { createConsent, resetConsentStore } from '../consent-service.js'
import { createDeleteJob, createExportJob, getTrustBundle } from '../export-delete-jobs.js'

describe('consent export and delete', () => {
  beforeEach(async () => {
    await resetConsentStore()
  })

  it('exports trust data and creates delete jobs', async () => {
    await createConsent({
      userId: 'u-1',
      consentType: 'analytics',
      legalBasis: 'consent',
      policyVersion: 'v1',
      source: 'app',
      requestId: 'req-1',
    })

    const exportJob = await createExportJob({ userId: 'u-1', requestId: 'req-export' })
    const deleteJob = await createDeleteJob({ userId: 'u-1', requestId: 'req-delete' })
    const bundle = await getTrustBundle('u-1')

    expect(exportJob.status).toBe('accepted')
    expect(deleteJob.status).toBe('accepted')
    expect(bundle.consents).toHaveLength(1)
  })
})
