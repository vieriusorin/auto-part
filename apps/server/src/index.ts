import { spawn } from 'node:child_process'
import pino from 'pino'
import type { GetHealthUseCase } from './application/system/get-health-use-case.js'
import { loadServerEnv } from './config/load-env.js'
import { createAppContainer } from './infrastructure/di/container.js'
import { diTokens } from './infrastructure/di/tokens.js'
import { createServer } from './interfaces/http/server.js'
import { registerScheduledJobs } from './jobs/index.js'

loadServerEnv()

const logger = pino({ name: 'autocare-api' })
const container = createAppContainer()
const getHealthUseCase = container.get<GetHealthUseCase>(diTokens.getHealthUseCase)
const app = createServer({ container, logger, getHealthUseCase })

const openUrlInDefaultBrowser = (url: string): void => {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref()
      return
    }

    if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
      return
    }

    if (process.platform === 'linux') {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
    }
  } catch (error) {
    logger.warn({ err: error, url }, 'Could not auto-open API docs')
  }
}

registerScheduledJobs(logger)

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => {
  logger.info(`API listening on port ${port}`)
  const shouldOpenDocs = process.env.NODE_ENV !== 'production' && process.env.OPEN_API_DOCS !== 'false'
  if (shouldOpenDocs) {
    const docsUrl = `http://localhost:${port}/docs`
    logger.info(`Swagger docs: ${docsUrl}`)
    openUrlInDefaultBrowser(docsUrl)
  }
})
