import { z } from 'zod'

export const createVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900),
  vin: z.string().min(6),
  plate: z.string().min(1).optional(),
})
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

export const updateVehicleBodySchema = z.object({
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).optional(),
  vin: z.string().min(6).optional(),
  plate: z.string().nullable().optional(),
  currentOdometer: z.number().int().nonnegative().optional(),
})
export type UpdateVehicleBody = z.infer<typeof updateVehicleBodySchema>

export const VehicleResponseSchema = z.object({
  id: z.string().uuid(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  vin: z.string(),
  plate: z.string().nullable(),
  currentOdometer: z.number().int(),
  isLocked: z.boolean(),
  createdAt: z.string(),
})

export const ListVehiclesResponseDataSchema = z.object({
  items: z.array(VehicleResponseSchema),
})

export const CreateVehicleResponseDataSchema = VehicleResponseSchema

export const MaintenanceLogEntrySchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  date: z.string(),
  odometer: z.number().int(),
  category: z.string(),
  description: z.string().nullable(),
  totalCost: z.number().nullable(),
  integrityHash: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ListMaintenanceLogsResponseDataSchema = z.object({
  items: z.array(MaintenanceLogEntrySchema),
})

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  odometer: z.number().int().nonnegative(),
  category: z.string().min(1),
  description: z.string().optional(),
  totalCost: z.number().nonnegative().optional(),
})
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>

export const VehicleIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const MaintenanceIdParamsSchema = z.object({
  id: z.string().min(1),
  maintenanceId: z.string().min(1),
})

export const LockVehicleResponseDataSchema = z.object({
  locked: z.boolean(),
})

export const CreateMaintenanceBodySchema = z
  .object({
    odometer: z.number().int().nonnegative(),
    category: z.string().min(1),
    description: z.string().optional(),
    totalCost: z.number().nonnegative().optional(),
  })
  .passthrough()

export const CreateMaintenanceResponseDataSchema = z.object({
  integrityHash: z.string().length(64),
})

export const UpdateMaintenanceBodySchema = z.record(z.string(), z.unknown())

export const UpdateMaintenanceResponseDataSchema = z.object({
  ok: z.boolean(),
})

export const UploadResponseDataSchema = z.object({
  url: z.string().url(),
})

export const FuelEntrySchema = z.object({
  id: z.string(),
  date: z.string().datetime().optional(),
  liters: z.number().nonnegative().optional(),
  pricePerLiter: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  odometer: z.number().int().nonnegative().optional(),
})

export const ListFuelEntriesResponseDataSchema = z.object({
  items: z.array(FuelEntrySchema),
})

export const ScanVehicleDocumentResponseDataSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  vin: z.string(),
})

export const VehicleDocumentTypeSchema = z.enum([
  'invoice',
  'inspection',
  'photo',
  'insurance',
  'other',
])

export const VehicleDocumentSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  maintenanceLogId: z.string().uuid().nullable(),
  type: VehicleDocumentTypeSchema,
  title: z.string(),
  storageKey: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  uploadedBy: z.string().uuid(),
  createdAt: z.string(),
})

export const ListVehicleDocumentsResponseDataSchema = z.object({
  items: z.array(VehicleDocumentSchema),
})

export const CreateVehicleDocumentBodySchema = z.object({
  maintenanceLogId: z.string().uuid().optional(),
  type: VehicleDocumentTypeSchema,
  title: z.string().min(1),
  storageKey: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
})

export const CreateVehicleDocumentResponseDataSchema = VehicleDocumentSchema

export const VehicleMemberRoleSchema = z.enum(['owner', 'manager', 'driver', 'viewer'])

export const VehicleMemberSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  role: VehicleMemberRoleSchema,
  assignedBy: z.string().uuid(),
  createdAt: z.string(),
})

export const ListVehicleMembersResponseDataSchema = z.object({
  items: z.array(VehicleMemberSchema),
})

export const UpsertVehicleMemberBodySchema = z.object({
  userId: z.string().uuid(),
  role: VehicleMemberRoleSchema,
})

export const UpsertVehicleMemberResponseDataSchema = VehicleMemberSchema
