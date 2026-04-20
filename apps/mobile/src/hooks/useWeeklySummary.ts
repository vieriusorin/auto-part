import { useWeeklySummary as useWeeklySummaryQuery } from '@autocare/api-client/react'

export type WeeklySummary = {
  spent: number
  nextServiceInDays: number
  issuesDetected: number
}

const fallback: WeeklySummary = {
  spent: 0,
  nextServiceInDays: 30,
  issuesDetected: 0,
}

export const useWeeklySummary = (userId: string): WeeklySummary => {
  const query = useWeeklySummaryQuery(userId, { enabled: userId.length > 0 })
  return query.data ?? fallback
}
