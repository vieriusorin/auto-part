import { appendTrustAuditEvent } from './audit-service.js'
import { listConsentsForUser } from './consent-service.js'

type TrustJob = {
  jobId: string
  userId: string
  kind: 'export' | 'delete'
  status: 'accepted'
  requestId: string
}

const jobs: TrustJob[] = []

type JobInput = {
  userId: string
  requestId: string
}

const createJob = async (input: JobInput, kind: 'export' | 'delete'): Promise<TrustJob> => {
  const job: TrustJob = {
    jobId: crypto.randomUUID(),
    userId: input.userId,
    kind,
    status: 'accepted',
    requestId: input.requestId,
  }
  jobs.push(job)
  await appendTrustAuditEvent({
    actorType: 'user',
    actorId: input.userId,
    action: `consent.${kind}`,
    resourceType: 'trust_job',
    resourceId: job.jobId,
    requestId: input.requestId,
    source: 'job',
    reasonCode: null,
  })
  return job
}

export const createExportJob = (input: JobInput): Promise<TrustJob> => createJob(input, 'export')
export const createDeleteJob = (input: JobInput): Promise<TrustJob> => createJob(input, 'delete')

export const getTrustBundle = async (
  userId: string,
): Promise<{ consents: Awaited<ReturnType<typeof listConsentsForUser>> }> => ({
  consents: await listConsentsForUser(userId),
})
