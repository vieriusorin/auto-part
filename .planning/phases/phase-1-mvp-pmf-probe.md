# Phase 1 - MVP PMF Probe (Maintenance Loop)

## Goal
Prove recurring maintenance value and behavior change for the primary ICP.

## Executable plan (GSD)
- **Research**: `.planning/phases/phase-1/RESEARCH.md`
- **Dependency-ordered tasks (current window)**: `.planning/phases/phase-1/PLAN.md`
- **Plan gate**: `.planning/phases/phase-1/PLAN-CHECK.md` → **PASS**
- **Execution evidence**: `.planning/phases/phase-1/EXECUTION.md`

## Sequencing
1. Mobile auth and protected data flow stabilization. **← delivered in prior windows**
2. Vehicle/timeline/reminder/action loop implementation. **← delivered in window 2 baseline**
3. Media-first evidence + family/micro-fleet assignment roles. **← in progress**
4. Forecast + report viewer + artifact upload hardening. **← delivered in window 2 baseline**

### Step 1 checklist (auth + clients) — repo status
- [x] Express auth module mounted at `/auth` (JWT, refresh, web cookies + CSRF, mobile tokens in body)
- [x] Shared auth contracts + OpenAPI registration / `openapi.json` generation in tree
- [x] `@autocare/api-client` with React hooks and provider
- [x] Mobile: root layout + SecureStore token persistence + login/profile screens
- [x] Web: login + profile + client providers
- [ ] Committed, reviewed, and CI-green on `main` (working tree may still be ahead of git)
- [x] Product sign-off: “protected API” smoke path for a real vehicle domain endpoint (not only `/auth/me`)

## Deliverables
- Expo flows for vehicle profile, service timeline, reminders, and action feed.
- Basic 3-6 month maintenance forecast with recommendation rationale.
- Better Auth + Express protected endpoints consumed by mobile app.
- R2 signed upload flow and minimal Next.js read-only report viewer.

## KPI Exit Criteria
- Activation >=35%.
- D7 retention >=20%.
- D30 retention >=10% overall and >=12% in primary ICP cohort.
- >=30% of retained users complete one recommended action by day 30.
- WAU/MAU >=0.35.

## Risk Controls
- No hard paywall and no ads in this phase.
- Freeze scope if core loop metrics degrade after feature additions.
- Defer realtime and advanced offline conflict UX.

## Requirement Mapping
- MVP-01, MVP-02, MVP-03, MVP-04, MVP-05, MVP-06, MVP-07, MVP-08, MVP-09, MVP-10

