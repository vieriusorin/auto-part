import type { Request, Response } from 'express'
import { trustPresenter } from '../../presenters/trust.presenter.js'
import { createConsent, revokeConsent } from './consent-service.js'
import { createDeleteJob, createExportJob } from './export-delete-jobs.js'

export const createConsentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const consent = await createConsent(req.body)
    trustPresenter.presentConsentCreated(res, consent)
  } catch (error) {
    trustPresenter.presentOperationError(
      res,
      'consent_create_failed',
      'Failed to create consent',
      error,
    )
  }
}

export const revokeConsentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const consent = await revokeConsent(req.body)
    trustPresenter.presentConsentAccepted(res, consent)
  } catch (error) {
    trustPresenter.presentOperationError(
      res,
      'consent_revoke_failed',
      'Failed to revoke consent',
      error,
    )
  }
}

export const exportConsentDataController = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await createExportJob(req.body)
    trustPresenter.presentConsentAccepted(res, job)
  } catch (error) {
    trustPresenter.presentOperationError(
      res,
      'consent_export_failed',
      'Failed to create export job',
      error,
    )
  }
}

export const deleteConsentDataController = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await createDeleteJob(req.body)
    trustPresenter.presentConsentAccepted(res, job)
  } catch (error) {
    trustPresenter.presentOperationError(
      res,
      'consent_delete_failed',
      'Failed to create delete job',
      error,
    )
  }
}
