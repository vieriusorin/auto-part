import type { RequestHandler } from 'express'
import { emitTrustDenialAudit } from './denial-audit-emitter.js'
import { assertTrustWriteAllowed } from './policy-guards.js'

type TrustRequest = {
  userRole?: 'member' | 'admin' | 'service'
  trustLocked?: boolean
  userId?: string
}

export const enforceTrustPolicy: RequestHandler = async (req, res, next) => {
  const trustRequest = req as typeof req & TrustRequest
  const requestHeader = req.headers['x-request-id']
  const requestId =
    typeof requestHeader === 'string'
      ? requestHeader
      : Array.isArray(requestHeader)
        ? (requestHeader[0] ?? 'missing-request-id')
        : 'missing-request-id'
  const result = assertTrustWriteAllowed({
    actorRole: trustRequest.userRole ?? 'member',
    isLocked: trustRequest.trustLocked ?? false,
  })

  if (!result.allowed) {
    await emitTrustDenialAudit({
      actorId: trustRequest.userId ?? 'anonymous',
      resourceId: String(req.params.maintenanceId ?? req.params.id ?? 'unknown'),
      reasonCode: result.reasonCode,
      requestId,
    })
    res.status(403).json({ message: 'Trust policy denied', reasonCode: result.reasonCode })
    return
  }

  next()
}
