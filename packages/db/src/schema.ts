import { bigint, boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { trustCriticalFieldColumns } from './schemas/trust-critical-fields.js'

export const vehicle = pgTable('vehicle', {
  id: uuid('id').defaultRandom().primaryKey(),
  idInt: bigint('id_int', { mode: 'number' }),
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
  idInt: bigint('id_int', { mode: 'number' }),
  vehicleId: uuid('vehicle_id').notNull(),
  vehicleIdInt: bigint('vehicle_id_int', { mode: 'number' }),
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

export const vehicleReminder = pgTable('vehicle_reminder', {
  id: uuid('id').defaultRandom().primaryKey(),
  idInt: bigint('id_int', { mode: 'number' }),
  vehicleId: uuid('vehicle_id').notNull(),
  vehicleIdInt: bigint('vehicle_id_int', { mode: 'number' }),
  organizationId: text('organization_id').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  frequencyType: text('frequency_type').notNull(),
  intervalValue: integer('interval_value').notNull(),
  dueAt: timestamp('due_at'),
  dueOdometer: integer('due_odometer'),
  status: text('status').notNull().default('upcoming'),
  deferredUntil: timestamp('deferred_until'),
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
  idInt: bigint('id_int', { mode: 'number' }),
  vehicleId: uuid('vehicle_id').notNull(),
  vehicleIdInt: bigint('vehicle_id_int', { mode: 'number' }),
  organizationId: text('organization_id').notNull(),
  maintenanceLogId: uuid('maintenance_log_id'),
  maintenanceLogIdInt: bigint('maintenance_log_id_int', { mode: 'number' }),
  type: vehicleDocumentTypeEnum('type').notNull(),
  title: text('title').notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  uploadedByInt: bigint('uploaded_by_int', { mode: 'number' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const vehicleMember = pgTable('vehicle_member', {
  id: uuid('id').defaultRandom().primaryKey(),
  idInt: bigint('id_int', { mode: 'number' }),
  vehicleId: uuid('vehicle_id').notNull(),
  vehicleIdInt: bigint('vehicle_id_int', { mode: 'number' }),
  organizationId: text('organization_id').notNull(),
  userId: uuid('user_id').notNull(),
  userIdInt: bigint('user_id_int', { mode: 'number' }),
  role: vehicleMemberRoleEnum('role').notNull(),
  assignedBy: uuid('assigned_by').notNull(),
  assignedByInt: bigint('assigned_by_int', { mode: 'number' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const organizationInvite = pgTable('organization_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  idInt: bigint('id_int', { mode: 'number' }),
  organizationId: text('organization_id').notNull(),
  email: text('email').notNull(),
  role: organizationInviteRoleEnum('role').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  invitedBy: uuid('invited_by').notNull(),
  invitedByInt: bigint('invited_by_int', { mode: 'number' }),
  acceptedBy: uuid('accepted_by'),
  acceptedByInt: bigint('accepted_by_int', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const subscriptionCancellation = pgTable('subscription_cancellations', {
  id: uuid('id').defaultRandom().primaryKey(),
  idInt: bigint('id_int', { mode: 'number' }),
  organizationId: text('organization_id').notNull(),
  userId: uuid('user_id').notNull(),
  userIdInt: bigint('user_id_int', { mode: 'number' }),
  reason: text('reason').notNull(),
  feedback: text('feedback'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const documentStatusEnum = pgEnum('document_status', ['draft', 'published', 'archived'])

export const document = pgTable('document', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: documentStatusEnum('status').notNull().default('draft'),
  isLocked: boolean('is_locked').notNull().default(false),
  creatorId: uuid('creator_id').notNull(),
  lastEditedById: uuid('last_edited_by_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
