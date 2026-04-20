import { maintenanceLog, users, vehicle, vehicleDocument, vehicleMember } from '@autocare/db'
import type { CreateVehicleInput } from '@autocare/shared'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

const vehicleTable = vehicle

export type VehicleRow = typeof vehicle.$inferSelect
export type MaintenanceLogRow = typeof maintenanceLog.$inferSelect
export type VehicleDocumentRow = typeof vehicleDocument.$inferSelect
export type VehicleMemberRow = typeof vehicleMember.$inferSelect

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
}

const findOwnedVehicle = async (
  db: NodePgDatabase,
  vehicleId: string,
  organizationId: string,
): Promise<VehicleRow | null> => {
  const rows = await db
    .select()
    .from(vehicle)
    .where(and(eq(vehicle.id, vehicleId), eq(vehicle.organizationId, organizationId)))
    .limit(1)
  return rows[0] ?? null
}

const findMaintenanceOwnedQuery = async (
  db: NodePgDatabase,
  maintenanceId: string,
  organizationId: string,
): Promise<MaintenanceLogRow | null> => {
  const rows = await db
    .select({ log: maintenanceLog })
    .from(maintenanceLog)
    .innerJoin(vehicleTable, eq(maintenanceLog.vehicleId, vehicleTable.id))
    .where(
      and(
        eq(maintenanceLog.id, maintenanceId),
        eq(vehicleTable.organizationId, organizationId),
      ),
    )
    .limit(1)
  return rows[0]?.log ?? null
}

const findUserInOrganization = async (
  db: NodePgDatabase,
  userId: string,
  organizationId: string,
): Promise<boolean> => {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)))
    .limit(1)
  return Boolean(rows[0]?.id)
}

export const createVehicleRepository = (db: NodePgDatabase): VehicleRepository => ({
  listForOrganization: async (organizationId) => {
    return db
      .select()
      .from(vehicle)
      .where(eq(vehicle.organizationId, organizationId))
      .orderBy(desc(vehicle.createdAt))
  },

  findOwned: (vehicleId, organizationId) => findOwnedVehicle(db, vehicleId, organizationId),

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
      return existing
    }

    const [row] = await db
      .update(vehicle)
      .set(updates)
      .where(and(eq(vehicle.id, vehicleId), eq(vehicle.organizationId, organizationId)))
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
      .where(eq(maintenanceLog.vehicleId, vehicleId))
      .orderBy(desc(maintenanceLog.date))
  },
  listMaintenanceForOrganizationInRange: async ({ organizationId, from, to, vehicleIds, categories }) => {
    const predicates = [
      eq(vehicleTable.organizationId, organizationId),
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
      .innerJoin(vehicleTable, eq(maintenanceLog.vehicleId, vehicleTable.id))
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
      .where(and(eq(vehicleDocument.vehicleId, vehicleId), eq(vehicleDocument.organizationId, organizationId)))
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
    const uploaderInOrg = await findUserInOrganization(db, uploadedBy, organizationId)
    if (!uploaderInOrg) {
      throw new Error('uploader_not_in_organization')
    }
    if (maintenanceLogId) {
      const ownedLog = await findMaintenanceOwnedQuery(db, maintenanceLogId, organizationId)
      if (!ownedLog || ownedLog.vehicleId !== vehicleId) {
        throw new Error('maintenance_not_found')
      }
    }
    const [row] = await db
      .insert(vehicleDocument)
      .values({
        vehicleId,
        organizationId,
        maintenanceLogId: maintenanceLogId ?? null,
        type,
        title,
        storageKey,
        mimeType,
        sizeBytes,
        uploadedBy,
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
      .where(and(eq(vehicleMember.vehicleId, vehicleId), eq(vehicleMember.organizationId, organizationId)))
      .orderBy(desc(vehicleMember.createdAt))
  },

  upsertVehicleMember: async ({ vehicleId, organizationId, userId, role, assignedBy }) => {
    const v = await findOwnedVehicle(db, vehicleId, organizationId)
    if (!v) {
      throw new Error('vehicle_not_found')
    }
    const userInOrg = await findUserInOrganization(db, userId, organizationId)
    if (!userInOrg) {
      throw new Error('user_not_in_organization')
    }
    const assignerInOrg = await findUserInOrganization(db, assignedBy, organizationId)
    if (!assignerInOrg) {
      throw new Error('assigner_not_in_organization')
    }

    const [existing] = await db
      .select()
      .from(vehicleMember)
      .where(
        and(
          eq(vehicleMember.vehicleId, vehicleId),
          eq(vehicleMember.organizationId, organizationId),
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
        organizationId,
        userId,
        role,
        assignedBy,
      })
      .returning()
    if (!created) {
      throw new Error('Failed to create vehicle member')
    }
    return created
  },
})
