import { createHash, randomUUID } from 'node:crypto'
import type { Express } from 'express'
import { Router } from 'express'
import { requirePermission } from '../middleware/permission.js'
import {
  getAnalyticsDashboardController,
  ingestAnalyticsEventsController,
} from '../modules/analytics/controller.js'
import {
  createConsentController,
  deleteConsentDataController,
  exportConsentDataController,
  revokeConsentController,
} from '../modules/trust/consent-controller.js'
import { enforceTrustPolicy } from '../modules/trust/policy-middleware.js'
import { appendAuditLog, listAuditLogs } from '../services/auditLog.js'
import { computeIntegrityHash } from '../services/integrity.js'
import { compareMaintenancePrice } from '../services/priceComparison.js'
import { getWashSuggestion } from '../services/weather.js'
import { buildWeeklySummary } from '../services/weeklySummary.js'
import { authRouter } from './auth.js'

const api = Router()

api.get('/users/:id/weekly-summary', (_req, res) => {
  res.json(buildWeeklySummary())
})

api.post('/sync', (req, res) => {
  const actions = Array.isArray(req.body?.actions) ? req.body.actions : []
  res.json({ synced: actions.length })
})

api.post('/v1/events/batch', ingestAnalyticsEventsController)
api.get('/v1/analytics/dashboard', getAnalyticsDashboardController)
api.post('/v1/consent', createConsentController)
api.post('/v1/consent/revoke', revokeConsentController)
api.post('/v1/consent/export', exportConsentDataController)
api.post('/v1/consent/delete', deleteConsentDataController)

api.post('/vehicles/:id/lock', (_req, res) => {
  res.json({ locked: true })
})

api.post('/vehicles/:id/maintenance', requirePermission('logs.create'), (req, res) => {
  const integrityHash = computeIntegrityHash(req.body ?? {})
  appendAuditLog({
    entityType: 'maintenance_log',
    entityId: randomUUID(),
    action: 'create',
    oldValues: null,
    newValues: { ...(req.body ?? {}), integrityHash },
    userId: 'demo-user',
  })
  res.status(201).json({ integrityHash })
})

api.put(
  '/vehicles/:id/maintenance/:maintenanceId',
  requirePermission('logs.update'),
  enforceTrustPolicy,
  (req, res) => {
    const maintenanceId = Array.isArray(req.params.maintenanceId)
      ? req.params.maintenanceId[0]
      : req.params.maintenanceId
    appendAuditLog({
      entityType: 'maintenance_log',
      entityId: maintenanceId ?? randomUUID(),
      action: 'update',
      oldValues: { placeholder: true },
      newValues: req.body ?? {},
      userId: 'demo-user',
    })
    res.json({ ok: true })
  },
)

api.post('/upload', (_req, res) => {
  res.status(201).json({ url: 'https://example.r2.dev/file.jpg' })
})

api.get('/vehicles/:id/fuel', (_req, res) => {
  res.json({ items: [] })
})

api.post('/vehicles/scan-document', (_req, res) => {
  res.json({
    make: 'Skoda',
    model: 'Octavia',
    year: 2020,
    vin: 'WVWZZZ1JZXW000001',
  })
})

api.post('/ai/parse-service-report', (_req, res) => {
  res.json({ items: [], model: 'gpt-4o-mini' })
})

api.post('/ai/scan-receipt', (_req, res) => {
  res.json({ items: [], model: 'gpt-4o-mini' })
})

api.post('/ai/fair-price', (req, res) => {
  const userPaid = Number(req.body?.userPaid ?? 0)
  res.json(compareMaintenancePrice(userPaid))
})

api.post('/reports/generate', (_req, res) => {
  res.json({
    publicUrl: 'https://autocare.app/r/demo',
    reportHash: createHash('sha256').update('demo').digest('hex'),
  })
})

api.get('/audit-logs', (_req, res) => {
  res.json({ items: listAuditLogs() })
})

api.get('/wash/suggestion', (_req, res) => {
  res.json(getWashSuggestion())
})

api.get('/lez/check', (_req, res) => {
  res.json({
    city: 'Paris',
    allowed: true,
    details: 'Requires CritAir sticker',
  })
})

api.get('/parts/tires/recommendations', (_req, res) => {
  res.json({
    items: [
      {
        size: '225/45R17',
        brand: 'Michelin',
        model: 'Primacy',
        price: 120,
        currency: 'EUR',
      },
    ],
  })
})

export const registerAppRoutes = (app: Express): void => {
  app.use('/auth', authRouter)
  app.use('/api', api)
}
