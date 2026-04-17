# Phase 0 Research: Instrumentation + Trust Baseline

**Date:** 2026-04-17  
**Scope:** Phase 0 (`FDN-01/02/03`, `TRUST-01/02/03`)  
**Stack Focus:** Expo React Native, Express API, Drizzle + PostgreSQL, Better Auth

## 1) Implementation Recommendation (Prescriptive)

Build a server-authoritative analytics and trust layer where the mobile app emits canonical events, Express validates/enriches/persists them, and Postgres stores both raw events and derived rollups. Treat consent and trust operations as first-class domain records with immutable audit history.

Recommended baseline:
- **Mobile capture:** Expo app logs only canonical event names + required properties.
- **Ingress API:** `POST /v1/events/batch` with strict schema validation, idempotency key, and server timestamps.
- **Storage split:**  
  - `analytics_events_raw` (append-only source of truth)  
  - `analytics_daily_rollups` + `analytics_cohorts` (dashboard query speed)
- **Trust split:**  
  - `consent_ledger` (consent lifecycle)  
  - `audit_events` (append-only actor-aware trail)  
  - lock/hash policy fields on trust-critical domain tables.
- **Policy enforcement:** trust-critical writes only via service-layer policy guards in Express; never from direct controller/table writes.

## 2) Recommended Architecture

### A. App (Expo React Native)
- Add `src/features/analytics/client-event-logger.ts`:
  - queues events with `event_id` (UUID), `occurred_at_client`, `session_id`, `device_id`.
  - enriches with `platform`, `app_version`, `locale`, `timezone`.
  - retries transient network failures.
- Add small event constants map (`as const`) to prevent drift.
- Do not compute business KPIs in app; only emit signals.

### B. API (Express)
- Add modules:
  - `src/modules/analytics/` (`controller`, `service`, `schemas`, `repository`)
  - `src/modules/trust/` (`consent`, `audit`, `policy`)
- Request pipeline:
  1. Authenticate session with Better Auth where required.
  2. Validate payload shape and required event properties.
  3. Normalize segment fields (`country`, `platform`, `channel`) server-side.
  4. Persist raw rows + update rollups in transaction/job.

### C. Data (Drizzle + Postgres)
- Use single migration pipeline for auth/domain/trust tables.
- Keep append-only behavior enforced by:
  - no `UPDATE/DELETE` path in repositories for ledger/audit tables.
  - optional DB trigger check for immutable rows.

## 3) Event Taxonomy Design (Canonical)

Event namespace format: `domain.object.action` (lowercase snake for properties).

Critical Phase 0 events:
- `onboarding.started`
- `onboarding.completed`
- `vehicle.created`
- `maintenance_item.created`
- `reminder.created`
- `reminder.triggered`
- `maintenance_action.completed`
- `paywall.viewed`
- `trial.started`
- `subscription.started`
- `subscription.canceled`
- `churn.signal_detected`

Required common properties on **every** event:
- `event_id`, `event_name`, `occurred_at_client`, `received_at_server`
- `user_id` (nullable for pre-auth), `session_id`, `device_id`
- `platform` (`ios|android`), `country`, `channel`
- `app_version`, `schema_version`

Integrity rule for KPI: critical event integrity =  
`valid_critical_events / total_critical_events` where valid means all required properties are present and typed correctly.

## 4) Dashboard Data Model

Use rollup tables/materialized views for founder-facing dashboards.

### Core tables/views
- `analytics_events_raw` (append-only, partitioned by day)
- `analytics_daily_rollups`
  - keys: `date`, `country`, `platform`, `channel`
  - metrics: `new_users`, `activation_count`, `d1_retained`, `d7_retained`, `d30_retained`, `wau`, `mau`, `maintenance_actions_completed`
- `analytics_user_cohort_facts`
  - keys: `user_id`, `signup_date`, segment fields
  - derived flags for D1/D7/D30

### KPI query strategy
- Activation definition (Phase 1-compatible): `vehicle.created + maintenance_item.created + reminder.created within 24h`.
- WAU/MAU from distinct active users in 7-day / 30-day windows.
- Segment slicing always available by `country/platform/channel` (`FDN-03`).

## 5) Consent Lifecycle Design (`TRUST-01`)

Consent model should be evented, not overwrite-only.

`consent_ledger` primitive:
- `id`, `user_id`, `consent_type`, `status` (`granted|revoked|expired`)
- `legal_basis`, `policy_version`, `captured_at`
- `capture_source` (`app|api|admin`), `ip_hash`, `user_agent_hash`
- `request_id`, `created_at`

Operational flows:
- **Create/Grant:** append new `granted` record.
- **Revoke:** append `revoked` record (do not mutate original).
- **Export:** generate user bundle (consent + audit + trust-critical records), log export audit event.
- **Delete:** execute deletion workflow with legal exceptions policy; append audit tombstone event.

## 6) Audit/Log Schema Primitives (`TRUST-02`)

`audit_events` primitive (append-only):
- `id`, `occurred_at`, `actor_type` (`user|system|admin`), `actor_id`
- `action` (e.g. `consent.revoked`, `vehicle.locked`)
- `resource_type`, `resource_id`
- `before_hash`, `after_hash` (or nullable before for create)
- `reason_code`, `source` (`api|job|migration`)
- `request_id`, `session_id`, `ip_hash`, `user_agent_hash`
- `metadata_json` (validated JSONB)

Hash metadata fields for trust-critical domain rows:
- `content_hash`
- `hash_algorithm` (default `sha256`)
- `hash_version`
- `locked_at`, `locked_by`, `lock_reason`

## 7) Server-Authoritative Policy Checks (`TRUST-03`)

Implement policy guard layer in Express service methods:
- `assertCanWriteTrustCritical(actor, resource, action)`
- `assertNotLockedOrHasOverride(resource, actor)`
- `assertConsentAllowsProcessing(userId, purpose)`

Rules:
- Never trust client-sent lock/consent status.
- Lock-state enforcement must run server-side before DB write.
- All denied writes must emit audit events with explicit reason code.
- Trust-critical writes require authenticated actor or system actor context.

## 8) Requirement Mapping

| Requirement | Recommendation Coverage |
|---|---|
| `FDN-01` | Canonical event taxonomy, strict ingress schema validation, append-only raw event store, integrity metric. |
| `FDN-02` | Rollup/cohort model for activation, D1/D7/D30, WAU/MAU, maintenance completion dashboards. |
| `FDN-03` | Required segment keys (`country/platform/channel`) normalized server-side and indexed in rollups. |
| `TRUST-01` | Evented consent ledger + export/delete workflows with auditable records. |
| `TRUST-02` | Append-only actor-aware `audit_events` with request/session/source/hash metadata. |
| `TRUST-03` | Centralized server policy guards for lock-state and trust-critical write operations. |

## 9) Acceptance-Test Approach (Aligned to KPI Exit Criteria)

### A. Analytics integrity >=95%
- Contract tests for `/events/batch`:
  - rejects malformed critical events
  - accepts valid events with full required fields
- Data quality test job:
  - computes daily critical event integrity percentage
  - fails gate if `<95%`.

### B. Dashboards live (activation, D1/D7/D30 by segments)
- Seeded integration dataset -> verify rollup queries return expected segmented metrics.
- Snapshot tests for KPI query outputs by `country/platform/channel`.

### C. Consent acceptance pass =100%
- End-to-end tests:
  - create consent
  - revoke consent
  - export package contains consent ledger
  - delete flow executes and logs audit event
- Gate requires all consent flow tests pass (no retries counted as pass).

### D. 0 critical trust-policy defects
- Policy bypass tests:
  - locked resource write denied without override
  - trust-critical write without actor context denied
  - denied writes generate audit event.
- Security regression suite required green before phase exit.

## 10) Unknowns, Assumptions, and Explicit Decisions Needed

### Unknowns
- Final acquisition `channel` attribution source of truth (mobile install referrer, campaign params, or backend attribution service).
- Exact legal retention rules for deleted user audit/consent traces by jurisdiction.
- Dashboard consumption layer target (internal SQL views only vs dedicated BI tool/UI in this phase).

### Assumptions
- Better Auth session/user identifiers are available to analytics/trust modules in Express.
- Drizzle migrations are the only schema change path in all environments.
- Existing API has a background job mechanism (or cron worker) for rollup materialization.

### Decisions Required Before Execution
1. Canonical activation formula lock (current recommendation: `vehicle + maintenance item + reminder in 24h`).
2. Consent categories and legal basis matrix (analytics, marketing, transactional, profiling).
3. Whether export/delete is synchronous API response or async job with status endpoint.
4. Partitioning strategy for `analytics_events_raw` (daily vs monthly) based on expected volume.
5. Which role can override lock-state (`admin` only or scoped service accounts).

## 11) Minimal Delivery Order (Phase 0)

1. **Schema + migrations:** analytics, consent, audit, lock/hash fields.
2. **Ingress + policy services:** event ingest, consent APIs, trust guards.
3. **Rollups + dashboard queries:** cohort metrics and segment slicing.
4. **Acceptance gates:** integrity, consent lifecycle, trust-policy enforcement.

This order enforces measurable analytics and trust guarantees before feature scale.
