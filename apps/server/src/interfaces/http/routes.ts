import { Router } from 'express'
import type { Container } from 'inversify'
import { diTokens } from '../../infrastructure/di/tokens.js'
import { commonPresenter } from '../../presenters/common.presenter.js'
import { authRouter } from './auth.routes.js'
import type { ApiRouteModule } from './route-module.types.js'

export const createHttpRoutes = (container: Container): Router => {
  const router = Router()
  const apiRouteModules = container.getAll<ApiRouteModule>(diTokens.apiRouteModules)

  router.get('/', (req, res) => {
    commonPresenter.ok(res, {
      api: {
        name: 'Autocare API',
        version: '0.1.0',
        docs: `${req.protocol}://${req.get('host')}/docs`,
      },
      modules: apiRouteModules.map((routeModule) => routeModule.name),
    })
  })

  router.use('/auth', authRouter)
  for (const routeModule of apiRouteModules) {
    router.use('/api', routeModule.router)
  }

  return router
}
