type AuditLogEntry = {
  entityType: 'maintenance_log' | 'document' | 'fuel_log' | 'car_wash_log'
  entityId: string
  action: 'create' | 'update' | 'delete'
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  userId: string
}

const memoryAuditLog: AuditLogEntry[] = []

export const appendAuditLog = (entry: AuditLogEntry): AuditLogEntry => {
  memoryAuditLog.push(entry)
  return entry
}

export const listAuditLogs = (): AuditLogEntry[] => memoryAuditLog
