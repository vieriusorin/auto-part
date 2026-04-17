import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { getCriticalEventIntegrity, getDashboardRollups } from '../src/modules/analytics/service.js'

const run = (command: string): void => {
  execSync(command, { stdio: 'inherit' })
}

const runGate = async (): Promise<void> => {
  if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL.trim().length === 0) {
    console.error('Gate failed: DATABASE_URL is required for authoritative persisted KPI evidence.')
    process.exit(1)
  }

  const integrity = await getCriticalEventIntegrity()
  if (integrity < 95) {
    console.error(`Gate failed: critical_event_integrity=${integrity.toFixed(2)} < 95`)
    process.exit(1)
  }

  const dashboardRows = await getDashboardRollups()
  if (dashboardRows.length === 0) {
    console.error('Gate failed: no persisted dashboard rows found for analytics rollups.')
    process.exit(1)
  }

  const hasSegmentedMetrics = dashboardRows.some(
    (row) =>
      row.activationCount > 0 &&
      row.d1Retained >= 0 &&
      row.d7Retained >= 0 &&
      row.d30Retained >= 0 &&
      row.wau > 0 &&
      row.mau > 0 &&
      row.maintenanceActionsCompleted > 0,
  )
  if (!hasSegmentedMetrics) {
    console.error(
      'Gate failed: persisted dashboard rows do not contain authoritative segmented KPI evidence for activation/retention/WAU/MAU/maintenance.',
    )
    process.exit(1)
  }

  const segmentCount = new Set(
    dashboardRows.map((row) => `${row.country}:${row.platform}:${row.channel}`),
  ).size
  if (segmentCount < 1) {
    console.error('Gate failed: persisted dashboard rows do not include segment keys.')
    process.exit(1)
  }

  const evidencePath = path.resolve(
    process.cwd(),
    '../../.planning/phases/phase-0/tdd-evidence.json',
  )
  if (!existsSync(evidencePath)) {
    console.error('Gate failed: missing Phase 0 TDD evidence file.')
    process.exit(1)
  }

  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
    tasks?: Array<{ task_id?: string }>
  }
  const requiredTasks = new Set(['task-1', 'task-2', 'task-3'])
  for (const task of evidence.tasks ?? []) {
    if (task.task_id !== undefined) {
      requiredTasks.delete(task.task_id)
    }
  }

  if (requiredTasks.size > 0) {
    console.error(`Gate failed: missing evidence for ${Array.from(requiredTasks).join(', ')}`)
    process.exit(1)
  }

  run(
    'npm run test:vitest -- analytics-contract analytics-rollups consent-lifecycle consent-export-delete audit-append-only trust-policy-bypass trust-policy-audit consent-routes acceptance-wiring',
  )
  console.log('phase0:gate passed')
}

void runGate()
