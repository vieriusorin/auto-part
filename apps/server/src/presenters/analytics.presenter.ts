import type { Response } from 'express'
import { BasePresenter } from './base/base-presenter.js'

type DashboardRow = {
  date: string
  country: string
  platform: string
  channel: string
  activationCount: number
  d1Retained: number
  d7Retained: number
  d30Retained: number
  wau: number
  mau: number
  maintenanceActionsCompleted: number
}

type IngestResult = {
  acceptedCount: number
  rejectedCount: number
  persisted: unknown[]
}

class AnalyticsPresenter extends BasePresenter {
  presentIngestAccepted(res: Response, payload: IngestResult) {
    return this.accepted(res, payload)
  }

  presentDashboard(res: Response, items: DashboardRow[]) {
    return this.ok(res, { items })
  }

  presentIngestError(res: Response, cause: unknown) {
    return this.error(res, 500, 'analytics_ingest_failed', 'Failed to ingest analytics events', {
      cause: String(cause),
    })
  }

  presentDashboardError(res: Response, cause: unknown) {
    return this.error(
      res,
      500,
      'analytics_dashboard_failed',
      'Failed to fetch analytics dashboard',
      {
        cause: String(cause),
      },
    )
  }
}

export const analyticsPresenter = new AnalyticsPresenter()
