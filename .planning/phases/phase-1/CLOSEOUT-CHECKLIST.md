# Phase 1 Closeout Checklist

## Purpose
Use this checklist to move Phase 1 from engineering-complete to formally complete.

Phase 1 can be marked complete only when:
- implementation + quality gates are green
- KPI exit criteria are evidenced from telemetry
- branch is merged and CI is green on `main`

## 1) Engineering Gate (must be green)

Run and record results:
- `npm run test:vitest -w @autocare/server`
- `npm run test:vitest -w @autocare/api-client`
- `npm run test:vitest -w @autocare/mobile`
- `npm run typecheck -w @autocare/server`
- `npm run typecheck -w @autocare/api-client`
- `npm run typecheck -w @autocare/mobile`

Pass condition:
- all commands succeed with no regressions

Evidence to capture:
- command outputs and run date
- optional screenshot/log links from CI run

## 2) Data Freshness Gate

Confirm analytics ingestion is current enough to evaluate the KPI window:
- event ingestion job is running
- no known pipeline outage
- latest analytics tables include recent events for active users

Pass condition:
- data lag is acceptable for weekly/monthly retention analysis

Evidence to capture:
- timestamp of latest ingested events
- note on any known data-quality caveats

## 3) KPI Exit Criteria (Phase 1)

Evaluate against Phase 1 targets:
- Activation >= 35%
- D7 retention >= 20%
- D30 retention >= 10% overall and >= 12% primary ICP
- WAU/MAU >= 0.35
- >= 30% of retained users complete >=1 recommended maintenance action by day 30

Pass condition:
- all thresholds met, or approved exception documented by owner

Evidence to capture:
- metric values
- date range used
- segmentation used (overall + primary ICP)
- dashboard/query links

## 4) KPI Query Checklist

Minimum views/queries to run:
- activation funnel (`vehicle created` + `first maintenance item` + `reminder created within 24h`)
- D7 cohort retention
- D30 cohort retention (overall + primary ICP cohort)
- WAU/MAU ratio
- recommended maintenance action completion (retained users)

Quality checks:
- stable denominator definitions
- deduped user counting
- platform/country/channel segments available

## 5) Release and Merge Gate

Before marking phase complete:
- PR approved and merged
- CI green on `main`
- no blocker bugs from smoke checks

Evidence to capture:
- PR link
- CI run link
- smoke-check note

## 6) Decision Log

Record final decision in planning docs:
- mark Phase 1 as complete in `.planning/ROADMAP.md` progress table
- update `.planning/STATE.md` with final status
- add final verification note in `.planning/phases/phase-1/VERIFICATION.md`

Decision template:
- Status: COMPLETE | HOLD
- Decision date:
- Decision owner:
- KPI snapshot:
- Risks accepted:
- Next phase start condition:

## 7) If Gate Fails

If one or more KPIs fail:
- keep Phase 1 open
- define a short remediation window (scope + owner + deadline)
- rerun KPI review on the next full cohort window

Typical remediation examples:
- reduce onboarding friction in reminder setup
- improve first-log completion guidance
- tune action-feed prioritization clarity

## 8) Ready-to-Fill Closeout Record

Copy this section as-is, fill values, and keep it in this file (or move into `VERIFICATION.md`):

```
### Phase 1 Closeout Record

- Status: COMPLETE | HOLD
- Decision date: YYYY-MM-DD
- Decision owner:

#### Engineering Gate
- Server tests: PASS | FAIL
- API client tests: PASS | FAIL
- Mobile tests: PASS | FAIL
- Server typecheck: PASS | FAIL
- API client typecheck: PASS | FAIL
- Mobile typecheck: PASS | FAIL
- Evidence links:

#### Data Freshness
- Latest ingested event timestamp:
- Data lag assessment: OK | NOT_OK
- Caveats:

#### KPI Snapshot
- Activation: ___% (target >= 35%)
- D7 retention: ___% (target >= 20%)
- D30 retention overall: ___% (target >= 10%)
- D30 retention primary ICP: ___% (target >= 12%)
- WAU/MAU: ___ (target >= 0.35)
- Retained users with >=1 recommended maintenance action by day 30: ___% (target >= 30%)

#### KPI Evidence
- Date range:
- Primary ICP definition:
- Dashboard/query links:

#### Merge/Release Gate
- PR link:
- CI on main: GREEN | RED
- Smoke check summary:

#### Decision
- Final verdict: COMPLETE | HOLD
- Risks accepted:
- Required follow-up (if HOLD):
- Next phase start condition:
```
