# AutoCare Roadmap

## Strategy Frame
- Retention-first: prove recurring maintenance behavior before increasing monetization pressure.
- Trust-first: treat data integrity, privacy, and disclosure as product features, not compliance leftovers.
- Planned stack alignment: Expo React Native app, Express API, Drizzle + PostgreSQL, Better Auth, Cloudflare R2, Next.js report viewer.

## Phases
- [x] **Phase 0: Instrumentation + Trust Baseline** - Establish measurable funnels, consent evidence, and integrity primitives before feature scaling.
- [ ] **Phase 1: MVP PMF Probe (Maintenance Loop)** - Deliver the core maintenance workflow that drives repeat user value. *(Engineering scope complete; KPI/business closeout still pending.)*
- [ ] **Phase 2: Subscription Fit** - Add paid depth only after retention proof and protect free-tier health. *(Execution in progress: windows 1-49 implemented and locally verified; retention KPI evidence still pending.)*
- [ ] **Phase 3: Trust-Safe Affiliate Layer** - Introduce high-intent partner monetization with explicit disclosure and consent-safe attribution. *(Execution in progress: windows 1-7 implemented and verified; phase-exit readiness baseline added.)*
- [ ] **Phase 4: Optional Ads Fallback** - Run reversible, low-density ad tests only if they do not damage retention or trust.

## Phase Details
### Phase 0: Instrumentation + Trust Baseline
**Goal**: Product and growth decisions are measurable, and trust-critical data controls are enforceable from day one.  
**Depends on**: Nothing  
**Requirements**: FDN-01, FDN-02, FDN-03, TRUST-01, TRUST-02, TRUST-03  
**Deliverables**:
- Canonical event taxonomy and live dashboards for activation, D1/D7/D30, WAU/MAU, and maintenance completion.
- GDPR consent ledger and working export/deletion flows.
- Trust schema primitives in Express + Drizzle/Postgres for hash metadata, append-only audit events, and lock-state policy fields.
**KPI Exit Criteria**:
- >=95% critical event integrity (required event properties present and valid).
- D1/D7/D30 dashboards live and queryable by channel/country/platform.
- 100% pass for consent create/revoke/export/delete acceptance checks.
- 0 critical auth/session or trust-policy defects in pre-phase hardening.
**Risk Controls**:
- Block phase exit if analytics gaps exceed threshold.
- Keep one migration pipeline for auth and domain tables to prevent drift.
- Enforce server-side policy checks for lock state and trust-critical writes.
**Success Criteria** (what must be TRUE):
1. Founder can identify drop-off points in onboarding and first-month retention from live cohort views.
2. User consent status is auditable and revocation affects downstream data handling behavior.
3. Trust-critical record changes can be traced with immutable actor/source metadata.
**Plans**: See `.planning/phases/phase-0-instrumentation-trust-baseline.md`

### Phase 1: MVP PMF Probe (Maintenance Loop)
**Goal**: Users repeatedly use AutoCare to plan and complete maintenance, reducing surprise-cost anxiety.  
**Depends on**: Phase 0  
**Requirements**: MVP-01, MVP-02, MVP-03, MVP-04, MVP-05, MVP-06, MVP-07, MVP-08, MVP-09, MVP-10  
**Deliverables**:
- Expo mobile flows for vehicle profile, service history timeline, reminders (time + mileage), and action feed (`do now / plan / defer`).
- Basic 3-6 month maintenance budget forecast with clear explanation of recommendation urgency.
- Authenticated API/data path using Better Auth + Express + Drizzle and R2 signed uploads for maintenance artifacts.
- Media-first history endpoints/flows for timeline evidence (photo/document attachments with metadata).
- Per-vehicle household/micro-fleet role assignments (`owner/manager/driver/viewer`) with organization guardrails.
- Minimal Next.js read-only viewer for signed/shareable maintenance report output.
**KPI Exit Criteria**:
- Activation >=35% (`vehicle + first maintenance item + reminder in 24h`).
- D7 retention >=20%.
- D30 retention >=10% overall and >=12% for primary ICP cohort.
- >=30% of retained users complete at least one recommended maintenance action by day 30.
- WAU/MAU >=0.35.
**Risk Controls**:
- No hard paywall or ad placement in core loop.
- Hold phase if recommendation quality or trust feedback drives retention decline.
- Keep scope constrained; defer realtime and advanced offline conflict UX.
- Track and review entry-friction metrics (time-to-first-log, first-log completion, reminder completion) before phase exit.
**Success Criteria** (what must be TRUE):
1. User can set up a vehicle and receive maintenance reminders with actionable next steps.
2. User can understand near-term maintenance cost outlook and why an action is prioritized.
3. User can complete at least one maintenance action loop with persistent history.
4. User trust remains intact while uploading/viewing maintenance artifacts.
**Plans**: See `.planning/phases/phase-1-mvp-pmf-probe.md`

### Phase 2: Subscription Fit
**Goal**: Paid features increase revenue without degrading retention or trust in the free experience.  
**Depends on**: Phase 1  
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04  
**Deliverables**:
- Premium forecast depth, multi-vehicle support, richer report exports, and contextual paywall/trial entry points.
- Subscription experiments (monthly + annual, trial variants) and cancellation reason instrumentation.
- Guardrail logic limiting paywall exposure before meaningful value actions are completed.
**KPI Exit Criteria**:
- Trial start from paywall viewers >=8%.
- Trial-to-paid >=25% baseline (target >=35% after optimization).
- Month-2 payer retention >=70%.
- Refund rate <4%.
- Free-tier D30 retention degradation <=15% relative to pre-paywall baseline.
**Risk Controls**:
- Global rollback if conversion gains are accompanied by harmful retention or trust deltas.
- Segmented paywall timing based on completed value actions.
- Preserve a useful free tier to avoid top-of-funnel collapse.
**Success Criteria** (what must be TRUE):
1. User can perceive clear premium value tied to maintenance predictability outcomes.
2. Paying users continue active maintenance behavior after conversion.
3. Free users retain meaningful utility without coercive monetization patterns.
**Plans**: See `.planning/phases/phase-2-subscription-fit.md`

### Phase 3: Trust-Safe Affiliate Layer
**Goal**: Affiliate monetization is additive, transparent, and behavior-aligned without eroding trust.  
**Depends on**: Phase 2  
**Requirements**: AFF-01, AFF-02, AFF-03  
**Deliverables**:
- High-intent partner placements linked to recommendations and service milestones.
- Explicit commercial disclosure components and consent-aware attribution handling.
- Partner/category conversion and retention impact reporting.
**KPI Exit Criteria**:
- Affiliate CTR >=3% on high-intent surfaces.
- Click-to-conversion >=5% in at least one category.
- 100% disclosure compliance pass in audit samples.
- No statistically significant retention decline vs matched control cohort.
- "Hidden sponsorship" support complaints <1% of tickets.
**Risk Controls**:
- Pause expansion if trust signals or retention regress.
- Reject low-quality/high-noise partners even if short-term revenue looks positive.
- Enforce clear sponsored labeling by policy and UI tests.
**Success Criteria** (what must be TRUE):
1. User can distinguish recommendations from commercial placements without ambiguity.
2. Affiliate offers appear only in relevant maintenance contexts.
3. Monetization lift does not reduce retained maintenance behavior.
**Plans**: See `.planning/phases/phase-3-trust-safe-affiliate.md`

### Phase 4: Optional Ads Fallback
**Goal**: Ads provide reversible incremental revenue for non-paying segments without harming core business health.  
**Depends on**: Phase 3  
**Requirements**: ADS-01, ADS-02  
**Deliverables**:
- Low-density contextual or rewarded ad surfaces with strict frequency caps.
- Segmentation controls excluding trials/high-propensity subscribers from ad exposure.
- Ad impact monitoring against retention and subscription conversion.
**KPI Exit Criteria**:
- ARPDAU uplift for ad-exposed free cohort >=10% vs no-ad control.
- D30 retention delta not worse than -5% vs control.
- Subscription conversion not reduced >10% in ad cohort vs no-ad cohort.
- eCPM/fill stability for 4 consecutive weeks.
**Risk Controls**:
- Disable ads by default if any guardrail fails.
- Never place ads in onboarding or before activation milestones.
- Keep ads as fallback, not primary growth strategy.
**Success Criteria** (what must be TRUE):
1. User experience remains usable and trustworthy under ad exposure constraints.
2. Ad monetization is net-positive without cannibalizing subscription path quality.
**Plans**: See `.planning/phases/phase-4-ads-fallback.md`

## Progress Table
| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Instrumentation + Trust Baseline | 1/1 | Complete | 2026-04-17 |
| 1. MVP PMF Probe (Maintenance Loop) | 1/1 | Engineering complete (KPI/business closeout pending) | - |
| 2. Subscription Fit | 1/1 | In progress (windows 1-49 executed: `.planning/phases/phase-2/EXECUTION.md`; retention KPI evidence still pending) | - |
| 3. Trust-Safe Affiliate Layer | 1/1 | In progress (windows 1-15 executed: `.planning/phases/phase-3/EXECUTION.md`) | - |
| 4. Optional Ads Fallback | 0/1 | Not started | - |

## Requirement Coverage Check
- Mapped requirements: 22 / 22
- Orphaned requirements: 0
- Duplicate mappings: 0

