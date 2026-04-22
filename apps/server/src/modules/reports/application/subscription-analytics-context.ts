import { randomUUID } from 'node:crypto'
import type { Request } from 'express'
import { normalizePlatform } from '../../analytics/schemas.js'

export type SubscriptionAnalyticsContext = {
  platform: 'ios' | 'android'
  country: string
  channel: string
  appVersion: string
  sessionId: string
  deviceId: string
}

export const buildSubscriptionAnalyticsContext = (req: Request): SubscriptionAnalyticsContext => {
  const platformHeader = req.header('X-Platform')
  const fallbackPlatform = req.header('X-Client') === 'mobile' ? 'ios' : 'android'
  let platform: 'ios' | 'android' = fallbackPlatform
  if (platformHeader) {
    try {
      platform = normalizePlatform(platformHeader)
    } catch {
      platform = fallbackPlatform
    }
  }

  const rawCountry = (req.header('X-Country') ?? '').trim().toUpperCase()
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : 'XX'

  const channel = (req.header('X-Channel') ?? '').trim().slice(0, 64) || 'organic'
  const appVersion = (req.header('X-App-Version') ?? '').trim().slice(0, 32) || 'server'
  const rawSessionId = (req.header('X-Session-Id') ?? '').trim()
  const rawDeviceId = (req.header('X-Device-Id') ?? '').trim()
  const sessionId = rawSessionId.slice(0, 128) || randomUUID()
  const deviceId = rawDeviceId.slice(0, 128) || 'server-derived'

  return {
    platform,
    country,
    channel,
    appVersion,
    sessionId,
    deviceId,
  }
}
