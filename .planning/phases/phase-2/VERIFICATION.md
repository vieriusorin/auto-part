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

## Window 5-22 Verification Addendum

### Verdict
**PASS (for planned window scope).**

### Verified outcomes
1. Paywall guardrails are enforced server-side (`403 paywall_not_eligible`, `409 trial_not_available`) and reflected in mobile UX.
2. Retention summary now derives from billing events plus explicit free-tier pre/post paywall rollup cohorts.
3. Month-2 payer lifecycle is implemented end-to-end (server route, shared contract, api-client hook, mobile trigger).
4. Subscription and report endpoint OpenAPI contracts now include explicit `401/403/409` coverage and stricter error schema assertions.
5. Access-control runtime tests validate unauthenticated/free/premium matrices for report surfaces.

### Evidence
- Runtime + analytics:
  - `apps/server/src/modules/reports/interfaces/http/report-routes.ts`
  - `apps/server/src/modules/reports/application/subscription-retention-summary.ts`
  - `apps/server/src/modules/reports/__tests__/subscription-retention-summary.test.ts`
  - `apps/server/src/modules/reports/__tests__/subscription-http.integration.test.ts`
- OpenAPI + access control:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - `apps/server/src/interfaces/http/__tests__/access-control.integration.test.ts`
  - `apps/server/src/interfaces/http/__tests__/test-helpers.ts`
- Client/mobile:
  - `packages/shared/src/contracts/subscription.ts`
  - `packages/api-client/src/react/hooks.ts`
  - `packages/api-client/src/react/index.ts`
  - `packages/api-client/src/react/hooks.test.ts`
  - `apps/mobile/app/(tabs)/insights/index.tsx`
  - `apps/mobile/app/(tabs)/costs/index.tsx`

### Commands and outcomes
- `npm run db:migrate` -> **PASS**
- `npm run db:seed` -> **PASS**
- `npm run db:verify:hybrid` -> **PASS**
- `npm run typecheck -w @autocare/server` -> **PASS**
- `npm run test:vitest -w @autocare/server` -> **PASS**
- `npm run typecheck -w @autocare/api-client` -> **PASS**
- `npm run test:vitest -w @autocare/api-client` -> **PASS**
- `npm run typecheck -w @autocare/mobile` -> **PASS**

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

---

## Window 23-27 Verification Addendum

### Verdict
**PASS (for planned window scope).**

### Verified outcomes
1. Subscription analytics events now capture request-derived context instead of static placeholders.
2. Analytics header sanitization/fallback behavior is deterministic and tested for malformed/missing/oversized values.
3. OpenAPI now documents analytics-context headers for instrumented subscription routes.
4. Subscription lifecycle event context is consistent across paywall/trial/conversion/month2/refund instrumentation paths.
5. Full server suite remains green after these hardening windows.

### Evidence
- Runtime/context handling:
  - `apps/server/src/modules/reports/interfaces/http/report-routes.ts`
  - `apps/server/src/modules/reports/application/subscription-analytics-context.ts`
- Test coverage:
  - `apps/server/src/modules/reports/__tests__/subscription-http.integration.test.ts`
  - `apps/server/src/modules/reports/__tests__/subscription-analytics-context.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
- OpenAPI registration:
  - `apps/server/src/interfaces/http/openapi/register-route.ts`

### Commands and outcomes
- `npm run typecheck -w @autocare/server` -> **PASS**
- `npm run test:vitest -w @autocare/server -- src/modules/reports/__tests__/subscription-http.integration.test.ts` -> **PASS**
- `npm run test:vitest -w @autocare/server -- src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> **PASS**
- `npm run test:vitest -w @autocare/server -- src/modules/reports/__tests__/subscription-analytics-context.test.ts` -> **PASS**
- `npm run test:vitest -w @autocare/server` -> **PASS** (`23` files, `80` passed, `12` skipped)

---

## Window 28-31 Verification Addendum

### Verdict
**PASS (for planned window scope).**

### Verified outcomes
1. Full server regression remains stable after windows 28-31 hardening.
2. Retention summary endpoint now scopes analytics events to organization users (with deterministic test-harness fallback to current user).
3. Subscription integration coverage includes organization-scope isolation expectations.
4. Report spend route null-safety warnings were eliminated without behavior regression.

### Evidence
- Runtime logic:
  - `apps/server/src/modules/reports/interfaces/http/report-routes.ts`
- Integration coverage:
  - `apps/server/src/modules/reports/__tests__/subscription-http.integration.test.ts`
- Supporting docs:
  - `.planning/phases/phase-2/EXECUTION.md`

### Commands and outcomes
- `npm run typecheck -w @autocare/server` -> **PASS**
- `npm run test:vitest -w @autocare/server -- src/modules/reports/__tests__/subscription-http.integration.test.ts` -> **PASS**
- `npm run test:vitest -w @autocare/server` -> **PASS** (`23` files, `81` passed, `12` skipped)
