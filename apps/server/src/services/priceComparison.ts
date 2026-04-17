export type PriceComparisonResult = {
  userPaid: number
  regionalAverage: number
  currency: string
}

export const compareMaintenancePrice = (userPaid: number): PriceComparisonResult => {
  return {
    userPaid,
    regionalAverage: Math.max(1, Math.round(userPaid * 0.8)),
    currency: 'EUR',
  }
}
