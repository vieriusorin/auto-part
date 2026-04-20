# Phase 1 Research — MVP maintenance loop (execution window)

**GSD**: `/gsd:plan-phase 1` — targets **Phase 1 only** (MVP PMF Probe). Revalidated against repo; key gaps unchanged.

## Goal (from roadmap)
Prove recurring maintenance value: vehicle setup, history, reminders, action feed, forecast, authenticated data path, artifacts + viewer (full phase scope in `.planning/phases/phase-1-mvp-pmf-probe.md`).

## Current codebase facts (2026-04-19)

### Auth stack (Step 1 — mostly implemented in working tree)
- Express auth module: JWT access + refresh, web cookies + CSRF, mobile bearer; OpenAPI-registered `/auth/*`.
- `createRequireAuthMiddleware` accepts `Authorization: Bearer` or access cookie; sets `req.user` (`id`, `email`, `role`, `organizationId`, `tokenId`).
- Permissions: `apps/server/src/modules/auth/application/permissions.ts` — default user role includes `vehicles.*` read/create/update and `logs.*` read/create/update (no `logs.delete` for normal users).
- Integration tests exist under `apps/server/src/modules/auth/__tests__/`.

### Vehicle HTTP layer (partial / stubby)
- `apps/server/src/modules/vehicles/interfaces/http/vehicle-routes.ts`:
  - `createMaintenanceLog` / `updateMaintenanceLog` use `requirePermission(...)` which chains `requireAuth` first — good pattern.
  - Handlers use hard-coded `userId: 'demo-user'` in `appendAuditLog` — not production-correct; must use `req.user.id` (and org scope).
  - `POST /vehicles/:id/lock` is registered **with no auth middleware** — inconsistent with trust posture; should require auth + vehicle permission.
  - `GET /vehicles/:id/fuel`, `POST /vehicles/scan-document`, `POST /upload` have no `requireAuth` — acceptable only if intentionally public; product-wise uploads and per-vehicle fuel should be authenticated.
- No visible Drizzle reads/writes in this file: responses are stubs (`items: []`, fake scan result, example R2 URL).

### Data model
- `packages/db/src/schema.ts` defines `vehicle` (columns include `organizationId`, lock flag, odometer) and `maintenance_log` (FK `vehicleId`, integrity hash, trust columns).
- **Gap**: vehicles are keyed by `organizationId`; auth JWT carries `organizationId` (nullable in types). Need explicit rule: default org for solo users, or migrate to `ownerUserId` — must be decided when wiring CRUD.

### Mobile / client
- `apps/mobile/app/(tabs)/garage/index.tsx` is placeholder copy only — no TanStack Query hooks for vehicles.
- `packages/api-client/src/react/hooks.ts` exposes utility/analytics patterns; vehicle operations would need new hooks + `queryKeys` entries once OpenAPI operations exist for list/create vehicle.

### Requirements touch for this window
- **MVP-06**: Authenticated session + protected endpoints — incomplete until domain routes use real user context and integration test covers auth → vehicle path.
- **MVP-01–MVP-05**: Largely unstarted at API/UI layer despite DB primitives.

## Technical risks
- **Scope leak**: Implementing full reminders + forecast in the same window as first vehicle CRUD will miss KPI-ready depth; sequence should stay: auth proof → vehicle ownership → timeline → reminders/feed → forecast.
- **Org vs user**: If `organizationId` is null for some users, vehicle inserts must not break; align with `UserRepository` / register flow.
- **OpenAPI drift**: New routes must be registered and `openapi.json` regenerated so `@autocare/api-client` stays typed.

## References
- Narrative phase doc: `.planning/phases/phase-1-mvp-pmf-probe.md`
- Phase 0 plan pattern: `.planning/phases/phase-0/PLAN.md`
- State: `.planning/STATE.md`
