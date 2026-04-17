import cron from 'node-cron'
import type { Logger } from 'pino'

export const registerScheduledJobs = (logger: Logger): void => {
  cron.schedule('0 * * * *', () => {
    logger.info('Running reminder check job')
  })

  cron.schedule('0 9 * * 1', () => {
    logger.info('Running weekly summary job')
  })
}
