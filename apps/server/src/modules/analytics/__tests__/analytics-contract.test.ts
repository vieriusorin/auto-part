import { describe, expect, it } from 'vitest'
import { clearRawEvents } from '../repository.js'
import { ingestEventBatch } from '../service.js'

describe('analytics contract', () => {
  it('rejects events missing required fields', async () => {
    await clearRawEvents()
    const result = await ingestEventBatch([
      {
        event_id: 'evt-1',
        event_name: 'vehicle.created',
      },
    ])

    expect(result.rejectedCount).toBe(1)
    expect(result.acceptedCount).toBe(0)
  })

  it('normalizes segments and accepts valid events', async () => {
    await clearRawEvents()
    const result = await ingestEventBatch([
      {
        event_id: 'evt-2',
        event_name: 'maintenance_item.created',
        occurred_at_client: '2026-04-17T12:00:00.000Z',
        session_id: 's-1',
        device_id: 'd-1',
        platform: 'Android',
        country: 'ro',
        channel: '  ads  ',
        app_version: '1.0.0',
        schema_version: 1,
      },
    ])

    expect(result.rejectedCount).toBe(0)
    expect(result.acceptedCount).toBe(1)
    expect(result.persisted[0]?.platform).toBe('android')
    expect(result.persisted[0]?.country).toBe('RO')
    expect(result.persisted[0]?.channel).toBe('ads')
  })
})
