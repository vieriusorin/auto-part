import { describe, expect, it } from 'vitest'
import { computeRollups } from '../rollups.js'

describe('analytics rollups', () => {
  it('computes activation from three required events in 24h', () => {
    const rollup = computeRollups([
      {
        userId: 'u-1',
        eventName: 'vehicle.created',
        receivedAtServer: '2026-04-17T10:00:00.000Z',
        country: 'RO',
        platform: 'android',
        channel: 'ads',
      },
      {
        userId: 'u-1',
        eventName: 'maintenance_item.created',
        receivedAtServer: '2026-04-17T10:05:00.000Z',
        country: 'RO',
        platform: 'android',
        channel: 'ads',
      },
      {
        userId: 'u-1',
        eventName: 'reminder.created',
        receivedAtServer: '2026-04-17T10:10:00.000Z',
        country: 'RO',
        platform: 'android',
        channel: 'ads',
      },
    ])

    expect(rollup.activationCount).toBe(1)
    expect(rollup.dailyRollups.length).toBeGreaterThan(0)
  })
})
