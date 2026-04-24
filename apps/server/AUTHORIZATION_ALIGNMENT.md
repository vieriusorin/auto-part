# Authorization Alignment Guide (Single Source Of Truth)

This document defines where authorization lives, what must call it, and what to replace to avoid drift.

## Single Source Of Truth

The canonical authorization source is:

- `apps/server/src/modules/auth/application/authorization-service.ts`
- `apps/server/src/modules/auth/application/permission-builder.ts`
- `apps/server/src/modules/auth/application/document-abac.ts`
- `apps/server/src/modules/auth/application/policy-sql.ts`
- `packages/shared/src/contracts/auth.ts`
- `packages/shared/src/contracts/authorization.ts`

Rules:

- Every auth decision must flow through ABAC services/builders.
- Route handlers and repositories should not implement ad-hoc role logic.
- Shared contracts define action/resource vocabularies; no custom action strings in feature code.

## Layer Ownership

- **Contracts (shared):** action/resource types and authorization input/output models.
- **Policy engine (server auth):** decision logic, field-level logic, environment rules, SQL filter translation.
- **HTTP guards:** enforcement adapters only, no business policy branching.
- **Service/use-case layer:** calls centralized authorization methods.
- **DAL:** applies policy-derived filters/scopes.
- **UI/client:** consumes shared action types for UX gating, never used as backend enforcement.

## Alignment Checklist (with progress)

### Completed in this implementation

- [x] Shared actions/resources centralized in:
  - `packages/shared/src/contracts/auth.ts`
  - `packages/shared/src/contracts/authorization.ts`
- [x] Core action-level authorization centralized in `authorization-service.ts`
- [x] HTTP permission guard routes through ABAC:
  - `require-permission.middleware.ts`
- [x] HTTP plan guard routes through ABAC:
  - `require-plan.middleware.ts`
- [x] Service-level migrated checks:
  - organization invites use-case
  - trust policy guard
- [x] Field-level ABAC implemented for documents:
  - `permission-builder.ts`
  - `document-abac.ts`
- [x] Environment rule (weekend block for editor/author writes) implemented in ABAC policy
- [x] Policy-to-SQL translator added:
  - `policy-sql.ts`
- [x] DAL reusable auth scope helpers added:
  - `apps/server/src/modules/vehicles/infrastructure/authorization-scope.ts`
- [x] Documents module wired end-to-end with ABAC:
  - route enforcement
  - field filtering
  - DB-backed repository with fallback
- [x] Client permission helper aligned to shared action/permission contracts:
  - `packages/api-client/src/permissions.ts`
- [x] ABAC alignment doc created:
  - `apps/server/AUTHORIZATION_ALIGNMENT.md`

### Still to finish for full repo-wide alignment

- [~] Migrate all remaining resource modules to field-level ABAC where needed (documents/reports are complete; apply to new resources if product/security needs require it).
- [~] Remove any residual inline role branches in non-auth modules (migrated modules aligned; continue auditing new surfaces).
- [x] Ensure repository filters in migrated ABAC paths are policy-derived where practical.
- [x] Add automated drift checks in CI (for raw permission strings/inline role checks).
- [x] Keep `ACCESS_MATRIX.md` synchronized with recent endpoint migrations (continue on every new endpoint change).

## Where To Replace Remaining Logic

Search for and replace these patterns over time:

- `if (user.role === 'admin')` in feature modules (unless strictly composing ABAC subject attributes).
- direct permission string checks outside `auth` module.
- repeated organization ownership predicates in repositories not using shared scope/policy helpers.
- route-level custom authorization branches that do not call ABAC APIs.

Priority replacement targets:

1. Any route/module still constructing role-specific logic inline.
2. DAL queries with hardcoded access predicates not built from reusable scope/policy helpers.
3. UI-specific permission maps that diverge from shared action constants.

## Required Coding Pattern (reference)

1. Define/extend action/resource in shared contracts.
2. Add/extend policy in ABAC service/builder (including field/env rules if needed).
3. Call policy from:
   - guard middleware,
   - use-case/service,
   - repository filter builder.
4. Add tests:
   - decision unit tests,
   - integration tests for endpoint behavior,
   - field filtering tests if applicable,
   - policy->SQL tests for DAL filters.

## Resource Onboarding Checklist

When adding a new protected resource (for example `project`):

- [ ] Add `project.*` actions to `AuthorizationActionSchema`.
- [ ] Add `project` to `AuthorizationResourceTypeSchema`.
- [ ] Add constants to `AuthorizationActions`/`AuthorizationResourceTypes`.
- [ ] Add policy rules in ABAC layer (action + field + environment if needed).
- [ ] Route middleware uses ABAC-based guards only.
- [ ] Use-case/business logic calls ABAC decision methods.
- [ ] Repository applies ABAC-derived scope/filter.
- [ ] Add unit + integration tests.
- [ ] Update `ACCESS_MATRIX.md` if endpoint surface changed.

## Drift Detection Checklist

Run this quick audit before merge:

- [x] No new raw permission strings in migrated feature modules.
- [x] No new role branching outside auth policy modules for migrated paths.
- [x] New migrated endpoints enforce ABAC via guards/services.
- [x] DAL queries in migrated paths use shared scope/policy helpers.
- [x] Client permissions use shared action constants.
- [x] Tests cover allow + deny + reason-code paths for new ABAC flows.

Automated guards now live in:

- `apps/server/src/modules/auth/__tests__/authorization-drift.test.ts`
  - blocks raw permission literals outside approved auth/policy files
  - blocks inline role branching outside approved auth policy modules

## Current Implementation References

- Core ABAC service: `apps/server/src/modules/auth/application/authorization-service.ts`
- Builder and field logic: `apps/server/src/modules/auth/application/permission-builder.ts`
- Document ABAC policies: `apps/server/src/modules/auth/application/document-abac.ts`
- Policy-to-SQL translator: `apps/server/src/modules/auth/application/policy-sql.ts`
- Guard adapters:
  - `apps/server/src/modules/auth/interfaces/http/require-permission.middleware.ts`
  - `apps/server/src/modules/auth/interfaces/http/require-plan.middleware.ts`
- Migrated service checks:
  - `apps/server/src/modules/auth/application/organization-invite-use-cases.ts`
  - `apps/server/src/modules/trust/policy-guards.ts`
- DAL scope helpers:
  - `apps/server/src/modules/vehicles/infrastructure/authorization-scope.ts`
  - `apps/server/src/modules/documents/infrastructure/document-repository.ts`
- Module scope helper references:
  - `apps/server/src/modules/reports/application/report-access-scope.ts`
  - `apps/server/src/modules/affiliate/application/affiliate-access-scope.ts`
  - `apps/server/src/modules/analytics/application/analytics-access-scope.ts`
  - `apps/server/src/modules/audit/application/audit-access-scope.ts`
  - `apps/server/src/modules/core/application/core-access-scope.ts`
  - `apps/server/src/modules/trust/application/trust-access-scope.ts`

