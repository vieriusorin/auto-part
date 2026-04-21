# Phase 2 Window 1 Plan — Subscription Fit Baseline

## Goal
Establish subscription infrastructure and first monetization loop without degrading free-tier utility.

## Scope (window 1)
- SUB-01 baseline: premium forecast/paywall value framing in costs surface.
- SUB-02 baseline: trial + monthly/annual offers endpoint and client flow.
- SUB-03 baseline: cancellation reason capture endpoint path.
- SUB-04 baseline: paywall eligibility guard tied to value milestone (maintenance activity).

## Tasks
1. Add subscription contracts and OpenAPI endpoints (`status`, `offers`, `trial/start`, `cancel`).
2. Add api-client query/mutation hooks for subscription lifecycle.
3. Add mobile costs screen paywall/trial/cancel UX.
4. Verify with tests + typecheck and record execution.

## Definition of done (window 1)
- Authenticated users can fetch subscription status and offers.
- Trial start updates org plan to premium; cancel records reason and reverts to free.
- Mobile surface can trigger trial/cancel and displays eligibility reason.
- Server/api-client/mobile typechecks pass.

---

## Window 2 Addendum (retention + guardrails)

### Scope
- Persist cancellation reasons for churn analysis (SUB-03 depth).
- Add retention summary endpoint for subscription KPI tracking (SUB-03 depth).
- Add free-tier guardrail visibility in client surfaces (SUB-04 depth).

### Tasks
1. Add DB persistence for subscription cancellations.
2. Add server endpoints for cancellation reason summary + retention summary.
3. Add api-client hooks and mobile insights surface for these metrics.
4. Verify and update phase tracking docs.

### Done criteria
- Cancellation writes are persisted and queryable by org.
- Retention summary endpoint is available and consumed by mobile insights.
- Tests/typechecks pass after OpenAPI/types sync.
