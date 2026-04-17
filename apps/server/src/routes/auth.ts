import { Router } from 'express'

export const authRouter = Router()

authRouter.post('/login', (_req, res) => {
  res.json({ token: 'demo-token' })
})

authRouter.post('/invite', (_req, res) => {
  res.status(201).json({ status: 'pending' })
})
