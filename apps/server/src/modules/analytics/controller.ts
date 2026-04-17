import type { Request, Response } from 'express'
import { analyticsPresenter } from '../../presenters/analytics.presenter.js'
import { getDashboardRollups, ingestEventBatch } from './service.js'

export const ingestAnalyticsEventsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : []
    const result = await ingestEventBatch(events)
    analyticsPresenter.presentIngestAccepted(res, result)
  } catch (error) {
    analyticsPresenter.presentIngestError(res, error)
  }
}

export const getAnalyticsDashboardController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const country = typeof req.query.country === 'string' ? req.query.country : undefined
    const platform =
      req.query.platform === 'ios' || req.query.platform === 'android'
        ? req.query.platform
        : undefined
    const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined
    const rows = await getDashboardRollups({ country, platform, channel })
    analyticsPresenter.presentDashboard(res, rows)
  } catch (error) {
    analyticsPresenter.presentDashboardError(res, error)
  }
}
