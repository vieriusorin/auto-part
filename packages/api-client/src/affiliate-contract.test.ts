import { describe, expectTypeOf, it } from 'vitest'
import type { operations } from './types.gen'

type ListAffiliateOffersSuccess =
  operations['listAffiliateOffers']['responses'][200]['content']['application/json']

type AffiliateOffer =
  ListAffiliateOffersSuccess extends { success: true; data: { items: (infer Item)[] } } ? Item : never

describe('affiliate offers contract typing', () => {
  it('keeps disclosureLabel as canonical sponsored literal', () => {
    const disclosureLabel: AffiliateOffer['disclosureLabel'] = 'Sponsored recommendation'
    expectTypeOf(disclosureLabel).toEqualTypeOf<'Sponsored recommendation'>()
  })
})
