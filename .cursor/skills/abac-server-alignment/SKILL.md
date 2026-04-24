---
name: abac-server-alignment
description: Apply Autocare server ABAC conventions across HTTP routes, service/use-case layer, and DAL/repositories. Use when adding or refactoring protected endpoints, permission checks, scope helpers, or policy-derived SQL filters in apps/server.
---

# ABAC Server Alignment

## Use This Skill

Use for `apps/server` work that touches:
- permission/plan enforcement
- resource visibility/scoping
- repository access filters
- trust/consent/core route ownership checks
- access matrix or ABAC migration docs

Do not use for simple UI-only gating or unrelated infra scripts.

## Source Of Truth

Authorization policy and contracts live in:
- `apps/server/src/modules/auth/application/authorization-service.ts`
- `apps/server/src/modules/auth/application/permission-builder.ts`
- `apps/server/src/modules/auth/application/policy-sql.ts`
- `apps/server/src/modules/auth/application/access-scope.ts`
- `packages/shared/src/contracts/auth.ts`
- `packages/shared/src/contracts/authorization.ts`

Follow these rules:
- no new raw permission string literals outside approved auth/policy files
- no inline role branching in feature modules when a scope helper can express it
- route handlers enforce, service/use-case decides, DAL filters

## Required Implementation Pattern

1. **Route layer**
   - Use auth guards (`requireAuth`, `requirePermission`, `requirePlan`).
   - Resolve module-specific scope helper from `req.user`.
   - Reject missing auth/params/body with explicit `401/400`.

2. **Service/use-case layer**
   - Call centralized authorization APIs; avoid local role branching.
   - Keep domain-specific checks in module scope helpers where needed.

3. **DAL/repository layer**
   - Prefer `buildSqlFilterFromPolicies(...)` for access predicates.
   - Use module scope helper conditions first, fallback to explicit equality only when needed.

4. **Response filtering**
   - For sensitive data, add field-level response filters based on scope.
   - Keep schema-compatible payloads (redact values/collections, don’t break contracts).

## Existing Module Patterns (Reference)

- Reports scope/filtering:
  - `apps/server/src/modules/reports/application/report-access-scope.ts`
  - `apps/server/src/modules/reports/application/report-field-filter.ts`
- Affiliate scope/filtering:
  - `apps/server/src/modules/affiliate/application/affiliate-access-scope.ts`
- Analytics scope helper:
  - `apps/server/src/modules/analytics/application/analytics-access-scope.ts`
- Audit scoped visibility:
  - `apps/server/src/modules/audit/application/audit-access-scope.ts`
- Core scoped target checks:
  - `apps/server/src/modules/core/application/core-access-scope.ts`
- Trust scoped target checks:
  - `apps/server/src/modules/trust/application/trust-access-scope.ts`
- Vehicle DAL scope helpers:
  - `apps/server/src/modules/vehicles/infrastructure/authorization-scope.ts`

## Validation Checklist

After changes:
- run `npm run typecheck -w @autocare/server`
- run focused tests for touched modules (integration + auth unit tests)
- run lint diagnostics on touched files

Also keep docs in sync when behavior changes:
- `apps/server/ACCESS_MATRIX.md`
- `apps/server/ABAC_MIGRATION_PROGRESS.md`
- `apps/server/AUTHORIZATION_ALIGNMENT.md`

## Drift Guard

Never bypass these checks:
- `apps/server/src/modules/auth/__tests__/authorization-drift.test.ts`
  - permission literal guard
  - inline role-branching guard

