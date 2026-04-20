import { Router } from 'express'
import type { Container } from 'inversify'
import { diTokens } from '../../infrastructure/di/tokens.js'
import type { AuthModule } from '../../modules/auth/auth-module.js'
import type { AuthHttpGuards } from '../../modules/auth/interfaces/http/auth-http-guards.js'
import { createAuthApiRouter, createAuthRouter } from '../../modules/auth/interfaces/http/auth-routes.js'
import { commonPresenter } from '../../presenters/common.presenter.js'
import type { ApiRouteModule } from './route-module.types.js'

export const createHttpRoutes = (container: Container, authModule: AuthModule): Router => {
  const router = Router()
  const apiRouteModules = container.getAll<ApiRouteModule>(diTokens.apiRouteModules)
  const authHttpGuards = container.get<AuthHttpGuards>(diTokens.authHttpGuards)

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

  router.use('/auth', createAuthRouter(authModule))
  router.use('/api', authHttpGuards.requireAuth)
  router.use('/api', createAuthApiRouter(authModule, authHttpGuards))
  for (const routeModule of apiRouteModules) {
    router.use('/api', routeModule.router)
  }

  return router
}
