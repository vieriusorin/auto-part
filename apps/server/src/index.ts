import { spawn } from 'node:child_process'
import pino from 'pino'
import type { GetHealthUseCase } from './application/system/get-health-use-case.js'
import { loadServerConfig } from './config/load-env.js'
import { createAppContainer } from './infrastructure/di/container.js'
import { diTokens } from './infrastructure/di/tokens.js'
import { createServer } from './interfaces/http/server.js'
import { registerScheduledJobs } from './jobs/index.js'
import { createAuthModule } from './modules/auth/auth-module.js'

const config = loadServerConfig()

const logger = pino({ name: 'autocare-api' })

const authModule = await createAuthModule(config)
const container = createAppContainer(authModule)
const getHealthUseCase = container.get<GetHealthUseCase>(diTokens.getHealthUseCase)

const app = createServer({ config, container, authModule, logger, getHealthUseCase })

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

app.listen(config.PORT, () => {
  logger.info(`API listening on port ${config.PORT}`)
  const shouldOpenDocs = config.NODE_ENV !== 'production' && config.OPEN_API_DOCS
  if (shouldOpenDocs) {
    const docsUrl = `http://localhost:${config.PORT}/docs`
    logger.info(`Swagger docs: ${docsUrl}`)
    openUrlInDefaultBrowser(docsUrl)
  }
})
