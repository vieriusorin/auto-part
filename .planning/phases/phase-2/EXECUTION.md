# Phase 2 Window 1 Execution

## Status
Implemented in working tree; locally verified.

## Implemented
- Shared subscription contracts:
  - `packages/shared/src/contracts/subscription.ts`
  - exported via `packages/shared/src/contracts/index.ts`
- Server subscription endpoints in reports module:
  - `GET /api/subscription/status`
  - `GET /api/subscription/offers`
  - `POST /api/subscription/trial/start`
  - `POST /api/subscription/cancel`
  - file: `apps/server/src/modules/reports/interfaces/http/report-routes.ts`
- API client hooks:
  - `useSubscriptionStatus`
  - `useSubscriptionOffers`
  - `useStartSubscriptionTrial`
  - `useCancelSubscription`
  - files: `packages/api-client/src/react/hooks.ts`, `packages/api-client/src/react/index.ts`, `packages/api-client/src/query-keys.ts`
- Mobile paywall/trial/cancel UI:
  - `apps/mobile/app/(tabs)/costs/index.tsx`

## Notes
- Paywall eligibility is guarded by a value milestone (at least one maintenance log in last 30 days).
- Trial/cancel uses org plan updates through existing auth user repository.

---

## Window 2 execution (retention + guardrails depth)

### Implemented
- cancellation persistence:
  - `packages/db/src/schema.ts` (`subscriptionCancellation`)
  - `packages/db/src/migrations/0010_subscription_cancellations.sql`
- server endpoints:
  - `GET /api/subscription/cancel-reasons`
  - `GET /api/subscription/retention-summary`
  - `POST /api/subscription/cancel` now persists reason/feedback
  - file: `apps/server/src/modules/reports/interfaces/http/report-routes.ts`
- contracts:
  - `packages/shared/src/contracts/subscription.ts` (cancel reason summary + retention summary schemas)
- api-client:
  - `useSubscriptionCancelReasons`
  - `useSubscriptionRetentionSummary`
  - query keys for `cancel-reasons` and `retention-summary`
- mobile insights:
  - subscription health section + cancellation reason list in `apps/mobile/app/(tabs)/insights/index.tsx`

### Verification
- `npm run openapi:generate -w @autocare/server` -> PASS
- `npx openapi-typescript .../apps/server/openapi.json -o .../packages/api-client/src/types.gen.ts` -> PASS
- `npm run typecheck -w @autocare/server` -> PASS
- `npm run typecheck -w @autocare/api-client` -> PASS
- `npm run typecheck -w @autocare/mobile` -> PASS
- `npm run test:vitest -w @autocare/api-client` -> PASS
- `npm run test:vitest -w @autocare/mobile` -> PASS

---

## Window 4 execution (hybrid-ID reliability hardening)

### Implemented
- Planning and migration artifacts:
  - `.planning/database/hybrid-id-inventory.md`
  - `.planning/database/hybrid-id-migration-variants.md`
  - `.planning/database/hybrid-id-adapters-and-validation.md`
  - `packages/db/src/migrations/0011_hybrid_ids_vehicle_pilot.sql`
  - `packages/db/src/migrations/0012_hybrid_ids_auth_banner.sql`
- DB schema and seed updates for UUID public ID + BIGINT internal ID dual path:
  - `packages/db/src/schema.ts`
  - `packages/db/src/schemas/users.ts`
  - `packages/db/src/schemas/banners.ts`
  - `apps/server/scripts/db-seed.ts`
  - `apps/server/scripts/db-verify-hybrid.ts`
- Repository and route hardening for `id_int`/`*_id_int` consistency:
  - `apps/server/src/modules/vehicles/infrastructure/vehicle-repository.ts`
  - `apps/server/src/modules/auth/infrastructure/refresh-token-repository.ts`
  - `apps/server/src/modules/auth/infrastructure/organization-invite-repository.ts`
  - `apps/server/src/modules/banners/infrastructure/banner-repository.ts`
  - `apps/server/src/modules/reports/interfaces/http/report-routes.ts`

### Verification
- `npm run db:migrate` -> PASS (applied through `0012_hybrid_ids_auth_banner.sql`)
- `npm run db:seed` -> PASS
- `npm run db:verify:hybrid` -> PASS
- `npm run typecheck -w @autocare/server` -> PASS
- `npm run test:vitest -w @autocare/server` -> PASS

### Notes
- Report routes were aligned to auth guard usage via `createAuthHttpGuards(...)` so permission/plan checks consistently enforce authenticated context.
- Subscription cancel now tolerates DB-missing test users by resolving or creating the `users` row before writing `subscription_cancellations.user_id_int`.
