import type { HealthStatus } from '../../domain/system/health.js'

export class GetHealthUseCase {
  execute(): HealthStatus {
    return { ok: true, service: 'autocare-api' }
  }
}
