import { beforeEach, describe, expect, it } from 'vitest'
import {
  createConsent,
  listConsentsForUser,
  resetConsentStore,
  revokeConsent,
} from '../consent-service.js'

describe('consent lifecycle', () => {
  beforeEach(async () => {
    await resetConsentStore()
  })

  it('creates and revokes consent through append-only entries', async () => {
    await createConsent({
      userId: 'u-1',
      consentType: 'analytics',
      legalBasis: 'consent',
      policyVersion: 'v1',
      source: 'app',
      requestId: 'req-1',
    })
    await revokeConsent({
      userId: 'u-1',
      consentType: 'analytics',
      legalBasis: 'consent',
      policyVersion: 'v1',
      source: 'app',
      requestId: 'req-2',
    })

    const entries = await listConsentsForUser('u-1')
    expect(entries).toHaveLength(2)
    expect(entries.map((entry) => entry.status)).toEqual(['granted', 'revoked'])
  })
})
