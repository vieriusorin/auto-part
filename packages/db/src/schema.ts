import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { trustCriticalFieldColumns } from './schemas/trust-critical-fields.js'

export const vehicle = pgTable('vehicle', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  vin: text('vin').notNull(),
  plate: text('plate'),
  euroStandard: text('euro_standard'),
  currentOdometer: integer('current_odometer').notNull().default(0),
  isLocked: boolean('is_locked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const maintenanceLog = pgTable('maintenance_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').notNull(),
  date: timestamp('date').notNull(),
  odometer: integer('odometer').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  totalCost: integer('total_cost'),
  integrityHash: text('integrity_hash').notNull(),
  version: integer('version').notNull().default(1),
  ...trustCriticalFieldColumns,
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
