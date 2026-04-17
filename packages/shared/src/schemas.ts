import { z } from 'zod'

export const createVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900),
  vin: z.string().min(6),
})

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  odometer: z.number().int().nonnegative(),
  category: z.string().min(1),
  description: z.string().optional(),
  totalCost: z.number().nonnegative().optional(),
})

export const syncPayloadSchema = z.object({
  actions: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      payload: z.record(z.any()),
    }),
  ),
})
