import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
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

export const vehicleDocumentTypeEnum = pgEnum('vehicle_document_type', [
  'invoice',
  'inspection',
  'photo',
  'insurance',
  'other',
])

export const vehicleMemberRoleEnum = pgEnum('vehicle_member_role', [
  'owner',
  'manager',
  'driver',
  'viewer',
])

export const organizationInviteRoleEnum = pgEnum('organization_invite_role', [
  'owner',
  'admin',
  'manager',
  'driver',
  'viewer',
])

export const vehicleDocument = pgTable('vehicle_document', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').notNull(),
  organizationId: text('organization_id').notNull(),
  maintenanceLogId: uuid('maintenance_log_id'),
  type: vehicleDocumentTypeEnum('type').notNull(),
  title: text('title').notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const vehicleMember = pgTable('vehicle_member', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').notNull(),
  organizationId: text('organization_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: vehicleMemberRoleEnum('role').notNull(),
  assignedBy: uuid('assigned_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const organizationInvite = pgTable('organization_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(),
  email: text('email').notNull(),
  role: organizationInviteRoleEnum('role').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  invitedBy: uuid('invited_by').notNull(),
  acceptedBy: uuid('accepted_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
