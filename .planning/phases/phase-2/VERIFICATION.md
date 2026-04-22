---
phase: phase-2-subscription-fit-window-3
verified: 2026-04-21
status: passed
scope: window-3 (retention summary hardening + subscription endpoint integration)
---

# Phase 2 Window 3 Verification Report

## Verdict
**PASS (for planned window scope).**

## Verified outcomes
1. Cancellation reasons are persisted and exposed via summary endpoint.
2. Subscription retention summary endpoint is exposed and consumed by mobile insights.
3. Subscription HTTP integration path is covered with DB-backed test (when DATABASE_URL is available).
4. OpenAPI and API types remain aligned with server contract changes.

## Evidence
- Server integration test:
  - `apps/server/src/modules/reports/__tests__/subscription-http.integration.test.ts`
- Server endpoint implementation:
  - `apps/server/src/modules/reports/interfaces/http/report-routes.ts`
- DB persistence:
  - `packages/db/src/schema.ts`
  - `packages/db/src/migrations/0010_subscription_cancellations.sql`
- Client/mobile consumption:
  - `packages/api-client/src/react/hooks.ts`
  - `apps/mobile/app/(tabs)/insights/index.tsx`

## Commands and outcomes
- `npm run openapi:generate -w @autocare/server` -> **PASS**
- `npx openapi-typescript .../apps/server/openapi.json -o .../packages/api-client/src/types.gen.ts` -> **PASS**
- `npm run typecheck -w @autocare/server` -> **PASS**
- `npm run typecheck -w @autocare/api-client` -> **PASS**
- `npm run typecheck -w @autocare/mobile` -> **PASS**
- `npm run test:vitest -w @autocare/api-client` -> **PASS**
- `npm run test:vitest -w @autocare/mobile` -> **PASS**

## Notes
- `npm run db:migrate -w @autocare/db` failed in this environment due to unresolved DB host (`postgres`).
- DB-backed subscription integration test is guarded with `describe.skipIf(!process.env.DATABASE_URL)`.

---

## Window 4 Verification Addendum (Hybrid-ID Reliability Hardening)

### Verdict
**PASS (for planned window scope).**

### Verified outcomes
1. Hybrid ID migrations (`0011`, `0012`) apply cleanly and preserve UUID external contract.
2. Seed data now produces valid BIGINT shadow FK consistency for vehicles/auth/banners/subscription pathways.
3. Runtime verification script confirms `id_int` and `*_id_int` integrity across pilot and extension tables.
4. Server integration paths remain stable after auth guard alignment and `subscription/cancel` persistence hardening.

### Evidence
- Migrations:
  - `packages/db/src/migrations/0011_hybrid_ids_vehicle_pilot.sql`
  - `packages/db/src/migrations/0012_hybrid_ids_auth_banner.sql`
- Verification script:
  - `apps/server/scripts/db-verify-hybrid.ts`
- Runtime hardening:
  - `apps/server/src/modules/reports/interfaces/http/report-routes.ts`
  - `apps/server/src/modules/vehicles/infrastructure/vehicle-repository.ts`
  - `apps/server/src/modules/auth/infrastructure/refresh-token-repository.ts`
  - `apps/server/src/modules/auth/infrastructure/organization-invite-repository.ts`
  - `apps/server/src/modules/banners/infrastructure/banner-repository.ts`

### Commands and outcomes
- `npm run db:migrate` -> **PASS**
- `npm run db:seed` -> **PASS**
- `npm run db:verify:hybrid` -> **PASS**
- `npm run typecheck -w @autocare/server` -> **PASS**
- `npm run test:vitest -w @autocare/server` -> **PASS**
