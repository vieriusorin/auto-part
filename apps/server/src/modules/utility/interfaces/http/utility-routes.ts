import { Router } from 'express'
import {
  LezCheckResponseDataSchema,
  TireRecommendationsResponseDataSchema,
  WashSuggestionResponseDataSchema,
} from '@autocare/shared'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { getWashSuggestion } from '../../../../services/weather.js'

const UTILITY_TAG = 'Utility'

export const createUtilityRouter = (): Router => {
  const router = Router()

  registerRoute(router, '/api', {
    method: 'get',
    path: '/wash/suggestion',
    tags: [UTILITY_TAG],
    summary: 'Get wash suggestion',
    operationId: 'getWashSuggestion',
    responses: {
      200: {
        description: 'Weather-based wash suggestion',
        dataSchema: WashSuggestionResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, getWashSuggestion())
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/lez/check',
    tags: [UTILITY_TAG],
    summary: 'Check low-emission zone rule',
    operationId: 'checkLezRule',
    responses: {
      200: {
        description: 'LEZ check result',
        dataSchema: LezCheckResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, {
        city: 'Paris',
        allowed: true,
        details: 'Requires CritAir sticker',
      })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/parts/tires/recommendations',
    tags: [UTILITY_TAG],
    summary: 'Get tire recommendations',
    operationId: 'listTireRecommendations',
    responses: {
      200: {
        description: 'Tire recommendation list',
        dataSchema: TireRecommendationsResponseDataSchema,
      },
    },
    handler: ({ res }) => {
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
    },
  })

  return router
}
