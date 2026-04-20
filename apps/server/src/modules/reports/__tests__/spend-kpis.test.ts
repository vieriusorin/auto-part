import { describe, expect, it } from 'vitest'
import type { SpendKpisQuery } from '@autocare/shared'
import { buildSpendKpis, computePreviousWindow } from '../application/spend-kpis.js'
import type { MaintenanceLogRow } from '../../vehicles/infrastructure/vehicle-repository.js'

const row = (input: {
  id: string
  vehicleId: string
  category: string
  totalCost: number
  date: string
}): MaintenanceLogRow =>
  ({
    id: input.id,
    vehicleId: input.vehicleId,
    category: input.category,
    totalCost: input.totalCost,
    date: new Date(input.date),
  }) as unknown as MaintenanceLogRow

describe('spend kpis service', () => {
  it('builds totals and grouped series', () => {
    const query: SpendKpisQuery = {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
      granularity: 'week',
      categories: undefined,
      vehicleIds: undefined,
    }
    const currentRows = [
      row({
        id: '1',
        vehicleId: '11111111-1111-4111-8111-111111111111',
        category: 'oil',
        totalCost: 100,
        date: '2026-01-02T10:00:00.000Z',
      }),
      row({
        id: '2',
        vehicleId: '22222222-2222-4222-8222-222222222222',
        category: 'tires',
        totalCost: 300,
        date: '2026-01-12T10:00:00.000Z',
      }),
    ]
    const previousRows = [
      row({
        id: '3',
        vehicleId: '11111111-1111-4111-8111-111111111111',
        category: 'oil',
        totalCost: 200,
        date: '2025-12-18T10:00:00.000Z',
      }),
    ]

    const result = buildSpendKpis({ query, currentRows, previousRows })
    expect(result.totals.totalSpend).toBe(400)
    expect(result.byCategory).toHaveLength(2)
    expect(result.byVehicle).toHaveLength(2)
    expect(result.byPeriod.length).toBeGreaterThan(0)
    expect(result.advanced.trendDeltaPercent).toBe(100)
  })

  it('computes previous window from query range', () => {
    const query: SpendKpisQuery = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T00:00:00.000Z',
      granularity: 'month',
      categories: undefined,
      vehicleIds: undefined,
    }
    const previous = computePreviousWindow(query)
    expect(previous.to.getTime()).toBeLessThan(new Date(query.from).getTime())
    expect(previous.from.getTime()).toBeLessThan(previous.to.getTime())
  })
})
