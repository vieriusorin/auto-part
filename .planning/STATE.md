# AutoCare State

## Project Reference
- **Core value**: Help EU drivers avoid surprise repair bills through proactive, trustworthy maintenance planning.
- **Strategy**: Retention-first, trust-first progression with gated monetization.
- **Current focus**: Phase 3 — windows 1-15 affiliate baseline + trust KPIs + readiness criteria + high-intent mobile activation/coverage + disclosure-label runtime/schema/client guards + CI verification bundling are in progress, following Phase 2 KPI-confidence hardening windows.
- **Latest execution update**: `.planning/phases/phase-3/EXECUTION.md` records Phase 3 windows 1-15 implementation; Phase 2 execution depth through window 49 is tracked in `.planning/phases/phase-2/EXECUTION.md`.

## Current Position
- **Current phase**: 3 - Trust-Safe Affiliate Layer — **execution in progress**
- **Current plan**: `.planning/phases/phase-3-trust-safe-affiliate.md`; executable slice started in `.planning/phases/phase-3/EXECUTION.md`
- **Phase 0 plan** (complete): `.planning/phases/phase-0/PLAN.md`
- **Overall status**: Phase 0 verified; Phase 1 engineering-complete (KPI/business closeout pending); Phase 2 execution expanded through window 49 (retention KPI evidence pending); Phase 3 execution in progress (windows 1-15 complete).
- **Progress**: `1/5 phases complete` (roadmap closeout), with active delivery on Phase 3 and ongoing Phase 2 KPI evidence closeout.

## Implementation progress (repo / working tree)

Aligned to Phase 1 sequencing in `.planning/phases/phase-1-mvp-pmf-probe.md`:

1. **Mobile auth and protected data flow** — *implemented in working tree*
   - Server auth module and route protection in place.
   - Login/refresh now ensure personal organization assignment when missing.
   - API client auth hooks + mobile/web login surfaces remain wired.

2. **Vehicle / timeline / reminder / action loop** — *implemented for current planned windows*
   - Implemented: vehicle CRUD API (`/api/vehicles`), maintenance create/list/update path, org-scoped repository checks, generated OpenAPI/client hooks.
   - Implemented: mobile garage list + sample create flow, vehicle timeline screen, reminder creation/list, action feed transitions.

3. **Media-first evidence + assignment roles** — *implemented and hardened in working tree*
   - Added vehicle document metadata and member-assignment domain tables/migration.
   - Added protected vehicle document and vehicle member endpoints.
   - Added mobile evidence attach/list and member role update baseline UX.

4. **Forecast + report viewer + R2 uploads** — *implemented for baseline path*
   - Added forecast endpoint + mobile forecast rendering.
   - Added upload metadata response and minimal report viewer route.

## Verification Status
- **Latest verification report**: `.planning/phases/phase-1/VERIFICATION.md`
- **Phase 1 window 2 verification verdict**: PASSED (window scope: MVP-03, MVP-04, MVP-05, MVP-07 + hardening)
- **Verification summary**: MVP-08/09/10 depth hardening tests are now in place (server DB integration + api-client hooks), and package tests/typechecks pass.
- **Gap-closure status**: Engineering coverage gaps are closed for planned Phase 1 scope.
- **Latest validation report**: `.planning/phases/phase-1/VALIDATION.md` (PASS, engineering scope).
- **Formal closeout blockers**: KPI exit evidence (activation, D7, D30, WAU/MAU, action completion) is still not measured/documented.

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
- Development workflow preference: use TDD (tests-first) for each implementation step.

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
- Phase 1 closeout runbook: `.planning/phases/phase-1/CLOSEOUT-CHECKLIST.md`
- Phase 2 verification docs: `.planning/phases/phase-2/VERIFICATION.md`, `.planning/phases/phase-2/VALIDATION.md`
- Phase 3 execution docs: `.planning/phases/phase-3/EXECUTION.md`, `.planning/phases/phase-3/VERIFICATION.md`, `.planning/phases/phase-3/VALIDATION.md`

