import { describe, expect, it } from 'vitest'
import {
  buildAffiliateClickInput,
  buildAffiliateComplaintInput,
  buildAffiliateOpenOfferAccessibilityLabel,
  buildAffiliateReportOfferAccessibilityLabel,
  shouldShowNoAffiliateOffersMessage,
} from './affiliate-offers'

describe('affiliate offers helpers', () => {
  it('shows no-offers message only when loading is complete and list is empty', () => {
    expect(shouldShowNoAffiliateOffersMessage(true, 0)).toBe(false)
    expect(shouldShowNoAffiliateOffersMessage(false, 0)).toBe(true)
    expect(shouldShowNoAffiliateOffersMessage(false, 2)).toBe(false)
  })

  it('builds click tracking payload with disclosure and consent enabled', () => {
    expect(
      buildAffiliateClickInput({
        id: 'offer-1',
        intentSurface: 'maintenance_due',
        partnerName: 'Partner',
      }),
    ).toEqual({
      offerId: 'offer-1',
      intentSurface: 'maintenance_due',
      disclosed: true,
      consentGranted: true,
    })
  })

  it('builds complaint payload tied to the selected offer', () => {
    expect(
      buildAffiliateComplaintInput({
        id: 'offer-2',
        intentSurface: 'cost_anomaly_detected',
        partnerName: 'Partner',
      }),
    ).toEqual({
      reason: 'Hidden sponsorship concern',
      offerId: 'offer-2',
      intentSurface: 'cost_anomaly_detected',
      disclosureVisible: true,
    })
  })

  it('builds descriptive accessibility labels for offer actions', () => {
    expect(buildAffiliateOpenOfferAccessibilityLabel('Trusted Garage')).toBe(
      'Open sponsored offer from Trusted Garage',
    )
    expect(buildAffiliateReportOfferAccessibilityLabel('Trusted Garage')).toBe(
      'Report this sponsored offer from Trusted Garage',
    )
  })
})
