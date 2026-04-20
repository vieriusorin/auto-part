import {
  CreateMaintenanceBodySchema,
  CreateMaintenanceResponseDataSchema,
  CreateVehicleDocumentBodySchema,
  CreateVehicleDocumentResponseDataSchema,
  CreateVehicleResponseDataSchema,
  createVehicleSchema,
  ListFuelEntriesResponseDataSchema,
  ListMaintenanceLogsResponseDataSchema,
  ListVehicleDocumentsResponseDataSchema,
  ListVehicleMembersResponseDataSchema,
  ListVehiclesResponseDataSchema,
  LockVehicleResponseDataSchema,
  MaintenanceIdParamsSchema,
  ScanVehicleDocumentResponseDataSchema,
  UpdateMaintenanceBodySchema,
  UpdateMaintenanceResponseDataSchema,
  UpsertVehicleMemberBodySchema,
  UpsertVehicleMemberResponseDataSchema,
  updateVehicleBodySchema,
  UploadResponseDataSchema,
  VehicleIdParamsSchema,
  VehicleResponseSchema,
} from '@autocare/shared'
import type { Request, RequestHandler } from 'express'
import { Router } from 'express'
import { registerRoute } from '../../../../interfaces/http/openapi/index.js'
import { commonPresenter } from '../../../../presenters/common.presenter.js'
import { appendAuditLog } from '../../../../services/auditLog.js'
import { computeIntegrityHash } from '../../../../services/integrity.js'
import type { AuthModule } from '../../../auth/auth-module.js'
import {
  createAuthHttpGuards,
  type AuthHttpGuards,
} from '../../../auth/interfaces/http/auth-http-guards.js'
import { enforceTrustPolicy } from '../../../trust/policy-middleware.js'
import {
  createVehicleRepository,
  type MaintenanceLogRow,
  type VehicleDocumentRow,
  type VehicleMemberRow,
  type VehicleRepository,
  type VehicleRow,
} from '../../infrastructure/vehicle-repository.js'

const VEHICLES_TAG = 'Vehicles'
const UTILITY_TAG = 'Utility'

const toIso = (d: Date): string => d.toISOString()

const mapVehicle = (row: VehicleRow) => ({
  id: row.id,
  make: row.make,
  model: row.model,
  year: row.year,
  vin: row.vin,
  plate: row.plate ?? null,
  currentOdometer: row.currentOdometer,
  isLocked: row.isLocked,
  createdAt: toIso(row.createdAt),
})

const mapMaintenance = (row: MaintenanceLogRow) => ({
  id: row.id,
  vehicleId: row.vehicleId,
  date: toIso(row.date),
  odometer: row.odometer,
  category: row.category,
  description: row.description ?? null,
  totalCost: row.totalCost ?? null,
  integrityHash: row.integrityHash,
  createdAt: toIso(row.createdAt),
  updatedAt: toIso(row.updatedAt),
})

const mapVehicleDocument = (row: VehicleDocumentRow) => ({
  id: row.id,
  vehicleId: row.vehicleId,
  maintenanceLogId: row.maintenanceLogId ?? null,
  type: row.type as 'invoice' | 'inspection' | 'photo' | 'insurance' | 'other',
  title: row.title,
  storageKey: row.storageKey,
  mimeType: row.mimeType,
  sizeBytes: row.sizeBytes,
  uploadedBy: row.uploadedBy,
  createdAt: toIso(row.createdAt),
})

const mapVehicleMember = (row: VehicleMemberRow) => ({
  id: row.id,
  vehicleId: row.vehicleId,
  userId: row.userId,
  role: row.role as 'owner' | 'manager' | 'driver' | 'viewer',
  assignedBy: row.assignedBy,
  createdAt: toIso(row.createdAt),
})

const requireOrganizationId =
  (present: (req: Request) => string | null | undefined): RequestHandler =>
  (req, res, next) => {
    const orgId = present(req)
    if (!orgId) {
      commonPresenter.error(
        res,
        403,
        'organization_required',
        'Authenticated organization context is required',
      )
      return
    }
    next()
  }

const createMaintenanceTrustMiddleware =
  (repos: VehicleRepository): RequestHandler =>
  async (req, res, next) => {
    const user = req.user
    const orgId = user?.organizationId
    const maintenanceId = req.params.maintenanceId
    if (!user || !orgId || typeof maintenanceId !== 'string') {
      commonPresenter.error(res, 401, 'not_authenticated', 'Authentication required')
      return
    }
    const log = await repos.findMaintenanceOwned(maintenanceId, orgId)
    if (!log) {
      commonPresenter.error(res, 404, 'not_found', 'Maintenance log not found')
      return
    }
    const veh = await repos.findOwned(log.vehicleId, orgId)
    const locked = Boolean(veh?.isLocked || log.lockedAt)
    const r = req as Request & { trustLocked?: boolean; userRole?: 'member' | 'admin' | 'service' }
    r.trustLocked = locked
    r.userRole = user.role === 'admin' ? 'admin' : 'member'
    next()
  }

export const createVehicleRouter = (authModule: AuthModule, guards?: AuthHttpGuards): Router => {
  const router = Router()
  const repos = createVehicleRepository(authModule.db)
  const authGuards = guards ?? createAuthHttpGuards(authModule)
  const requirePermission = (permission: string): RequestHandler =>
    authGuards.requirePermission(permission)
  const requireAuthOnly: RequestHandler = authGuards.requireAuth

  const requireOrg = requireOrganizationId((req) => req.user?.organizationId ?? null)
  const requirePremium = authGuards.requirePlan({ minimumPlan: 'premium' })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/vehicles',
    tags: [VEHICLES_TAG],
    summary: 'List vehicles for the current organization',
    operationId: 'listVehicles',
    middlewares: [requirePermission('vehicles.read'), requireOrg],
    responses: {
      200: {
        description: 'Vehicles',
        dataSchema: ListVehiclesResponseDataSchema,
      },
    },
    handler: async ({ req, res }) => {
      const orgId = req.user?.organizationId as string
      const rows = await repos.listForOrganization(orgId)
      commonPresenter.ok(res, { items: rows.map(mapVehicle) })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/vehicles/:id/documents',
    tags: [VEHICLES_TAG],
    summary: 'List media/documents for a vehicle timeline',
    operationId: 'listVehicleDocuments',
    params: VehicleIdParamsSchema,
    middlewares: [requirePermission('vehicles.read'), requireOrg],
    responses: {
      200: {
        description: 'Vehicle documents',
        dataSchema: ListVehicleDocumentsResponseDataSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const orgId = req.user?.organizationId as string
      const vehicleId = params?.id ?? ''
      const owned = await repos.findOwned(vehicleId, orgId)
      if (!owned) {
        commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
        return
      }
      const docs = await repos.listDocumentsForVehicle(vehicleId, orgId)
      commonPresenter.ok(res, { items: docs.map(mapVehicleDocument) })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/vehicles/:id/documents',
    tags: [VEHICLES_TAG],
    summary: 'Attach media/document evidence to a vehicle',
    operationId: 'createVehicleDocument',
    params: VehicleIdParamsSchema,
    body: CreateVehicleDocumentBodySchema,
    middlewares: [requirePermission('logs.create'), requireOrg],
    responses: {
      201: {
        description: 'Vehicle document created',
        dataSchema: CreateVehicleDocumentResponseDataSchema,
      },
    },
    handler: async ({ req, res, params, body }) => {
      const orgId = req.user?.organizationId as string
      const vehicleId = params?.id ?? ''
      const userId = req.user?.id ?? 'unknown'
      try {
        const created = await repos.createDocument({
          vehicleId,
          organizationId: orgId,
          maintenanceLogId: body?.maintenanceLogId,
          type: body?.type ?? 'other',
          title: body?.title ?? '',
          storageKey: body?.storageKey ?? '',
          mimeType: body?.mimeType ?? '',
          sizeBytes: body?.sizeBytes ?? 0,
          uploadedBy: userId,
        })
        appendAuditLog({
          entityType: 'maintenance_log',
          entityId: created.id,
          action: 'create',
          oldValues: null,
          newValues: {
            vehicleId,
            maintenanceLogId: created.maintenanceLogId,
            type: created.type,
            storageKey: created.storageKey,
          },
          userId,
        })
        commonPresenter.created(res, mapVehicleDocument(created))
      } catch (e) {
        if (e instanceof Error && e.message === 'vehicle_not_found') {
          commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
          return
        }
        if (e instanceof Error && e.message === 'maintenance_not_found') {
          commonPresenter.error(res, 404, 'not_found', 'Maintenance log not found')
          return
        }
        throw e
      }
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/vehicles/:id/members',
    tags: [VEHICLES_TAG],
    summary: 'List assigned members for a vehicle',
    operationId: 'listVehicleMembers',
    params: VehicleIdParamsSchema,
    middlewares: [requirePermission('vehicles.read'), requireOrg],
    responses: {
      200: {
        description: 'Vehicle members',
        dataSchema: ListVehicleMembersResponseDataSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const orgId = req.user?.organizationId as string
      const vehicleId = params?.id ?? ''
      const owned = await repos.findOwned(vehicleId, orgId)
      if (!owned) {
        commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
        return
      }
      const members = await repos.listVehicleMembers(vehicleId, orgId)
      commonPresenter.ok(res, { items: members.map(mapVehicleMember) })
    },
  })

  registerRoute(router, '/api', {
    method: 'put',
    path: '/vehicles/:id/members',
    tags: [VEHICLES_TAG],
    summary: 'Assign or update a vehicle member role',
    operationId: 'upsertVehicleMember',
    params: VehicleIdParamsSchema,
    body: UpsertVehicleMemberBodySchema,
    middlewares: [requirePermission('admin.users.manage'), requireOrg],
    responses: {
      200: {
        description: 'Vehicle member updated',
        dataSchema: UpsertVehicleMemberResponseDataSchema,
      },
    },
    handler: async ({ req, res, params, body }) => {
      const orgId = req.user?.organizationId as string
      const vehicleId = params?.id ?? ''
      const assignedBy = req.user?.id ?? 'unknown'
      try {
        const member = await repos.upsertVehicleMember({
          vehicleId,
          organizationId: orgId,
          userId: body?.userId ?? '',
          role: (body?.role ?? 'viewer') as 'owner' | 'manager' | 'driver' | 'viewer',
          assignedBy,
        })
        appendAuditLog({
          entityType: 'maintenance_log',
          entityId: vehicleId,
          action: 'update',
          oldValues: null,
          newValues: {
            memberUserId: member.userId,
            role: member.role,
          },
          userId: assignedBy,
        })
        commonPresenter.ok(res, mapVehicleMember(member))
      } catch (e) {
        if (e instanceof Error && e.message === 'vehicle_not_found') {
          commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
          return
        }
        if (e instanceof Error && e.message === 'user_not_in_organization') {
          commonPresenter.error(
            res,
            400,
            'invalid_member',
            'User must belong to the same organization',
          )
          return
        }
        throw e
      }
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/vehicles',
    tags: [VEHICLES_TAG],
    summary: 'Create a vehicle',
    operationId: 'createVehicle',
    body: createVehicleSchema,
    middlewares: [requirePermission('vehicles.create'), requireOrg],
    responses: {
      201: {
        description: 'Vehicle created',
        dataSchema: CreateVehicleResponseDataSchema,
      },
    },
    handler: async ({ req, res, body }) => {
      const orgId = req.user?.organizationId as string
      const row = await repos.create(orgId, body!)
      commonPresenter.created(res, mapVehicle(row))
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/vehicles/:id',
    tags: [VEHICLES_TAG],
    summary: 'Get vehicle by id',
    operationId: 'getVehicle',
    params: VehicleIdParamsSchema,
    middlewares: [requirePermission('vehicles.read'), requireOrg],
    responses: {
      200: {
        description: 'Vehicle',
        dataSchema: VehicleResponseSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const orgId = req.user?.organizationId as string
      const id = params?.id ?? ''
      const row = await repos.findOwned(id, orgId)
      if (!row) {
        commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
        return
      }
      commonPresenter.ok(res, mapVehicle(row))
    },
  })

  registerRoute(router, '/api', {
    method: 'put',
    path: '/vehicles/:id',
    tags: [VEHICLES_TAG],
    summary: 'Update vehicle',
    operationId: 'updateVehicle',
    params: VehicleIdParamsSchema,
    body: updateVehicleBodySchema,
    middlewares: [requirePermission('vehicles.update'), requireOrg],
    responses: {
      200: {
        description: 'Vehicle updated',
        dataSchema: VehicleResponseSchema,
      },
    },
    handler: async ({ req, res, params, body }) => {
      const orgId = req.user?.organizationId as string
      const id = params?.id ?? ''
      const patch = body ?? {}
      const row = await repos.updateOwned(id, orgId, patch)
      if (!row) {
        commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
        return
      }
      commonPresenter.ok(res, mapVehicle(row))
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/vehicles/:id/maintenance',
    tags: [VEHICLES_TAG],
    summary: 'List maintenance logs for a vehicle',
    operationId: 'listMaintenanceLogs',
    params: VehicleIdParamsSchema,
    middlewares: [requirePermission('logs.read'), requireOrg],
    responses: {
      200: {
        description: 'Maintenance logs',
        dataSchema: ListMaintenanceLogsResponseDataSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const orgId = req.user?.organizationId as string
      const vehicleId = params?.id ?? ''
      const owned = await repos.findOwned(vehicleId, orgId)
      if (!owned) {
        commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
        return
      }
      const logs = await repos.listMaintenanceForVehicle(vehicleId, orgId)
      commonPresenter.ok(res, { items: logs.map(mapMaintenance) })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/vehicles/:id/lock',
    tags: [VEHICLES_TAG],
    summary: 'Lock a vehicle',
    operationId: 'lockVehicle',
    params: VehicleIdParamsSchema,
    middlewares: [requirePermission('vehicles.update'), requireOrg],
    responses: {
      200: {
        description: 'Vehicle lock status',
        dataSchema: LockVehicleResponseDataSchema,
      },
    },
    handler: async ({ req, res, params }) => {
      const orgId = req.user?.organizationId as string
      const id = params?.id ?? ''
      const row = await repos.updateOwned(id, orgId, { isLocked: true })
      if (!row) {
        commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
        return
      }
      const userId = req.user?.id ?? 'unknown'
      appendAuditLog({
        entityType: 'maintenance_log',
        entityId: id,
        action: 'update',
        oldValues: null,
        newValues: { locked: true },
        userId,
      })
      commonPresenter.ok(res, { locked: row.isLocked })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/vehicles/:id/maintenance',
    tags: [VEHICLES_TAG],
    summary: 'Create maintenance log',
    operationId: 'createMaintenanceLog',
    params: VehicleIdParamsSchema,
    body: CreateMaintenanceBodySchema,
    middlewares: [requirePermission('logs.create'), requireOrg],
    responses: {
      201: {
        description: 'Maintenance entry created',
        dataSchema: CreateMaintenanceResponseDataSchema,
      },
    },
    handler: async ({ req, res, params, body }) => {
      const orgId = req.user?.organizationId as string
      const vehicleId = params?.id ?? ''
      const userId = req.user?.id ?? 'unknown'
      const payload = { ...body, vehicleId }
      const integrityHash = computeIntegrityHash(payload)
      try {
        const created = await repos.createMaintenanceLog({
          vehicleId,
          organizationId: orgId,
          odometer: body?.odometer ?? 0,
          category: body?.category ?? '',
          description: body?.description,
          totalCost: body?.totalCost,
          integrityHash,
        })
        appendAuditLog({
          entityType: 'maintenance_log',
          entityId: created.id,
          action: 'create',
          oldValues: null,
          newValues: { ...body, integrityHash, vehicleId },
          userId,
        })
        commonPresenter.created(res, { integrityHash })
      } catch (e) {
        if (e instanceof Error && e.message === 'vehicle_not_found') {
          commonPresenter.error(res, 404, 'not_found', 'Vehicle not found')
          return
        }
        throw e
      }
    },
  })

  registerRoute(router, '/api', {
    method: 'put',
    path: '/vehicles/:id/maintenance/:maintenanceId',
    tags: [VEHICLES_TAG],
    summary: 'Update maintenance log',
    operationId: 'updateMaintenanceLog',
    params: MaintenanceIdParamsSchema,
    body: UpdateMaintenanceBodySchema,
    middlewares: [
      requirePermission('logs.update'),
      requireOrg,
      createMaintenanceTrustMiddleware(repos),
      enforceTrustPolicy,
    ],
    responses: {
      200: {
        description: 'Maintenance entry updated',
        dataSchema: UpdateMaintenanceResponseDataSchema,
      },
    },
    handler: async ({ req, res, params, body }) => {
      const orgId = req.user?.organizationId as string
      const maintenanceId = params?.maintenanceId ?? ''
      const userId = req.user?.id ?? 'unknown'
      const patch = (body as Record<string, unknown>) ?? {}
      const integrityHash = computeIntegrityHash({ ...patch, maintenanceId })
      const updated = await repos.updateMaintenanceOwned(
        maintenanceId,
        orgId,
        patch,
        integrityHash,
      )
      if (!updated) {
        commonPresenter.error(res, 404, 'not_found', 'Maintenance log not found')
        return
      }
      appendAuditLog({
        entityType: 'maintenance_log',
        entityId: maintenanceId,
        action: 'update',
        oldValues: { placeholder: true },
        newValues: patch,
        userId,
      })
      commonPresenter.ok(res, { ok: true })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/upload',
    tags: [UTILITY_TAG],
    summary: 'Upload a file',
    operationId: 'createUpload',
    middlewares: [requireAuthOnly],
    responses: {
      201: {
        description: 'Upload URL created',
        dataSchema: UploadResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.created(res, { url: 'https://example.r2.dev/file.jpg' })
    },
  })

  registerRoute(router, '/api', {
    method: 'get',
    path: '/vehicles/:id/fuel',
    tags: [VEHICLES_TAG],
    summary: 'List fuel entries for vehicle',
    operationId: 'listFuelEntries',
    params: VehicleIdParamsSchema,
    middlewares: [requirePermission('vehicles.read'), requireOrg],
    responses: {
      200: {
        description: 'Fuel entries list',
        dataSchema: ListFuelEntriesResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, { items: [] })
    },
  })

  registerRoute(router, '/api', {
    method: 'post',
    path: '/vehicles/scan-document',
    tags: [VEHICLES_TAG],
    summary: 'Scan vehicle document',
    operationId: 'scanVehicleDocument',
    middlewares: [requirePermission('vehicles.create'), requireOrg, requirePremium],
    responses: {
      200: {
        description: 'Extracted vehicle info',
        dataSchema: ScanVehicleDocumentResponseDataSchema,
      },
    },
    handler: ({ res }) => {
      commonPresenter.ok(res, {
        make: 'Skoda',
        model: 'Octavia',
        year: 2020,
        vin: 'WVWZZZ1JZXW000001',
      })
    },
  })

  return router
}
