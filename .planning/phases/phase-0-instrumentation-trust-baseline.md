# Phase 0 - Instrumentation + Trust Baseline

## Goal
Make retention and trust quality measurable and enforceable before scaling product scope.

## Sequencing
1. Event and dashboard foundation.
2. Consent and governance ledger.
3. Trust schema primitives and enforcement hooks.

## Deliverables
- Event taxonomy for onboarding, reminders, actions, paywall exposure, trials, churn.
- Dashboards for activation, D1/D7/D30, WAU/MAU, maintenance completion.
- Consent lifecycle storage and export/deletion workflow.
- Trust schema additions (hash metadata fields, append-only audit fields, lock-state policy fields).

## KPI Exit Criteria
- >=95% critical event integrity.
- D1/D7/D30 and activation dashboards live by segment (country/platform/channel).
- 100% pass rate on consent create/revoke/export/delete acceptance tests.
- 0 critical trust-policy enforcement defects.

## Risk Controls
- Do not start Phase 1 if analytics reliability is below threshold.
- Block schema changes that bypass migration pipeline.
- Enforce server-authoritative policy checks on trust-critical writes.

## Requirement Mapping
- FDN-01, FDN-02, FDN-03, TRUST-01, TRUST-02, TRUST-03

