import type { Request, Response } from 'express'
import { getDashboardRollups, ingestEventBatch } from './service.js'

export const ingestAnalyticsEventsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const events = Array.isArray(req.body?.events) ? req.body.events : []
  const result = await ingestEventBatch(events)
  res.status(202).json(result)
}

export const getAnalyticsDashboardController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const country = typeof req.query.country === 'string' ? req.query.country : undefined
  const platform =
    req.query.platform === 'ios' || req.query.platform === 'android'
      ? req.query.platform
      : undefined
  const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined
  const rows = await getDashboardRollups({ country, platform, channel })
  res.status(200).json({ items: rows })
}
