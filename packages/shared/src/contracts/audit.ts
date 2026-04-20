import { z } from 'zod'

export const AuditLogEntrySchema = z.object({
  entityType: z.enum(['maintenance_log', 'document', 'fuel_log', 'car_wash_log']),
  entityId: z.string(),
  action: z.enum(['create', 'update', 'delete']),
  oldValues: z.record(z.string(), z.unknown()).nullable(),
  newValues: z.record(z.string(), z.unknown()).nullable(),
  userId: z.string(),
})

export const ListAuditLogsResponseDataSchema = z.object({
  items: z.array(AuditLogEntrySchema),
})
