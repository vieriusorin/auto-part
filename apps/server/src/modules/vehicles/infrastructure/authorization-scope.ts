import { maintenanceLog, users, vehicle, vehicleDocument, vehicleMember, vehicleReminder } from '@autocare/db'
import { and, eq, type SQL } from 'drizzle-orm'
import { buildSqlFilterFromPolicies } from '../../auth/application/policy-sql.js'

export const buildVehicleOwnershipScope = (
  vehicleId: string,
  organizationId: string,
): SQL =>
  and(
    eq(vehicle.id, vehicleId),
    buildSqlFilterFromPolicies([{ organizationId }], {
      organizationId: vehicle.organizationId,
    }) ?? eq(vehicle.organizationId, organizationId),
  ) as SQL

export const buildOrganizationVehicleScope = (organizationId: string): SQL =>
  buildSqlFilterFromPolicies([{ organizationId }], {
    organizationId: vehicle.organizationId,
  }) ?? eq(vehicle.organizationId, organizationId)

export const buildOrganizationMaintenanceScope = (
  maintenanceId: string,
  organizationId: string,
): SQL =>
  and(
    eq(maintenanceLog.id, maintenanceId),
    buildSqlFilterFromPolicies([{ organizationId }], {
      organizationId: vehicle.organizationId,
    }) ?? eq(vehicle.organizationId, organizationId),
  ) as SQL

export const buildOrganizationMaintenanceRangeScope = (organizationId: string): SQL =>
  buildSqlFilterFromPolicies([{ organizationId }], {
    organizationId: vehicle.organizationId,
  }) ?? eq(vehicle.organizationId, organizationId)

export const buildOrganizationUserScope = (userId: string, organizationId: string): SQL =>
  and(
    eq(users.id, userId),
    buildSqlFilterFromPolicies([{ organizationId }], {
      organizationId: users.organizationId,
    }) ?? eq(users.organizationId, organizationId),
  ) as SQL

export const buildReminderOwnershipScope = (
  reminderId: string,
  vehicleIdInt: number,
  organizationId: string,
): SQL =>
  and(
    eq(vehicleReminder.id, reminderId),
    eq(vehicleReminder.vehicleIdInt, vehicleIdInt),
    buildSqlFilterFromPolicies([{ organizationId }], {
      organizationId: vehicleReminder.organizationId,
    }) ?? eq(vehicleReminder.organizationId, organizationId),
  ) as SQL

export const buildVehicleDocumentScope = (vehicleIdInt: number, organizationId: string): SQL =>
  and(
    eq(vehicleDocument.vehicleIdInt, vehicleIdInt),
    buildSqlFilterFromPolicies([{ organizationId }], {
      organizationId: vehicleDocument.organizationId,
    }) ?? eq(vehicleDocument.organizationId, organizationId),
  ) as SQL

export const buildVehicleMemberScope = (vehicleIdInt: number, organizationId: string): SQL =>
  and(
    eq(vehicleMember.vehicleIdInt, vehicleIdInt),
    buildSqlFilterFromPolicies([{ organizationId }], {
      organizationId: vehicleMember.organizationId,
    }) ?? eq(vehicleMember.organizationId, organizationId),
  ) as SQL

export const buildVehicleReminderScope = (vehicleIdInt: number, organizationId: string): SQL =>
  and(
    eq(vehicleReminder.vehicleIdInt, vehicleIdInt),
    buildSqlFilterFromPolicies([{ organizationId }], {
      organizationId: vehicleReminder.organizationId,
    }) ?? eq(vehicleReminder.organizationId, organizationId),
  ) as SQL
