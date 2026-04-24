import { maintenanceLog, users, vehicle, vehicleDocument, vehicleMember, vehicleReminder } from '@autocare/db'
import type { CreateVehicleInput } from '@autocare/shared'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  buildOrganizationMaintenanceScope,
  buildOrganizationMaintenanceRangeScope,
  buildOrganizationUserScope,
  buildOrganizationVehicleScope,
  buildReminderOwnershipScope,
  buildVehicleDocumentScope,
  buildVehicleMemberScope,
  buildVehicleReminderScope,
  buildVehicleOwnershipScope,
} from './authorization-scope.js'

const vehicleTable = vehicle

export type VehicleRow = typeof vehicle.$inferSelect
export type MaintenanceLogRow = typeof maintenanceLog.$inferSelect
export type VehicleDocumentRow = typeof vehicleDocument.$inferSelect
export type VehicleMemberRow = typeof vehicleMember.$inferSelect
export type VehicleReminderRow = typeof vehicleReminder.$inferSelect

export type VehicleRepository = {
  listForOrganization: (organizationId: string) => Promise<VehicleRow[]>
  findOwned: (vehicleId: string, organizationId: string) => Promise<VehicleRow | null>
  create: (organizationId: string, input: CreateVehicleInput) => Promise<VehicleRow>
  updateOwned: (
    vehicleId: string,
    organizationId: string,
    patch: Partial<{
      make: string
      model: string
      year: number
      vin: string
      plate: string | null
      currentOdometer: number
      isLocked: boolean
    }>,
  ) => Promise<VehicleRow | null>
  createMaintenanceLog: (input: {
    vehicleId: string
    organizationId: string
    odometer: number
    category: string
    description?: string
    totalCost?: number
    integrityHash: string
  }) => Promise<MaintenanceLogRow>
  listMaintenanceForVehicle: (
    vehicleId: string,
    organizationId: string,
  ) => Promise<MaintenanceLogRow[]>
  listMaintenanceForOrganizationInRange: (input: {
    organizationId: string
    from: Date
    to: Date
    vehicleIds?: string[]
    categories?: string[]
  }) => Promise<MaintenanceLogRow[]>
  findMaintenanceOwned: (
    maintenanceId: string,
    organizationId: string,
  ) => Promise<MaintenanceLogRow | null>
  updateMaintenanceOwned: (
    maintenanceId: string,
    organizationId: string,
    patch: Record<string, unknown>,
    integrityHash: string,
  ) => Promise<MaintenanceLogRow | null>
  listDocumentsForVehicle: (
    vehicleId: string,
    organizationId: string,
  ) => Promise<VehicleDocumentRow[]>
  createDocument: (input: {
    vehicleId: string
    organizationId: string
    maintenanceLogId?: string
    type: 'invoice' | 'inspection' | 'photo' | 'insurance' | 'other'
    title: string
    storageKey: string
    mimeType: string
    sizeBytes: number
    uploadedBy: string
  }) => Promise<VehicleDocumentRow>
  listVehicleMembers: (vehicleId: string, organizationId: string) => Promise<VehicleMemberRow[]>
  upsertVehicleMember: (input: {
    vehicleId: string
    organizationId: string
    userId: string
    role: 'owner' | 'manager' | 'driver' | 'viewer'
    assignedBy: string
  }) => Promise<VehicleMemberRow>
  listRemindersForVehicle: (vehicleId: string, organizationId: string) => Promise<VehicleReminderRow[]>
  createReminder: (input: {
    vehicleId: string
    organizationId: string
    title: string
    notes?: string
    frequencyType: 'days' | 'miles'
    intervalValue: number
    dueAt?: Date
    dueOdometer?: number
  }) => Promise<VehicleReminderRow>
  updateReminderOwned: (input: {
    reminderId: string
    vehicleId: string
    organizationId: string
    patch: Partial<{
      title: string
      notes: string | null
      status: 'due_now' | 'upcoming' | 'deferred' | 'done'
      deferredUntil: Date | null
      dueAt: Date | null
      dueOdometer: number | null
    }>
  }) => Promise<VehicleReminderRow | null>
}

type OwnedVehicleRef = {
  row: VehicleRow
  internalId: number
}

const findOwnedVehicle = async (
  db: NodePgDatabase,
  vehicleId: string,
  organizationId: string,
): Promise<OwnedVehicleRef | null> => {
  const rows = await db
    .select()
    .from(vehicle)
    .where(buildVehicleOwnershipScope(vehicleId, organizationId))
    .limit(1)
  const row = rows[0] ?? null
  if (!row || row.idInt === null) {
    return null
  }
  return { row, internalId: row.idInt }
}

const findMaintenanceOwnedQuery = async (
  db: NodePgDatabase,
  maintenanceId: string,
  organizationId: string,
): Promise<MaintenanceLogRow | null> => {
  const rows = await db
    .select({ log: maintenanceLog })
    .from(maintenanceLog)
    .innerJoin(vehicleTable, eq(maintenanceLog.vehicleIdInt, vehicleTable.idInt))
    .where(
      buildOrganizationMaintenanceScope(maintenanceId, organizationId),
    )
    .limit(1)
  return rows[0]?.log ?? null
}

const findUserInOrganization = async (
  db: NodePgDatabase,
  userId: string,
  organizationId: string,
): Promise<number | null> => {
  const rows = await db
    .select({ id: users.id, idInt: users.idInt })
    .from(users)
    .where(buildOrganizationUserScope(userId, organizationId))
    .limit(1)
  const row = rows[0] ?? null
  if (!row?.id || row.idInt === null) {
    return null
  }
  return row.idInt
}

export const createVehicleRepository = (db: NodePgDatabase): VehicleRepository => ({
  listForOrganization: async (organizationId) => {
    return db
      .select()
      .from(vehicle)
      .where(buildOrganizationVehicleScope(organizationId))
      .orderBy(desc(vehicle.createdAt))
  },

  findOwned: async (vehicleId, organizationId) => {
    const owned = await findOwnedVehicle(db, vehicleId, organizationId)
    return owned?.row ?? null
  },

  create: async (organizationId, input) => {
    const [row] = await db
      .insert(vehicle)
      .values({
        organizationId,
        make: input.make,
        model: input.model,
        year: input.year,
        vin: input.vin,
        plate: input.plate ?? null,
        currentOdometer: 0,
        isLocked: false,
      })
      .returning()
    if (!row) {
      throw new Error('Failed to create vehicle')
    }
    return row
  },

  updateOwned: async (vehicleId, organizationId, patch) => {
    const existing = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!existing) return null

    const updates: Partial<{
      make: string
      model: string
      year: number
      vin: string
      plate: string | null
      currentOdometer: number
      isLocked: boolean
    }> = {}
    if (patch.make !== undefined) updates.make = patch.make
    if (patch.model !== undefined) updates.model = patch.model
    if (patch.year !== undefined) updates.year = patch.year
    if (patch.vin !== undefined) updates.vin = patch.vin
    if (patch.plate !== undefined) updates.plate = patch.plate
    if (patch.currentOdometer !== undefined) updates.currentOdometer = patch.currentOdometer
    if (patch.isLocked !== undefined) updates.isLocked = patch.isLocked

    if (Object.keys(updates).length === 0) {
      return existing.row
    }

    const [row] = await db
      .update(vehicle)
      .set(updates)
      .where(buildVehicleOwnershipScope(vehicleId, organizationId))
      .returning()
    return row ?? null
  },

  createMaintenanceLog: async ({
    vehicleId,
    organizationId,
    odometer,
    category,
    description,
    totalCost,
    integrityHash,
  }) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) {
      throw new Error('vehicle_not_found')
    }
    const now = new Date()
    const [row] = await db
      .insert(maintenanceLog)
      .values({
        vehicleId,
        vehicleIdInt: v.internalId,
        date: now,
        odometer,
        category,
        description: description ?? null,
        totalCost: totalCost ?? null,
        integrityHash,
        version: 1,
      })
      .returning()
    if (!row) {
      throw new Error('Failed to create maintenance log')
    }
    return row
  },

  listMaintenanceForVehicle: async (vehicleId, organizationId) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) return []
    return db
      .select()
      .from(maintenanceLog)
      .where(eq(maintenanceLog.vehicleIdInt, v.internalId))
      .orderBy(desc(maintenanceLog.date))
  },
  listMaintenanceForOrganizationInRange: async ({ organizationId, from, to, vehicleIds, categories }) => {
    const predicates = [
      buildOrganizationMaintenanceRangeScope(organizationId),
      gte(maintenanceLog.date, from),
      lte(maintenanceLog.date, to),
    ]
    if (vehicleIds && vehicleIds.length > 0) {
      predicates.push(inArray(maintenanceLog.vehicleId, vehicleIds))
    }
    if (categories && categories.length > 0) {
      predicates.push(inArray(maintenanceLog.category, categories))
    }
    const rows = await db
      .select({ log: maintenanceLog })
      .from(maintenanceLog)
      .innerJoin(vehicleTable, eq(maintenanceLog.vehicleIdInt, vehicleTable.idInt))
      .where(and(...predicates))
      .orderBy(desc(maintenanceLog.date))
    return rows.map((row) => row.log)
  },

  findMaintenanceOwned: (maintenanceId, organizationId) =>
    findMaintenanceOwnedQuery(db, maintenanceId, organizationId),

  updateMaintenanceOwned: async (maintenanceId, organizationId, patch, integrityHash) => {
    const existing = await findMaintenanceOwnedQuery(db, maintenanceId, organizationId)
    if (!existing) return null

    const next: Partial<typeof maintenanceLog.$inferInsert> = {
      integrityHash,
      updatedAt: new Date(),
      version: existing.version + 1,
    }

    if ('odometer' in patch && typeof patch.odometer === 'number') {
      next.odometer = patch.odometer
    }
    if ('category' in patch && typeof patch.category === 'string') {
      next.category = patch.category
    }
    if ('description' in patch) {
      next.description =
        patch.description === undefined || patch.description === null
          ? null
          : String(patch.description)
    }
    if ('totalCost' in patch && typeof patch.totalCost === 'number') {
      next.totalCost = patch.totalCost
    }

    const [row] = await db
      .update(maintenanceLog)
      .set(next)
      .where(eq(maintenanceLog.id, maintenanceId))
      .returning()
    return row ?? null
  },

  listDocumentsForVehicle: async (vehicleId, organizationId) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) return []
    return db
      .select()
      .from(vehicleDocument)
      .where(buildVehicleDocumentScope(v.internalId, organizationId))
      .orderBy(desc(vehicleDocument.createdAt))
  },

  createDocument: async ({
    vehicleId,
    organizationId,
    maintenanceLogId,
    type,
    title,
    storageKey,
    mimeType,
    sizeBytes,
    uploadedBy,
  }) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) {
      throw new Error('vehicle_not_found')
    }
    const uploaderIdInt = await findUserInOrganization(db, uploadedBy, organizationId)
    if (!uploaderIdInt) {
      throw new Error('uploader_not_in_organization')
    }
    const ownedLog = maintenanceLogId
      ? await findMaintenanceOwnedQuery(db, maintenanceLogId, organizationId)
      : null
    if (maintenanceLogId && (!ownedLog || ownedLog.vehicleIdInt !== v.internalId)) {
      throw new Error('maintenance_not_found')
    }
    const [row] = await db
      .insert(vehicleDocument)
      .values({
        vehicleId,
        vehicleIdInt: v.internalId,
        organizationId,
        maintenanceLogId: maintenanceLogId ?? null,
        maintenanceLogIdInt: ownedLog?.idInt ?? null,
        type,
        title,
        storageKey,
        mimeType,
        sizeBytes,
        uploadedBy,
        uploadedByInt: uploaderIdInt,
      })
      .returning()
    if (!row) {
      throw new Error('Failed to create vehicle document')
    }
    return row
  },

  listVehicleMembers: async (vehicleId, organizationId) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) return []
    return db
      .select()
      .from(vehicleMember)
      .where(buildVehicleMemberScope(v.internalId, organizationId))
      .orderBy(desc(vehicleMember.createdAt))
  },

  upsertVehicleMember: async ({ vehicleId, organizationId, userId, role, assignedBy }) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) {
      throw new Error('vehicle_not_found')
    }
    const userIdInt = await findUserInOrganization(db, userId, organizationId)
    if (!userIdInt) {
      throw new Error('user_not_in_organization')
    }
    const assignerIdInt = await findUserInOrganization(db, assignedBy, organizationId)
    if (!assignerIdInt) {
      throw new Error('assigner_not_in_organization')
    }

    const [existing] = await db
      .select()
      .from(vehicleMember)
      .where(
        and(
          eq(vehicleMember.vehicleId, vehicleId),
          buildVehicleMemberScope(v.internalId, organizationId),
          eq(vehicleMember.userId, userId),
        ),
      )
      .limit(1)

    if (existing) {
      const [updated] = await db
        .update(vehicleMember)
        .set({
          role,
          assignedBy,
          assignedByInt: assignerIdInt,
        })
        .where(eq(vehicleMember.id, existing.id))
        .returning()
      if (!updated) {
        throw new Error('Failed to update vehicle member')
      }
      return updated
    }

    const [created] = await db
      .insert(vehicleMember)
      .values({
        vehicleId,
        vehicleIdInt: v.internalId,
        organizationId,
        userId,
        userIdInt,
        role,
        assignedBy,
        assignedByInt: assignerIdInt,
      })
      .returning()
    if (!created) {
      throw new Error('Failed to create vehicle member')
    }
    return created
  },

  listRemindersForVehicle: async (vehicleId, organizationId) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) return []
    return db
      .select()
      .from(vehicleReminder)
      .where(buildVehicleReminderScope(v.internalId, organizationId))
      .orderBy(vehicleReminder.dueAt, desc(vehicleReminder.createdAt))
  },

  createReminder: async ({
    vehicleId,
    organizationId,
    title,
    notes,
    frequencyType,
    intervalValue,
    dueAt,
    dueOdometer,
  }) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) {
      throw new Error('vehicle_not_found')
    }
    const [row] = await db
      .insert(vehicleReminder)
      .values({
        vehicleId,
        vehicleIdInt: v.internalId,
        organizationId,
        title,
        notes: notes ?? null,
        frequencyType,
        intervalValue,
        dueAt: dueAt ?? null,
        dueOdometer: dueOdometer ?? null,
        status: 'upcoming',
        updatedAt: new Date(),
      })
      .returning()
    if (!row) {
      throw new Error('Failed to create reminder')
    }
    return row
  },

  updateReminderOwned: async ({ reminderId, vehicleId, organizationId, patch }) => {
    const owned = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!owned) return null
    const [existing] = await db
      .select()
      .from(vehicleReminder)
      .where(
        buildReminderOwnershipScope(reminderId, owned.internalId, organizationId),
      )
      .limit(1)
    if (!existing) {
      return null
    }
    const next: Partial<typeof vehicleReminder.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (patch.title !== undefined) next.title = patch.title
    if (patch.notes !== undefined) next.notes = patch.notes
    if (patch.status !== undefined) next.status = patch.status
    if (patch.deferredUntil !== undefined) next.deferredUntil = patch.deferredUntil
    if (patch.dueAt !== undefined) next.dueAt = patch.dueAt
    if (patch.dueOdometer !== undefined) next.dueOdometer = patch.dueOdometer
    const [updated] = await db
      .update(vehicleReminder)
      .set(next)
      .where(eq(vehicleReminder.id, reminderId))
      .returning()
    return updated ?? null
  },
})
