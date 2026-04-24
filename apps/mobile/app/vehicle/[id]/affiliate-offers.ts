type AffiliateIntentSurface = 'maintenance_due' | 'service_report_ready' | 'cost_anomaly_detected'

type AffiliateOffer = {
  id: string
  intentSurface: AffiliateIntentSurface
  partnerName: string
}

export const shouldShowNoAffiliateOffersMessage = (isLoading: boolean, offerCount: number): boolean =>
  !isLoading && offerCount === 0

export const buildAffiliateClickInput = (offer: AffiliateOffer) => ({
  offerId: offer.id,
  intentSurface: offer.intentSurface,
  disclosed: true,
  consentGranted: true,
})

export const buildAffiliateComplaintInput = (offer: AffiliateOffer) => ({
  reason: 'Hidden sponsorship concern',
  offerId: offer.id,
  intentSurface: offer.intentSurface,
  disclosureVisible: true,
})

export const buildAffiliateOpenOfferAccessibilityLabel = (partnerName: string): string =>
  `Open sponsored offer from ${partnerName}`

export const buildAffiliateReportOfferAccessibilityLabel = (partnerName: string): string =>
  `Report this sponsored offer from ${partnerName}`
