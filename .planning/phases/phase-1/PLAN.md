# Phase 1 Execution Plan — MVP PMF Probe (current window)

## Goal
Advance Phase 1 from “auth + clients in tree” to a **verified protected domain path** and the **first persistent maintenance-domain vertical slice** (vehicle + maintenance history), aligned to MVP-01, MVP-02, and MVP-06.

## Scope boundary
- **In scope (this plan)**: Server auth on vehicle domain routes, real actor/org context, vehicle CRUD backed by Drizzle, maintenance log persistence and listing, minimal mobile garage + timeline consumption via `@autocare/api-client`, Vitest coverage for new server behavior.
- **Out of scope (defer to follow-up plan)**: Smart reminders (MVP-03), action feed UX (MVP-04), cost forecast (MVP-05), R2 signed uploads + Next viewer hardening (MVP-07), KPI instrumentation beyond existing analytics foundations.

## Engineering method
- **Server**: Add or extend Vitest integration/unit tests for auth + vehicle flows (pattern: `apps/server/src/modules/auth/__tests__/`). Red-green for new behaviors where practical.
- **Mobile**: Follow existing Expo + TanStack Query + api-client patterns; no new state libraries.

## Goal-backward mapping
- **MVP-06** → Task 1 (protected domain path, real `req.user`, tests).
- **MVP-01** → Task 2 (user-scoped vehicle profile CRUD + mobile garage).
- **MVP-02** → Task 3 (persistent maintenance timeline API + mobile detail view).

## Locked execution decisions
- All **per-vehicle** read/write routes require `requireAuth` and appropriate `vehicles.*` / `logs.*` permissions unless explicitly documented as public utility.
- Audit/trust appendages use **`req.user.id`** (never placeholder demo IDs) for user-initiated actions.
- Vehicle ownership: enforce **organizationId match** between JWT and row (or documented solo-user default org created at registration) before returning or mutating a vehicle.

## Tasks (dependency ordered)

### Task 1 — Close the “protected domain path” proof (MVP-06)
**Intent**  
Demonstrate that a client can authenticate and call a **real** vehicle-domain endpoint with authorization and correct user context — not only `/auth/me`.

**Changes expected**
- Add `requireAuth` + permission middleware to any vehicle route that is missing it and should not be public (minimum: `lockVehicle`; review `fuel`, `upload`, `scan-document` per product intent).
- Replace `demo-user` (and any stub actor) in vehicle handlers with `req.user` metadata; align with trust/audit helpers.
- Add one **HTTP-level integration test** (or extend `auth-http.integration.test.ts`) that: register or login → obtain access token → call a protected vehicle endpoint → expect 200/201 (or 404 if resource missing) **not** 401.
- Regenerate OpenAPI / client types if operation shapes change.

**Files touched (expected)**
- `apps/server/src/modules/vehicles/interfaces/http/vehicle-routes.ts`
- `apps/server/src/modules/auth/__tests__/auth-http.integration.test.ts` (or new `vehicle-auth.integration.test.ts`)
- Possibly `apps/server/src/interfaces/http/express.d.ts` / presenters — only if needed for typed `req.user`

**Verification criteria**
- `npm run test:vitest -w @autocare/server --` (or scoped pattern) passes including new integration test.
- Manual or scripted smoke: mobile bearer or curl can hit protected vehicle route after login.

**Requirement mapping**  
MVP-06 (partial completion toward full phase KPIs).

---

### Task 2 — Vehicle profile vertical slice (MVP-01)
**Intent**  
Users can create and list vehicles they own; data persists in Postgres via Drizzle.

**Changes expected**
- Resolve **user ↔ organization ↔ vehicle** rule (migration if adding `ownerUserId` or ensuring org id on user at registration).
- Implement repository + use cases (or thin service) for: list vehicles for session, create vehicle, get by id, update, optional soft-delete or lock alignment with `isLocked`.
- Register OpenAPI routes under `/api/vehicles` (or consistent prefix), wire `registerRoute`, regenerate `openapi.json`.
- `packages/api-client`: query keys + `useVehicles` / `useCreateVehicle` (names illustrative) using generated operations.
- Mobile: replace garage placeholder with list + “add vehicle” flow (minimal UI, matches existing design tokens / NativeWind patterns).

**Files touched (expected)**
- `packages/db/src/schema.ts` and `packages/db/src/migrations/*` (if schema change)
- `apps/server/src/modules/vehicles/**` (new repository/service or extend module)
- `packages/api-client/src/query-keys.ts`, `packages/api-client/src/react/hooks.ts`
- `apps/mobile/app/(tabs)/garage/index.tsx` (+ any small components)

**Verification criteria**
- Vitest: create vehicle as authenticated user → list returns it; unauthorized user cannot read another org’s vehicle (401/403/404 policy as designed).
- Mobile can display list after login against dev API.

**Requirement mapping**  
MVP-01.

---

### Task 3 — Maintenance timeline persistence (MVP-02 core)
**Intent**  
Maintenance events are stored and retrieved per vehicle for a timeline UI.

**Changes expected**
- Wire `createMaintenanceLog` / `updateMaintenanceLog` (and add `listMaintenanceLogs` if missing) to Drizzle `maintenance_log`; validate vehicle access before write.
- Return stable DTOs matching shared contracts; compute `integrityHash` consistently with trust fields.
- Mobile: vehicle detail or garage drill-down shows chronological maintenance list; optional compact “add log” form (can be minimal single screen).

**Files touched (expected)**
- `apps/server/src/modules/vehicles/interfaces/http/vehicle-routes.ts`
- New repository module for maintenance logs
- `packages/shared/src/contracts/vehicles.ts` (if new operations/schemas)
- `packages/api-client` hooks + `apps/mobile/app/vehicle/**` screens as needed

**Verification criteria**
- Vitest: create log → list returns entry with correct `vehicleId`; cross-vehicle access denied.
- Manual: timeline visible on device after pull-to-refresh.

**Requirement mapping**  
MVP-02 (core; full “smart” behavior still Phase 1 later tasks).

## Dependency order
1. Task 1  
2. Task 2 (depends on Task 1 for auth middleware consistency)  
3. Task 3 (depends on Task 2 for vehicle ownership checks)

## Risks and mitigations
- **Migration + org semantics** block vehicle inserts → decide org default in Task 2 kickoff before coding routes.
- **Stub routes** left public → Task 1 audit of every `registerRoute` in vehicle router.
- **Client drift** → regenerate OpenAPI and hooks in the same PR as route changes.

## Definition of done (this plan window)
- At least one automated test proves auth → protected vehicle-domain success path.
- CRUD vehicles persist per user/org rules; garage screen lists real data.
- Maintenance logs persist and list for an owned vehicle; mobile shows a timeline.
