# AutoCare Requirements (v1)

## Product and Strategy Requirements

### Foundation and Measurement
- **FDN-01**: Capture canonical product events for onboarding, reminders, maintenance actions, paywall exposure, and churn signals.
- **FDN-02**: Provide cohort dashboards for activation, D1/D7/D30 retention, WAU/MAU, and completed maintenance actions.
- **FDN-03**: Support founder-level segmentation by country, platform, and acquisition channel.

### Trust and Data Controls
- **TRUST-01**: Record consent lifecycle events and provide user-facing export/deletion flows.
- **TRUST-02**: Persist append-only, actor-aware audit events for trust-critical domain actions.
- **TRUST-03**: Enforce server-side policy for lock-state and trust-critical write operations.

### MVP Maintenance Loop
- **MVP-01**: User can create and manage a vehicle profile.
- **MVP-02**: User can log and review maintenance history in a timeline.
- **MVP-03**: User receives smart reminders based on time and mileage.
- **MVP-04**: User sees a prioritized action feed (`do now / plan / defer`) with urgency context.
- **MVP-05**: User sees a basic 3-6 month maintenance cost outlook.
- **MVP-06**: Mobile app uses Better Auth + Express protected endpoints with persisted authenticated session behavior.
- **MVP-07**: User can upload maintenance artifacts with signed R2 URL flow and view report output via Next.js viewer.
- **MVP-08**: User can attach media-first evidence (photos/documents) directly to vehicle timeline events with searchable metadata.
- **MVP-09**: Organization supports per-vehicle role assignments (`owner/manager/driver/viewer`) for family and micro-fleet collaboration.
- **MVP-10**: Product analytics captures entry-friction metrics (time-to-first-log, first-log completion rate, reminder completion by persona).

### Subscription Layer
- **SUB-01**: Premium plan provides advanced forecasting depth and multi-vehicle workflows.
- **SUB-02**: App supports trial and plan experiments (monthly/annual) with contextual paywall entry.
- **SUB-03**: System captures cancellation reasons and payer retention metrics by cohort.
- **SUB-04**: Free tier remains functional and does not lose core maintenance utility.

### Affiliate Layer
- **AFF-01**: Affiliate placements appear only at high-intent maintenance moments.
- **AFF-02**: Every affiliate placement uses explicit commercial disclosure and consent-aware attribution.
- **AFF-03**: System tracks affiliate impact on conversion, retention, and trust complaints.

### Ads Fallback
- **ADS-01**: Ads are contextual/rewarded only, with strict frequency caps and no onboarding interruption.
- **ADS-02**: Ad exposure must be segment-aware and reversible based on retention/subscription guardrails.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FDN-01 | Phase 0 | Complete |
| FDN-02 | Phase 0 | Complete |
| FDN-03 | Phase 0 | Complete |
| TRUST-01 | Phase 0 | Complete |
| TRUST-02 | Phase 0 | Complete |
| TRUST-03 | Phase 0 | Complete |
| MVP-01 | Phase 1 | Implemented (engineering) |
| MVP-02 | Phase 1 | Implemented (engineering) |
| MVP-03 | Phase 1 | Implemented (engineering) |
| MVP-04 | Phase 1 | Implemented (engineering) |
| MVP-05 | Phase 1 | Implemented (engineering) |
| MVP-06 | Phase 1 | Implemented (engineering) |
| MVP-07 | Phase 1 | Implemented (engineering) |
| MVP-08 | Phase 1 | Implemented (engineering) |
| MVP-09 | Phase 1 | Implemented (engineering) |
| MVP-10 | Phase 1 | Implemented (engineering) |
| SUB-01 | Phase 2 | In progress (windows 1-3 baseline/depth implemented) |
| SUB-02 | Phase 2 | In progress (windows 1-3 baseline/depth implemented) |
| SUB-03 | Phase 2 | In progress (windows 1-3 baseline/depth implemented) |
| SUB-04 | Phase 2 | In progress (windows 1-3 baseline/depth implemented) |
| AFF-01 | Phase 3 | Pending |
| AFF-02 | Phase 3 | Pending |
| AFF-03 | Phase 3 | Pending |
| ADS-01 | Phase 4 | Pending |
| ADS-02 | Phase 4 | Pending |

