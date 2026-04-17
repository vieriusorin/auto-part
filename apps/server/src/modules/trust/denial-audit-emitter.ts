import { appendTrustAuditEvent } from './audit-service.js'

type DenialAuditInput = {
  actorId: string
  resourceId: string
  reasonCode: string
  requestId: string
}

export const emitTrustDenialAudit = async (input: DenialAuditInput): Promise<void> => {
  await appendTrustAuditEvent({
    actorType: 'user',
    actorId: input.actorId,
    action: 'trust.write.denied',
    resourceType: 'trust_critical',
    resourceId: input.resourceId,
    requestId: input.requestId,
    source: 'middleware',
    reasonCode: input.reasonCode,
    metadataJson: { reasonCode: input.reasonCode },
  })
}
