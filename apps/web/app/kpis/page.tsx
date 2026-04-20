'use client'

import { useSpendKpis } from '@autocare/api-client/react'
import { useMemo } from 'react'

const KpisPage = () => {
  const filters = useMemo(() => {
    const to = new Date()
    const from = new Date(to)
    from.setUTCDate(from.getUTCDate() - 90)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: 'month' as const,
    }
  }, [])

  const spend = useSpendKpis(filters)

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Spend KPIs</h1>
      {spend.isLoading ? <p>Loading KPIs…</p> : null}
      {spend.error ? <p>Failed to load KPI data.</p> : null}
      {spend.data ? (
        <>
          <p>Total spend: {spend.data.totals.totalSpend}</p>
          <p>Maintenance spend: {spend.data.totals.maintenanceSpend}</p>
          <p>Fuel spend: {spend.data.totals.fuelSpend}</p>
          <p>Trend delta: {spend.data.advanced.trendDeltaPercent}%</p>
          <p>Forecast next period: {spend.data.advanced.forecastNextPeriodSpend}</p>
          <h2>Category breakdown</h2>
          <ul>
            {spend.data.byCategory.map((entry) => (
              <li key={entry.category}>
                {entry.category}: {entry.spend}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  )
}

export default KpisPage
