import { Router } from 'express'
import { body } from 'express-validator'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { handleValidationErrors } from '../../../../interfaces/http/middlewares/security.middleware.js'
import { compareMaintenancePrice } from '../../../../services/priceComparison.js'

export const createAiRouter = (): Router => {
  const router = Router()

  router.post('/ai/parse-service-report', (_req, res) => {
    commonPresenter.ok(res, { items: [], model: 'gpt-4o-mini' })
  })

  router.post('/ai/scan-receipt', (_req, res) => {
    commonPresenter.ok(res, { items: [], model: 'gpt-4o-mini' })
  })

  router.post(
    '/ai/fair-price',
    body('userPaid')
      .exists()
      .withMessage('userPaid is required')
      .bail()
      .isFloat({ min: 0 })
      .withMessage('userPaid must be a non-negative number'),
    handleValidationErrors,
    (req, res) => {
      const userPaid = Number(req.body.userPaid)
      commonPresenter.ok(res, compareMaintenancePrice(userPaid))
    },
  )

  return router
}
