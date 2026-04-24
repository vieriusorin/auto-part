# ABAC Migration Progress Tracker

This file tracks ABAC migration status across the server so we can resume safely at any time.

## Legend

- [x] Completed
- [~] In progress / partial
- [ ] Not started

## Global Foundations

- [x] Shared action/resource contracts defined in:
  - `packages/shared/src/contracts/auth.ts`
  - `packages/shared/src/contracts/authorization.ts`
- [x] Central authorization service in:
  - `apps/server/src/modules/auth/application/authorization-service.ts`
- [x] Permission builder + field-level ABAC support in:
  - `apps/server/src/modules/auth/application/permission-builder.ts`
- [x] Environment-based rule support (weekend example) implemented
- [x] Policy-to-SQL converter in:
  - `apps/server/src/modules/auth/application/policy-sql.ts`
- [x] User access scope helpers in:
  - `apps/server/src/modules/auth/application/access-scope.ts`
- [x] Legacy compatibility `application/permissions.ts` removed

## Cross-Layer Integration

- [x] HTTP auth/permission/plan guards use centralized ABAC paths
- [x] Invite/trust service checks migrated to centralized ABAC checks
- [x] DAL policy-derived filtering applied across migrated modules (documents, vehicles, reports/analytics, affiliate)
- [x] Access matrix/docs updated (keep synchronized as new endpoints evolve)

## Module-by-Module Status

### Auth

- [x] Centralized permission derivation for authenticated user context
- [x] Auth routes cleanup (removed non-null assertions, explicit guards)
- [x] Tests updated and passing

### Documents

- [x] ABAC-aware route handlers
- [x] Field-level read filtering
- [x] Field-level write filtering
- [x] Weekend environment restriction for editor/author writes
- [x] Resource access scope enforcement (creator/elevated)
- [x] Policy-derived SQL filtering integrated
- [x] DB table + migration added:
  - `packages/db/src/migrations/0012_documents_abac.sql`

### Vehicles

- [x] Reusable auth scope helper file introduced:
  - `apps/server/src/modules/vehicles/infrastructure/authorization-scope.ts`
- [x] Repository usage of shared scope helpers applied to migrated paths
- [x] Full conversion to policy-derived filters for all vehicle queries
- [x] Resource access scope helper integration applied (including trust actor role path)

### Reports

- [x] Canonical shared action constants used for permission checks
- [x] Resource-scope helper integration
- [x] Policy-derived filtering where applicable
- [x] Field-level response filtering (if needed by product/security requirements)

### Affiliate

- [x] Canonical shared action constants used for permission checks
- [x] Resource-scope helper integration
- [x] Policy-derived filtering for admin analytics surfaces

### Analytics

- [x] Canonical shared action constants used for permission checks
- [x] Access-scope helper integration for dashboard/data visibility

### Audit

- [x] Canonical shared action constants used for permission checks
- [x] Access-scope helper integration if per-tenant scoping is required

### Banners / Utility / Core / Trust / Consent / AI

- [x] Uses auth guards and existing route-level checks
- [x] Review each module for:
  - residual inline role logic,
  - policy-derived scope filters,
  - field-level rules where relevant

## Remaining Work Queue (Recommended Order)

1. [x] Apply `access-scope` pattern across `vehicles`, `reports`, `affiliate`, `analytics`.
2. [x] Replace remaining ad-hoc repository filters with policy-derived SQL helpers where possible.
3. [x] Add module-level ABAC integration tests per migrated module.
4. [x] Add CI drift checks:
   - prevent new raw permission strings outside auth/policy files,
   - prevent inline role branching outside approved policy modules.
5. [x] Keep `ACCESS_MATRIX.md` synced with every endpoint migration.

## Quality Gates Before Marking Migration Complete

- [x] Server typecheck passes.
- [x] Authorization unit tests pass.
- [x] Integration tests for migrated modules pass.
- [x] No new linter warnings in touched files.
- [x] Documentation (`AUTHORIZATION_ALIGNMENT.md`, `ACCESS_MATRIX.md`, this file) updated.

## Last Confirmed Completed In This Session

- [x] Added `access-scope` helper layer.
- [x] Wired documents module to use access scope in routes + repository.
- [x] Added tests:
  - `apps/server/src/modules/auth/__tests__/access-scope.test.ts`
  - updated `apps/server/src/modules/documents/__tests__/document-http.integration.test.ts`
- [x] Started vehicles access-scope adoption:
  - trust actor role now resolved via `access-scope` helper
  - maintenance range org filter now routes through policy-derived scope helper

