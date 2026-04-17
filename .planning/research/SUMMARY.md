# AutoCare Research Summary

## Executive Summary
AutoCare should be built as a maintenance-confidence product for EU drivers who want fewer surprise repair bills, not as a generic car logbook. The winning MVP is a focused retention product: vehicle profile + service history, smart reminders, a clear next-action feed, and a basic 3-6 month cost outlook. Monetization depth must follow proof of repeat maintenance behavior.

The technical stack is feasible for a solo founder if sequencing is strict: validate auth first (Expo + Better Auth + Express), then protected data flows, then signed R2 uploads, then a minimal read-only report surface. Trust is a product feature, not backend polish: tamper-evident records, append-only audit trails, server-enforced lock states, and privacy-safe media handling are foundational to retention and expansion.

The key failure mode is shipping "another tracker" with weak trust guarantees and premature paywalls/ads. The recommended path is retention-first execution with hard KPI gates, then subscription, then consent-safe affiliate, and ads only as an optional fallback.

## Decisive Assumptions
- Primary ICP: EU urban/suburban owners of 4-12 year vehicles with recent repair-cost pain.
- Core value promise: cost predictability + decision clarity ("what to do now vs defer"), not raw tracking.
- Growth dynamic: first-session activation and first-month retention dominate long-term monetization.
- Trust dynamic: GDPR transparency, explicit disclosure, and data control materially impact conversion and retention.
- Operating model: solo-founder velocity requires strict scope control and measurable phase gates.

## MVP Boundary (Phase 1)
**In scope**
- Vehicle profile + maintenance timeline (manual/import baseline).
- Smart reminders (time + mileage).
- "Do now / plan / defer" action feed.
- Basic upcoming maintenance budget forecast (3-6 month horizon).
- GDPR-transparent consent, deletion/export basics, and multilingual-ready UX.
- Instrumentation for activation, retention, and maintenance completion outcomes.

**Out of scope (defer)**
- Social login, complex RBAC, heavy dashboards, realtime, and advanced offline conflict UX.
- Deep telematics, insurance-linked pricing, broad marketplace transactions.
- Ads and aggressive paywalls before retention proof.

## Top Technical Risks
- **Cross-surface auth mismatch:** Expo and web report viewer can diverge without one canonical session contract.
- **Schema/migration drift:** auth and domain models must share one Drizzle migration discipline.
- **Insecure file pipeline:** direct client credentials or long-lived upload secrets are unacceptable.
- **Weak offline durability:** in-memory queue causes data loss/duplication; persistent idempotent queue is required.
- **Premature complexity:** overbuilding reports/realtime/offline conflict UI before MVP proof increases failure risk.

## Trust & Privacy Non-Negotiables
- Deterministic hashing with canonical JSON (RFC 8785) + hash chaining for trust-critical records.
- Append-only forensic audit logs with actor/source/trace metadata and immutable retention posture.
- Server-enforced lock policy state machine (not client-only boolean lock toggles).
- Signed report verification envelope + verifier endpoint for external authenticity checks.
- Privacy-by-default media redaction flow with block-on-failure behavior for sensitive detections.
- Consent-aware monetization/disclosure: no hidden sponsorship patterns, auditable commercial labeling.

## KPI Gates (Advance / Hold Rules)
- **Phase 0 -> 1 readiness:** >=95% critical event integrity, live D1/D7/D30 dashboards, GDPR consent flow verified.
- **Phase 1 -> 2 (subscription unlock):** activation >=35%, D7 >=20%, D30 >=10% overall (>=12% primary ICP), WAU/MAU >=0.35, >=30% retained users complete a recommended action by day 30.
- **Phase 2 -> 3 (affiliate unlock):** trial->paid >=25% baseline, month-2 payer retention >=70%, refunds <4%, subscription economics positive, free-tier D30 not degraded >15% vs baseline.
- **Phase 3 -> 4 (ads optional unlock):** affiliate conversion >=5% in at least one category, zero disclosure audit failures, no statistically significant retention drag.
- **Global rollback rule:** if monetization improves short-term conversion but harms retention/trust, revert to previous phase settings.

## Recommended Phase Order (AutoCare)
1. **Phase 0 - Instrumentation + Trust Baseline**
   - Deliver event taxonomy, cohort views, consent ledger, and trust schema primitives.
   - Rationale: without measurement and trust controls, PMF and monetization decisions are blind.

2. **Phase 1 - MVP PMF Probe (Retention Core)**
   - Deliver core maintenance planning loop and behavior-driving reminders/actions.
   - Rationale: prove recurring value before introducing monetization friction.

3. **Phase 2 - Subscription Fit**
   - Deliver premium forecasting depth, multi-vehicle workflows, and paywall/trial experiments.
   - Rationale: monetize only after repeat utility is demonstrated in cohorts.

4. **Phase 3 - Trust-Safe Affiliate Layer**
   - Deliver high-intent partner surfaces with explicit disclosure and consent-aware attribution.
   - Rationale: additive monetization only if trust and retention stay intact.

5. **Phase 4 - Ads (Optional Fallback)**
   - Deliver low-density contextual/rewarded ads with strict frequency/segment controls.
   - Rationale: ads are a reversible backstop, not the core business engine.

## Source Inputs
- `.planning/research/market.md`
- `.planning/research/tech-architecture.md`
- `.planning/research/trust-data.md`
- `.planning/research/roadmap-gtm.md`
