export const adConfig = {
  bannerEnabled: true,
  interstitialCooldownMs: 3 * 60 * 1000,
}

export type Entitlement = 'free' | 'pro' | 'family'

export const isAdFree = (entitlement: Entitlement): boolean => {
  return entitlement !== 'free'
}
