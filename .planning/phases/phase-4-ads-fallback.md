# Phase 4 - Optional Ads Fallback

## Goal
Validate ads as a controlled fallback monetization channel without damaging retention or subscription outcomes.

## Sequencing
1. Low-density contextual/rewarded ad placement setup.
2. Segment and frequency controls.
3. Guardrail monitoring and rollback readiness.

## Deliverables
- Rewarded/contextual ad units with strict per-session/day caps.
- Exclusion segments for trial users and high-propensity subscribers.
- Experiment dashboard comparing ad and no-ad cohorts across revenue and retention.

## KPI Exit Criteria
- ARPDAU uplift >=10% for ad cohort vs no-ad control.
- D30 retention delta no worse than -5% vs control.
- Subscription conversion reduction <=10% vs no-ad control.
- Stable fill/eCPM for 4 consecutive weeks.

## Risk Controls
- Keep ads off by default until all entry guards pass.
- No interstitials in onboarding or pre-activation journey.
- Immediate rollback if retention or subscription guardrails fail.

## Requirement Mapping
- ADS-01, ADS-02

