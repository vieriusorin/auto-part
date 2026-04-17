import type { Response } from 'express'
import { BasePresenter } from './base/base-presenter.js'

class TrustPresenter extends BasePresenter {
  presentConsentCreated(res: Response, payload: unknown) {
    return this.created(res, payload)
  }

  presentConsentAccepted(res: Response, payload: unknown) {
    return this.accepted(res, payload)
  }

  presentOperationError(res: Response, code: string, message: string, cause: unknown) {
    return this.error(res, 500, code, message, { cause: String(cause) })
  }
}

export const trustPresenter = new TrustPresenter()
