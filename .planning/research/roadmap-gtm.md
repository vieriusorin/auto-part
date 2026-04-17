# Roadmap + GTM Sequencing: AutoCare (EU Solo Founder)

**Date:** 2026-04-16  
**Scope:** Phased delivery + GTM sequencing with measurable exits  
**Audience:** `/gsd:new-project` roadmap orchestration  
**Overall confidence:** MEDIUM-HIGH (strong on subscription benchmarks and EU disclosure/privacy direction; medium on category-specific AutoCare paid conversion)

## Strategy in one line

Build **retention before monetization depth**: prove repeat maintenance behavior first, then turn on subscriptions, then selective affiliate and ad layers only after trust and cohort quality are stable.

## Operating assumptions (evidence-informed)

1. Subscription outcomes are driven heavily by first-session onboarding/paywall quality; ~80%+ of trials start on Day 0 in benchmark datasets.
2. Early churn is steep; first month/first renewal behavior is the highest-leverage retention zone.
3. Annual plans retain materially better than weekly/monthly, but monthly remains useful as low-friction entry.
4. EU trust/compliance is a growth lever, not only a legal checkbox: explicit disclosure and consent quality affect monetization viability (especially affiliate and ad targeting).
5. For AutoCare, premature ad load or aggressive paywalls will likely damage retention before PMF.

## KPI North Star and guardrails

- **North Star:** `% of active users with an on-time completed maintenance action in last 30 days`
- **Activation metric:** `% new users completing first vehicle + first maintenance item + first reminder in 24h`
- **Retention core:** D30 retained users, WAU/MAU, and repeat task completion rate
- **Monetization core:** Visitor-to-trial, trial-to-paid, payer retention by month 2, ARPU uplift vs control
- **Trust/compliance guardrails:** consent opt-in rates, complaint/refund rates, disclosure compliance checks

## Phase plan with measurable exits

## Phase 0 - Foundation Instrumentation (Weeks 0-2)
Goal: make every later decision measurable.

### Build
- Event taxonomy for onboarding, value actions, reminder interactions, paywall exposure, trial start, churn reason capture.
- Cohort pipeline by country/platform/channel.
- Privacy ledger: consent events, purpose mapping, data deletion/export flow.

### GTM focus
- Founder-led waitlist and problem interviews in 2-3 EU markets.
- No paid UA yet; gather qualitative JTBD language for onboarding and ASO copy.

### Exit gates (must pass)
- >=95% of critical events arriving with valid properties.
- Cohort dashboard live for D1/D7/D30 and activation funnel.
- 20-30 ICP interviews completed with coded pain themes.
- GDPR-consent flow audited and functioning end-to-end.

---

## Phase 1 - MVP PMF Probe (Weeks 3-10)
Goal: prove AutoCare delivers recurring maintenance value without heavy monetization friction.

### Build
- Vehicle profile + service timeline import/manual entry.
- Smart reminders (time + mileage).
- Action feed: "do now / plan / defer".
- Basic upcoming maintenance budget forecast.

### GTM focus
- Narrow launch in 1 primary language market + 1 secondary market.
- Acquisition mix: founder communities, local car forums, ASO baseline, referral beta invites.
- Positioning: "fewer surprise repair costs," not "car management app."

### Monetization in phase
- Freemium only; optional soft "coming soon premium" preference capture.
- No ads.
- No affiliate links yet.

### Retention loops to implement
- Reminder -> action completed -> positive progress feedback.
- Monthly "maintenance risk" digest tied to upcoming costs.
- Service streak badges tied to practical outcomes (not gamification alone).

### Exit gates (must pass to unlock paid subscription tests)
- Activation >=35% (vehicle + first maintenance item + reminder set in 24h).
- D7 retention >=20%.
- D30 retention >=10% overall and >=12% in primary ICP cohort.
- >=30% of retained users complete at least one recommended action by day 30.
- WAU/MAU >=0.35.
- NPS or PMF proxy: >=35% "very disappointed if AutoCare disappeared" in active cohort survey.

If any gate fails: do not proceed to subscription rollout; run a 2-4 week retention optimization sprint first.

---

## Phase 2 - Subscription Fit (Weeks 11-18)
Goal: monetize proven value while protecting retention.

### Build
- Premium features: advanced forecasting horizon, multi-vehicle support, richer report exports, deeper recommendations.
- Paywall experiments by trigger (contextual vs onboarding).
- Trial/offer framework + cancellation reason capture.

### GTM focus
- Shift messaging from "organized maintenance" to "predict and reduce ownership shocks."
- Launch lifecycle messaging around value moments (after action completion, before expected maintenance peaks).
- Start lightweight paid UA only on channels where activation quality can be measured.

### Monetization timing and structure
- Introduce subscriptions after Phase 1 gates are sustained for 2 consecutive cohorts.
- Default offering: monthly + annual; push annual only after value proof events.
- Trial strategy: test 7-day vs 14-day; gate by value latency.
- Keep free tier useful to preserve top-of-funnel and referral loops.

### Exit gates (must pass to expand monetization mix)
- Trial start rate from paywall viewers >=8% (early benchmark target for non-hyper-optimized app).
- Trial-to-paid >=25% initially; stretch target >=35% after optimization.
- D30 retention of free users does not drop >15% relative to pre-paywall baseline.
- Month-2 payer retention >=70% (monthly plan).
- Refund rate <4%.
- Net revenue from subscription cohorts positive after acquisition + infra variable costs (solo-founder efficiency gate).

If paid conversion rises but retention drops sharply: reduce paywall frequency and re-segment paywall timing by completed value actions.

---

## Phase 3 - Affiliate Layer (Weeks 19-28)
Goal: add transactional monetization tied to user intent, without eroding trust.

### Build
- Partner recommendations at natural intent points (service booking, parts, diagnostics, insurance add-ons).
- Disclosure components and consent-aware link handling.
- Conversion attribution by partner/category.

### GTM focus
- Localized partner pages by country with transparent "why this recommendation" copy.
- Co-marketing pilots with 2-4 trusted service partners.

### Monetization timing and structure
- Turn on affiliate only after subscription baseline is healthy.
- Prioritize high-intent, low-noise placements (post-recommendation or pre-service milestone), not banner-like spam.
- Hard requirement: clear commercial labeling for every affiliate placement.

### Exit gates (must pass before ad monetization tests)
- Affiliate CTR >=3% on high-intent surfaces.
- Affiliate conversion from click >=5% in at least one category.
- No statistically significant retention decline in users exposed to affiliate surfaces vs matched control.
- Disclosure compliance checks pass 100% in quarterly audit sample.
- Support complaints related to "hidden ads/sponsorship" <1% of tickets.

If trust signals worsen, pause affiliate expansion and simplify to fewer, higher-quality partners.

---

## Phase 4 - Ads as Controlled Fallback (Weeks 29+)
Goal: ads monetize non-paying segments without cannibalizing subscription/affiliate LTV.

### Build
- Rewarded/contextual ad placements only (initially).
- Frequency caps per session/day.
- "Remove ads" upsell tied to subscription.

### GTM focus
- Ads are not a growth message; they are a monetization backstop.
- Keep premium messaging centered on predictability and savings, not ad removal alone.

### Monetization timing and structure
- Start with low ad density in low-intent zones (e.g., after task completion).
- No interstitials in onboarding or pre-activation.
- Segment: never show ads to active trial users or high-propensity subscribers.

### Exit gates (to keep ads on)
- ARPDAU uplift from ad-exposed free cohort >=10% vs no-ad control.
- D30 retention delta in ad cohort no worse than -5% vs control.
- Subscription conversion in ad cohort not reduced >10% relative to no-ad cohort.
- Fill/eCPM stability for 4 consecutive weeks.

If any gate fails, revert to affiliate + subscription-first mix and keep ads off by default.

## KPI gates between phases (single view)

| Gate | Phase 1 -> 2 | Phase 2 -> 3 | Phase 3 -> 4 |
|---|---|---|---|
| Activation | >=35% | >=40% | >=40% |
| D30 retention | >=10% overall | >=12% overall | >=12% overall |
| Monetization | N/A | Trial->Paid >=25%, M2 payer retention >=70% | Affiliate click->conversion >=5% |
| Trust | GDPR baseline live | Refund <4%, complaints controlled | 100% disclosure audit pass |
| Business viability | Value proof in cohorts | Subscription unit economics positive | No retention harm from affiliate |

## Founder operating cadence (solo execution)

- Weekly: activation + retention review, top churn reasons, 1 experiment shipped.
- Biweekly: monetization experiment readout with go/kill decision.
- Monthly: country-level cohort quality + trust/compliance audit.
- Quarterly: phase-gate decision with explicit "advance / hold / rollback."

## Risk controls and anti-patterns

- Do not add ads before retention proof.
- Do not hard-paywall core value before users complete first meaningful maintenance action.
- Do not scale paid UA until cohort retention and conversion stabilize.
- Do not blend affiliate content without explicit labels and consent-aware tracking.
- Do not optimize only for trial starts; optimize for retained payers and task outcomes.

## Recommended phase exits for roadmap orchestration

1. **Exit Phase 1 only if retention proof exists** (activation + D30 + action completion).
2. **Exit Phase 2 only if subscription is additive** (conversion up, retention not broken, refunds controlled).
3. **Exit Phase 3 only if affiliate is trust-safe** (compliance clean, no retention drag).
4. **Keep Phase 4 optional** and reversible; ads are a last monetization layer, not the business core.

## Sources (used for directional benchmarks and compliance framing)

- RevenueCat, State of Subscription Apps 2025: https://www.revenuecat.com/state-of-subscription-apps-2025/
- Business of Apps retention overview (2026 edition; directional baseline): https://www.businessofapps.com/data/app-retention-rates/
- European Commission, Influencer Legal Hub (disclosure principles): https://commission.europa.eu/topics/consumers/consumer-rights-and-complaints/influencer-legal-hub_en
- European Commission, DSA overview/impact pages (ad transparency constraints): https://digital-strategy.ec.europa.eu/en/policies/digital-services-act and https://digital-strategy.ec.europa.eu/en/policies/dsa-impact-platforms
- GDPR/ePrivacy cookie consent explainer (secondary source; validate with counsel for implementation): https://gdpr.eu/cookies/

## Confidence by area

| Area | Confidence | Notes |
|---|---|---|
| Retention sequencing | HIGH | Backed by strong subscription benchmark patterns |
| Monetization timing | MEDIUM-HIGH | Strong directional evidence; app-category specifics still need live tests |
| Affiliate/ad timing in EU | MEDIUM | Policy direction clear; country-level enforcement detail should be checked per launch market |
| Exact KPI thresholds | MEDIUM | Practical founder gates, should be tuned after first 2-3 cohorts |
