# Phase 0 Execution Plan - Instrumentation + Trust Baseline

## Goal
Ship a measurable and enforceable trust baseline so product decisions are data-reliable and trust-critical operations are policy-safe before Phase 1 starts.

## Scope Boundary
- In scope: canonical analytics instrumentation foundation, trust/consent baseline, enforcement + acceptance gates.
- Out of scope: Phase 1 maintenance loop product UX/features, subscription/paywall optimization, affiliate/ads implementation.

## Engineering Method: Mandatory TDD + Vitest
- All implementation in this phase follows Red-Green-Refactor with Vitest as the required test framework.
- For every behavior change: write a failing Vitest spec first (Red), implement minimal code to pass (Green), then refactor safely while keeping tests green.
- No production code merge for Phase 0 tasks without corresponding Vitest coverage and demonstrated failing-to-passing progression in commit history.
- For existing code touched by this phase, add backfill tests before or alongside modifications; do not leave legacy paths untested.
- Preference order for test scope: unit -> integration -> acceptance, with acceptance gates composed from Vitest-driven suites.

## TDD Evidence Contract (Auditable)
- Each task checkpoint must include a red->green evidence pair:
  - `RED`: commit or checkpoint log where the new Vitest suite fails for the intended behavior.
  - `GREEN`: subsequent commit or checkpoint log where the same suite passes after implementation.
- Evidence record format per task:
  - `task_id`
  - `test_files`
  - `red_command` + failing output summary
  - `green_command` + passing output summary
  - `coverage_delta` for touched modules
- `phase0:gate` must fail if any task lacks this evidence record.

## Goal-Backward KPI and Requirement Mapping
- KPI `>=95% critical event integrity` -> `FDN-01`
- KPI `D1/D7/D30 + activation dashboards by country/platform/channel` -> `FDN-02`, `FDN-03`
- KPI `100% consent acceptance pass (create/revoke/export/delete)` -> `TRUST-01`
- KPI `0 critical trust-policy enforcement defects` -> `TRUST-02`, `TRUST-03`

## Locked Execution Decisions
- Activation formula lock: user is activated when `vehicle.created + maintenance_item.created + reminder.created` happen within 24h of signup.
- Consent/legal matrix lock: support `analytics`, `marketing`, `transactional`, `profiling`; legal basis captured per entry as `consent` or `legitimate_interest`.
- Export/delete mode lock: asynchronous job flow with status endpoint (`accepted` + job id), never long-running synchronous responses.
- Raw event partitioning lock: monthly partitioning for `analytics_events_raw` (reassess if volume requires daily partitions).
- Lock override scope lock: override allowed only for `admin` role and designated server service accounts.

## Tasks (Dependency Ordered)

### Task 1 - Establish canonical analytics ingestion and segmentation baseline
**Intent**
Create a single, server-authoritative analytics path with strict event contracts so reliability can be measured and enforced.

**Changes expected**
- Configure Vitest test infrastructure for server modules used in this phase (`vitest`, config, scripts, coverage setup).
- Define canonical Phase 0 event taxonomy and required common properties.
- Implement strict ingestion contract for event batch writes with server timestamps and idempotency handling.
- Persist append-only raw events plus rollup/cohort foundations to support activation, D1/D7/D30, WAU/MAU, and maintenance completion.
- Ensure segment normalization is server-side and queryable (`country`, `platform`, `channel`).

**Files touched**
- `apps/mobile/src/features/analytics/event-constants.ts`
- `apps/mobile/src/features/analytics/client-event-logger.ts`
- `apps/server/src/modules/analytics/schemas.ts`
- `apps/server/src/modules/analytics/controller.ts`
- `apps/server/src/modules/analytics/service.ts`
- `apps/server/src/modules/analytics/repository.ts`
- `apps/server/vitest.config.ts`
- `apps/server/package.json` (Vitest scripts and coverage command)
- `packages/db/src/schemas/analytics-events.ts`
- `packages/db/src/migrations/*` (analytics events + rollup/cohort tables)
- `apps/server/src/modules/analytics/rollups.ts`
- `apps/server/src/modules/analytics/__tests__/analytics-contract.test.ts`
- `apps/server/src/modules/analytics/__tests__/analytics-rollups.test.ts`

**Key links**
- Ingestion contract -> `analytics_events_raw` append-only rows -> rollup/cohort materialization -> segmented KPI query module.
- Segment normalization at ingest -> persisted normalized segment fields -> dashboard slicing by `country/platform/channel`.
- Red tests define event contract and rollup expectations first -> implementation is constrained to satisfy explicit Vitest assertions.

**Requirement mapping**
- `FDN-01`, `FDN-02`, `FDN-03`

**Verification criteria**
- `npm run test:vitest -w @autocare/server -- analytics-contract` must show initial failure before implementation and pass after implementation.
- `npm run test:vitest -w @autocare/server -- analytics-rollups` must show initial failure before implementation and pass after implementation.
- `npm run phase0:integrity-gate -w @autocare/server` must pass and report `critical_event_integrity >= 95`.
- `npm run test:coverage -w @autocare/server` must include coverage for all new analytics modules and touched existing analytics code paths.

### Task 2 - Implement consent ledger and trust audit primitives (append-only)
**Intent**
Make trust and consent state auditable through immutable records and operational consent workflows.

**Changes expected**
- Add append-only consent lifecycle model (`granted/revoked/expired`) with source/policy metadata.
- Add append-only actor-aware audit event model for trust-critical operations.
- Implement consent flows for create, revoke, export, and delete with audit linkage.
- Add trust row hash/lock metadata fields needed for traceability.
- Backfill Vitest coverage for touched existing trust/consent service paths before functional changes.

**Files touched**
- `packages/db/src/schemas/consent-ledger.ts`
- `packages/db/src/schemas/audit-events.ts`
- `packages/db/src/schemas/trust-critical-fields.ts`
- `packages/db/src/migrations/*` (consent, audit, trust hash/lock columns)
- `apps/server/src/modules/trust/consent-controller.ts`
- `apps/server/src/modules/trust/consent-service.ts`
- `apps/server/src/modules/trust/audit-service.ts`
- `apps/server/src/modules/trust/export-delete-jobs.ts`
- `apps/server/src/modules/trust/__tests__/consent-lifecycle.test.ts`
- `apps/server/src/modules/trust/__tests__/consent-export-delete.test.ts`
- `apps/server/src/modules/trust/__tests__/audit-append-only.test.ts`

**Key links**
- Consent create/revoke actions -> append-only `consent_ledger` entries -> linked `audit_events` rows.
- Export/delete workflow -> job execution records -> audit trace with request and actor metadata.
- Failing consent/audit tests first -> implementation -> passing tests confirms append-only and traceability constraints.

**Requirement mapping**
- `TRUST-01`, `TRUST-02`

**Verification criteria**
- `npm run test:vitest -w @autocare/server -- consent-lifecycle` must fail first and then pass at 100% for create/revoke/export/delete flows.
- `npm run test:vitest -w @autocare/server -- consent-export-delete` must fail first and then pass (export bundle and delete outcomes match policy and include audit trail).
- `npm run test:vitest -w @autocare/server -- audit-append-only` must fail first and then pass (no update/delete path and required metadata present).
- `npm run test:coverage -w @autocare/server` must confirm touched existing trust modules have backfill coverage.

### Task 3 - Enforce trust policy guards and phase-exit hard gates
**Intent**
Prevent policy bypass on trust-critical writes and block phase completion if trust/reliability standards are unmet.

**Changes expected**
- Implement centralized server-side trust policy guards for lock-state and trust-critical writes.
- Deny unauthorized or lock-violating writes and emit reason-coded audit events for denials.
- Add/enable pre-phase hardening gate suite covering analytics integrity, consent lifecycle, and policy bypass regressions.
- Enforce explicit phase exit block when KPI gates fail.
- Enforce that phase gate fails if required Vitest suites are missing or if failing-first evidence is not present in execution checkpoints.

**Files touched**
- `apps/server/src/modules/trust/policy-guards.ts`
- `apps/server/src/modules/trust/policy-middleware.ts`
- `apps/server/src/modules/trust/denial-audit-emitter.ts`
- `apps/server/src/modules/trust/__tests__/trust-policy-bypass.test.ts`
- `apps/server/src/modules/trust/__tests__/trust-policy-audit.test.ts`
- `apps/server/scripts/phase0-gate.ts`
- `apps/server/package.json` (phase gate scripts)

**Key links**
- Guard checks on trust-critical write endpoints -> denial path with explicit reason codes -> audit emission for every denial.
- Phase gate command -> aggregates analytics integrity + consent lifecycle + trust policy test results -> blocks exit on any KPI miss.
- Phase gate includes Vitest and coverage checks -> no KPI pass allowed without TDD-compliant tests for new and touched code.

**Requirement mapping**
- `TRUST-03` (and hardening confirmation for `FDN-01/02/03`, `TRUST-01/02`)

**Verification criteria**
- `npm run test:vitest -w @autocare/server -- trust-policy-bypass` must fail first and then pass (unauthorized/lock-violating writes denied).
- `npm run test:vitest -w @autocare/server -- trust-policy-audit` must fail first and then pass (denials generate reason-coded audit rows).
- `npm run phase0:gate -w @autocare/server` must fail on any KPI breach and pass only when all Phase 0 exit criteria are green.

## Dependency Order
1. Task 1 (analytics contract + segmentation baseline)
2. Task 2 (consent + audit append-only trust artifacts)
3. Task 3 (policy enforcement + hard phase gates; depends on Tasks 1 and 2)

## Risks and Mitigations
- Analytics contract drift across client/server -> enforce shared event constants and server schema validation as source of truth.
- Segment inconsistency (`country/platform/channel`) -> normalize server-side only and reject invalid/unknown segment values.
- Consent mutation instead of ledger behavior -> append-only repositories and test assertions against updates/deletes.
- Trust policy bypass via direct writes -> centralize write path in guarded services and add bypass regression tests.
- False confidence at phase exit -> block exit unless all KPI gates and acceptance suites are green.
- TDD drift under delivery pressure -> require Red-Green-Refactor evidence and Vitest coverage checks as mandatory execution checkpoints.

## Definition of Done (Phase 0)
- Critical event integrity gate consistently reports `>=95%`.
- Dashboards/queries for activation, D1/D7/D30, WAU/MAU, and maintenance completion are live and segmented by `country/platform/channel`.
- Consent create/revoke/export/delete acceptance suite is `100%` passing.
- Trust-policy and bypass regression suite reports `0` critical defects.
- Phase exit is blocked automatically when any gate fails.
- All Phase 0 code paths (new and touched existing) have Vitest coverage, and execution records show failing tests were written before implementation.
