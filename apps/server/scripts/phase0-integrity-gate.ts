import { getCriticalEventIntegrity } from '../src/modules/analytics/service.js'

const run = async (): Promise<void> => {
  if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL.trim().length === 0) {
    console.error(
      'critical_event_integrity gate failed: DATABASE_URL is required for persisted evidence',
    )
    process.exit(1)
  }

  const integrity = await getCriticalEventIntegrity()
  if (integrity < 95) {
    console.error(`critical_event_integrity=${integrity.toFixed(2)} < 95`)
    process.exit(1)
  }
  console.log(`critical_event_integrity=${integrity.toFixed(2)}`)
}

void run()
