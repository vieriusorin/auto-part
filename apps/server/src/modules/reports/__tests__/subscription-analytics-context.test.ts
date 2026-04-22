import { describe, expect, it } from 'vitest'
import type { Request } from 'express'
import { buildSubscriptionAnalyticsContext } from '../application/subscription-analytics-context.js'

const makeRequest = (headers: Record<string, string | undefined>): Request =>
  ({
    header: (name: string) => headers[name] ?? headers[name.toLowerCase()],
  }) as Request

describe('buildSubscriptionAnalyticsContext', () => {
  it('uses request analytics headers when valid', () => {
    const req = makeRequest({
      'X-Client': 'mobile',
      'X-Platform': 'ios',
      'X-Country': 'ro',
      'X-Channel': 'referral',
      'X-App-Version': '1.2.3',
      'X-Session-Id': 'session-1',
      'X-Device-Id': 'device-1',
    })

    const context = buildSubscriptionAnalyticsContext(req)
    expect(context.platform).toBe('ios')
    expect(context.country).toBe('RO')
    expect(context.channel).toBe('referral')
    expect(context.appVersion).toBe('1.2.3')
    expect(context.sessionId).toBe('session-1')
    expect(context.deviceId).toBe('device-1')
  })

  it('falls back safely for invalid or oversized header values', () => {
    const req = makeRequest({
      'X-Client': 'mobile',
      'X-Platform': 'invalid-platform',
      'X-Country': 'romania',
      'X-Channel': 'x'.repeat(90),
      'X-App-Version': 'v'.repeat(90),
      'X-Session-Id': 's'.repeat(180),
      'X-Device-Id': 'd'.repeat(180),
    })

    const context = buildSubscriptionAnalyticsContext(req)
    expect(context.platform).toBe('ios')
    expect(context.country).toBe('XX')
    expect(context.channel.length).toBe(64)
    expect(context.appVersion.length).toBe(32)
    expect(context.sessionId.length).toBe(128)
    expect(context.deviceId.length).toBe(128)
  })

  it('uses defaults when analytics headers are missing', () => {
    const req = makeRequest({})

    const context = buildSubscriptionAnalyticsContext(req)
    expect(context.platform).toBe('android')
    expect(context.country).toBe('XX')
    expect(context.channel).toBe('organic')
    expect(context.appVersion).toBe('server')
    expect(context.sessionId.length).toBeGreaterThan(0)
    expect(context.deviceId).toBe('server-derived')
  })
})
