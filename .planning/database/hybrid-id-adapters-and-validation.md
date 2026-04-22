# Hybrid ID Adapters and Validation

## Adapter Strategy (Implemented for Vehicle Pilot)

Boundary contract remains UUID:

- HTTP route params and API payload IDs stay as UUID strings.
- Repository resolves UUID-owned entities and uses internal bigint IDs for joins and inserts.

Current adapter pattern:

1. Resolve ownership by public UUID (`vehicle.id` + `organization_id`).
2. Read `vehicle.id_int` as internal key.
3. Use `vehicle_id_int` and related bigint FKs in relational operations.
4. Dual-write UUID FK + bigint FK columns on insert/update.

## Applied in Code

- `apps/server/src/modules/vehicles/infrastructure/vehicle-repository.ts`
  - Internal `OwnedVehicleRef` with `internalId`
  - Bigint join path for maintenance/doc/member/reminder relations
  - Dual-write of UUID + BIGINT FK columns

## Validation Checklist

### Schema and Data Integrity

- Migration applies cleanly on fresh and existing DB.
- Every pilot table row has non-null `id_int`.
- Every pilot relationship has matching non-null `*_id_int`.
- UUID FK and BIGINT FK point to the same logical row.

### App Behavior

- Existing UUID endpoints still return and accept UUID IDs.
- Vehicle flows continue to work:
  - create/read/update vehicle
  - create/read/update maintenance log
  - create/list reminders
  - create/list documents
  - upsert/list vehicle members

### Build and Runtime Gates

- `npm run typecheck -w @autocare/server`
- `npm run db:migrate`
- `npm run db:seed`
- Relevant integration tests for vehicle module

### Performance Baseline (next phase)

- Compare UUID vs BIGINT join plans on:
  - list maintenance by vehicle
  - list documents by vehicle
  - list/upsert members
  - list reminders
