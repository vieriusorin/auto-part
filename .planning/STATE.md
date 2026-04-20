# AutoCare State

## Project Reference
- **Core value**: Help EU drivers avoid surprise repair bills through proactive, trustworthy maintenance planning.
- **Strategy**: Retention-first, trust-first progression with gated monetization.
- **Current focus**: Phase 1 — execution window 1 complete (protected domain path + vehicle profile + maintenance timeline core).
- **Latest execution update**: `.planning/phases/phase-1/EXECUTION.md` records `/gsd:execute-phase` delivery for MVP-06, MVP-01, and MVP-02 core. Work remains uncommitted in tree; merge/review status still pending.

## Current Position
- **Current phase**: 1 - MVP PMF Probe (Maintenance Loop) — **execution in progress**
- **Current plan**: `.planning/phases/phase-1-mvp-pmf-probe.md`; executable slice `.planning/phases/phase-1/PLAN.md` completed for tasks 1-3 (see `.planning/phases/phase-1/EXECUTION.md`)
- **Phase 0 plan** (complete): `.planning/phases/phase-0/PLAN.md`
- **Overall status**: Phase 0 verified; Phase 1 window 1 executed and verified locally
- **Progress**: `1/5 phases complete` (roadmap); Phase 1 now has implemented auth+vehicle+timeline core pending merge and phase verification

## Implementation progress (repo / working tree)

Aligned to Phase 1 sequencing in `.planning/phases/phase-1-mvp-pmf-probe.md`:

1. **Mobile auth and protected data flow** — *implemented in working tree*
   - Server auth module and route protection in place.
   - Login/refresh now ensure personal organization assignment when missing.
   - API client auth hooks + mobile/web login surfaces remain wired.

2. **Vehicle / timeline / reminder / action loop** — *partially implemented (window 1)*
   - Implemented: vehicle CRUD API (`/api/vehicles`), maintenance create/list/update path, org-scoped repository checks, generated OpenAPI/client hooks.
   - Implemented: mobile garage list + sample create flow, vehicle timeline screen.
   - Deferred: reminders and action feed UX.

3. **Media-first evidence + assignment roles** — *started in working tree*
   - Added vehicle document metadata and member-assignment domain tables/migration.
   - Added protected vehicle document and vehicle member endpoints.

4. **Forecast + report viewer + R2 uploads** — *not started*.

## Verification Status
- **Latest verification report**: `.planning/phases/phase-1/VERIFICATION.md`
- **Phase 1 window 1 verification verdict**: PASSED (window scope: MVP-06, MVP-01, MVP-02 core)
- **Verification summary**: Planned execution window passes goal-backward checks and command evidence (`tests`, `typecheck`, `db migrate`, DB-backed vehicle integration).
- **Gap-closure status**: Window-level gaps for protected domain path, vehicle CRUD, and maintenance timeline are closed; remaining Phase 1 deliverables are intentionally deferred to next window.
- **Latest validation report**: `.planning/phases/phase-1/VALIDATION.md` (PASS WITH WARNINGS).

## Performance Metrics Baseline
- Activation: Not measured yet
- D7 retention: Not measured yet
- D30 retention: Not measured yet
- WAU/MAU: Not measured yet
- Completed maintenance action rate (30d): Not measured yet

## Accumulated Context
### Locked decisions
- Keep stack fixed: Expo RN, Express, Drizzle/Postgres, R2, Next.js viewer.
- **Auth implementation note**: Roadmap narrative still mentions Better Auth; the current codebase implements a **first-party auth module** on Express (JWT access + refresh, cookie session for web). Reconcile naming/docs when the integration story is final.
- No ads before retention proof.
- No aggressive paywalls before meaningful maintenance value event.
- Trust controls (consent, auditability, server policy enforcement) are in-scope foundation work.

### Open decisions
- Initial launch countries and primary language ordering.
- Initial ICP prioritization for validation window (DIY owner vs micro-fleet first).
- First paid plan pricing and trial duration strategy after Phase 1 gates.
- Affiliate category priority after subscription baseline health.

### Blockers
- No active Phase 0 blockers. Operational precondition remains: `DATABASE_URL` and seeded persisted analytics evidence are required for repeatable gate passes in fresh environments.

## Session Continuity
- Roadmap source: `.planning/ROADMAP.md`
- Requirements source: `.planning/REQUIREMENTS.md`
- Detailed execution scopes: `.planning/phases/`

