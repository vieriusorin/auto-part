import type { SpendKpiGranularity, SpendKpisQuery, SpendKpisResponseData } from '@autocare/shared'
import type { MaintenanceLogRow } from '../../vehicles/infrastructure/vehicle-repository.js'

const toMillis = (date: Date): number => date.getTime()

const getPeriodStart = (date: Date, granularity: SpendKpiGranularity): Date => {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  if (granularity === 'day') {
    return d
  }
  if (granularity === 'week') {
    const day = d.getUTCDay()
    const distanceToMonday = (day + 6) % 7
    d.setUTCDate(d.getUTCDate() - distanceToMonday)
    return d
  }
  d.setUTCDate(1)
  return d
}

const sumSpend = (rows: MaintenanceLogRow[]): number =>
  rows.reduce((sum, row) => sum + (row.totalCost ?? 0), 0)

const computeTrendDeltaPercent = (current: number, previous: number): number => {
  if (previous <= 0) {
    return current > 0 ? 100 : 0
  }
  return Number((((current - previous) / previous) * 100).toFixed(2))
}

const detectAnomalies = (
  periodRows: Array<{ periodStart: string; spend: number }>,
): SpendKpisResponseData['advanced']['anomalies'] => {
  if (periodRows.length === 0) return []
  const values = periodRows.map((row) => row.spend)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const threshold = mean * 1.6
  return periodRows
    .filter((row) => row.spend > threshold && threshold > 0)
    .map((row) => ({
      periodStart: row.periodStart,
      spend: row.spend,
      threshold,
      reason: 'spend_above_threshold',
    }))
}

const groupByPeriod = (rows: MaintenanceLogRow[], granularity: SpendKpiGranularity) => {
  const byPeriod = new Map<string, number>()
  for (const row of rows) {
    const periodStart = getPeriodStart(row.date, granularity).toISOString()
    byPeriod.set(periodStart, (byPeriod.get(periodStart) ?? 0) + (row.totalCost ?? 0))
  }
  return Array.from(byPeriod.entries())
    .map(([periodStart, spend]) => ({ periodStart, spend }))
    .sort((a, b) => (a.periodStart < b.periodStart ? -1 : 1))
}

export const buildSpendKpis = ({
  query,
  currentRows,
  previousRows,
}: {
  query: SpendKpisQuery
  currentRows: MaintenanceLogRow[]
  previousRows: MaintenanceLogRow[]
}): SpendKpisResponseData => {
  const byPeriod = groupByPeriod(currentRows, query.granularity)

  const byCategory = Array.from(
    currentRows.reduce<Map<string, number>>((acc, row) => {
      const key = row.category
      acc.set(key, (acc.get(key) ?? 0) + (row.totalCost ?? 0))
      return acc
    }, new Map()),
  )
    .map(([category, spend]) => ({ category, spend }))
    .sort((a, b) => b.spend - a.spend)

  const byVehicle = Array.from(
    currentRows.reduce<Map<string, number>>((acc, row) => {
      const key = row.vehicleId
      acc.set(key, (acc.get(key) ?? 0) + (row.totalCost ?? 0))
      return acc
    }, new Map()),
  )
    .map(([vehicleId, spend]) => ({ vehicleId, spend }))
    .sort((a, b) => b.spend - a.spend)

  const currentTotal = sumSpend(currentRows)
  const previousTotal = sumSpend(previousRows)
  const forecastNextPeriodSpend =
    byPeriod.length === 0
      ? currentTotal
      : Number((byPeriod.reduce((sum, row) => sum + row.spend, 0) / byPeriod.length).toFixed(2))

  return {
    range: {
      from: query.from,
      to: query.to,
      granularity: query.granularity,
    },
    totals: {
      totalSpend: currentTotal,
      maintenanceSpend: currentTotal,
      fuelSpend: 0,
    },
    byPeriod,
    byCategory,
    byVehicle,
    advanced: {
      trendDeltaPercent: computeTrendDeltaPercent(currentTotal, previousTotal),
      forecastNextPeriodSpend,
      anomalies: detectAnomalies(byPeriod),
    },
  }
}

export const computePreviousWindow = (query: SpendKpisQuery): { from: Date; to: Date } => {
  const from = new Date(query.from)
  const to = new Date(query.to)
  const durationMs = Math.max(1, toMillis(to) - toMillis(from))
  const previousTo = new Date(from.getTime() - 1)
  const previousFrom = new Date(previousTo.getTime() - durationMs)
  return { from: previousFrom, to: previousTo }
}
