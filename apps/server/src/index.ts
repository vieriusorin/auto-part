import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import pino from 'pino'
import { pinoHttp } from 'pino-http'
import { registerScheduledJobs } from './jobs/index.js'
import { registerAppRoutes } from './routes/index.js'

const logger = pino({ name: 'autocare-api' })
const app = express()

app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use(pinoHttp({ logger }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'autocare-api' })
})

registerAppRoutes(app)
registerScheduledJobs(logger)

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => {
  logger.info(`API listening on port ${port}`)
})
