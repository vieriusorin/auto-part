import type { Request, Response } from 'express'
import { createConsent, revokeConsent } from './consent-service.js'
import { createDeleteJob, createExportJob } from './export-delete-jobs.js'

export const createConsentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const consent = await createConsent(req.body)
    res.status(201).json(consent)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create consent', error: String(error) })
  }
}

export const revokeConsentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const consent = await revokeConsent(req.body)
    res.status(202).json(consent)
  } catch (error) {
    res.status(500).json({ message: 'Failed to revoke consent', error: String(error) })
  }
}

export const exportConsentDataController = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await createExportJob(req.body)
    res.status(202).json(job)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create export job', error: String(error) })
  }
}

export const deleteConsentDataController = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await createDeleteJob(req.body)
    res.status(202).json(job)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create delete job', error: String(error) })
  }
}
