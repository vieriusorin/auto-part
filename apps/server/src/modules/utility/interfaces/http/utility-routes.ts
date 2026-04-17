import { Router } from 'express'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { getWashSuggestion } from '../../../../services/weather.js'

export const createUtilityRouter = (): Router => {
  const router = Router()

  router.get('/wash/suggestion', (_req, res) => {
    commonPresenter.ok(res, getWashSuggestion())
  })

  router.get('/lez/check', (_req, res) => {
    commonPresenter.ok(res, {
      city: 'Paris',
      allowed: true,
      details: 'Requires CritAir sticker',
    })
  })

  router.get('/parts/tires/recommendations', (_req, res) => {
    commonPresenter.ok(res, {
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

  return router
}
