import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { getAnalyticsDashboardController, ingestAnalyticsEventsController } from '../controller.js'
import { clearRawEvents } from '../repository.js'

describe('analytics acceptance wiring', () => {
  const app = express()
  app.use(express.json())
  app.post('/api/v1/events/batch', ingestAnalyticsEventsController)
  app.get('/api/v1/analytics/dashboard', getAnalyticsDashboardController)

  beforeEach(async () => {
    await clearRawEvents()
  })

  it('persists ingest path and serves segmented dashboard rows', async () => {
    const batchResponse = await request(app)
      .post('/api/v1/events/batch')
      .send({
        events: [
          {
            event_id: 'evt-a1',
            event_name: 'vehicle.created',
            occurred_at_client: '2026-04-01T10:00:00.000Z',
            session_id: 's-1',
            device_id: 'd-1',
            platform: 'android',
            country: 'ro',
            channel: 'organic',
            app_version: '1.0.0',
            schema_version: 1,
            user_id: 'u-1',
          },
          {
            event_id: 'evt-a2',
            event_name: 'maintenance_item.created',
            occurred_at_client: '2026-04-01T10:01:00.000Z',
            session_id: 's-1',
            device_id: 'd-1',
            platform: 'android',
            country: 'ro',
            channel: 'organic',
            app_version: '1.0.0',
            schema_version: 1,
            user_id: 'u-1',
          },
          {
            event_id: 'evt-a3',
            event_name: 'reminder.created',
            occurred_at_client: '2026-04-01T10:02:00.000Z',
            session_id: 's-1',
            device_id: 'd-1',
            platform: 'android',
            country: 'ro',
            channel: 'organic',
            app_version: '1.0.0',
            schema_version: 1,
            user_id: 'u-1',
          },
          {
            event_id: 'evt-a4',
            event_name: 'maintenance_action.completed',
            occurred_at_client: '2026-04-01T10:05:00.000Z',
            session_id: 's-1',
            device_id: 'd-1',
            platform: 'android',
            country: 'ro',
            channel: 'organic',
            app_version: '1.0.0',
            schema_version: 1,
            user_id: 'u-1',
          },
          {
            event_id: 'evt-a5',
            event_name: 'onboarding.started',
            occurred_at_client: '2026-04-02T11:00:00.000Z',
            session_id: 's-2',
            device_id: 'd-2',
            platform: 'ios',
            country: 'de',
            channel: 'ads',
            app_version: '1.0.0',
            schema_version: 1,
            user_id: 'u-2',
          },
          {
            event_id: 'evt-a6',
            event_name: 'onboarding.completed',
            occurred_at_client: '2026-04-09T11:00:00.000Z',
            session_id: 's-2',
            device_id: 'd-2',
            platform: 'ios',
            country: 'de',
            channel: 'ads',
            app_version: '1.0.0',
            schema_version: 1,
            user_id: 'u-2',
          },
        ],
      })

    const dashboardResponse = await request(app).get('/api/v1/analytics/dashboard').query({
      country: 'RO',
      platform: 'android',
      channel: 'organic',
    })

    expect(batchResponse.status).toBe(202)
    expect(dashboardResponse.status).toBe(200)
    type RoRow = { activationCount: number; maintenanceActionsCompleted: number }
    const roItems = dashboardResponse.body.data?.items as RoRow[] | undefined
    expect(Array.isArray(roItems)).toBe(true)
    expect(roItems!.length).toBeGreaterThan(0)
    expect(
      roItems!.some((item) => item.activationCount > 0 && item.maintenanceActionsCompleted > 0),
    ).toBe(true)

    const iosAdsRows = await request(app).get('/api/v1/analytics/dashboard').query({
      country: 'DE',
      platform: 'ios',
      channel: 'ads',
    })
    expect(iosAdsRows.status).toBe(200)
    type DeRow = { d7Retained: number; wau: number; mau: number }
    const deItems = iosAdsRows.body.data?.items as DeRow[] | undefined
    expect(deItems!.length).toBeGreaterThan(0)
    expect(deItems!.some((item) => item.d7Retained > 0 && item.wau > 0 && item.mau > 0)).toBe(true)
  })
})
