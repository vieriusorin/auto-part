import { Router } from 'express'
import { authRateLimiter } from './middlewares/security.middleware.js'
import { commonPresenter } from '../../presenters/common.presenter.js'

export const authRouter = Router()

authRouter.use(authRateLimiter)

authRouter.post('/login', (_req, res) => {
  commonPresenter.ok(res, { token: 'demo-token' })
})

authRouter.post('/invite', (_req, res) => {
  commonPresenter.created(res, { status: 'pending' })
})
