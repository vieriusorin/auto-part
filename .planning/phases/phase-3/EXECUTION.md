# Phase 3 Execution

## Window 1 execution (affiliate intent/disclosure baseline)

### TDD flow
1. Added shared affiliate contracts for intent surfaces, offer listing, and click tracking.
2. Implemented affiliate HTTP routes with explicit disclosure enforcement and consent-aware attribution flagging.
3. Added runtime integration tests plus OpenAPI registry coverage verification.
4. Re-ran server typecheck and focused server Vitest suites.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - `packages/shared/src/contracts/index.ts`
- Server routes:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - new endpoints:
    - `GET /api/affiliate/offers` (`listAffiliateOffers`)
    - `POST /api/affiliate/click` (`trackAffiliateClick`)
- Route registration:
  - `apps/server/src/infrastructure/di/container.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
- Integration tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`

---

## Window 2 execution (persisted click events + affiliate aggregates)

### TDD flow
1. Added shared metrics response contracts for affiliate funnel aggregation surfaces.
2. Implemented click event persistence via analytics raw events and added aggregate metrics endpoint.
3. Expanded affiliate integration tests for persisted metrics and invalid offer/surface guard behavior.
4. Re-ran server/shared typecheck and focused server test suites.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added:
    - `AffiliateMetricsResponseDataSchema`
    - intent/category metrics item schemas
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - click tracking now persists analytics events (`affiliate_click__*`, `affiliate_click_attributed__*`)
  - new endpoint:
    - `GET /api/affiliate/metrics` (`getAffiliateMetrics`)
  - click guard:
    - invalid offer/intent combinations return `400 affiliate_offer_invalid`.
- OpenAPI contract registry:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - includes `getAffiliateMetrics` operation id.
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - validates aggregate totals + by-intent/by-category rollups from persisted click stream.

---

## Window 3 execution (trust-impact signals: exposure + complaints)

### TDD flow
1. Added shared affiliate contracts for exposure tracking, complaint reporting, and impact summary responses.
2. Implemented runtime endpoints for exposure and complaint ingestion, plus impact aggregates from persisted events.
3. Expanded affiliate integration tests and OpenAPI operation registry coverage.
4. Re-ran focused server/shared typecheck and targeted server Vitest suites.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added:
    - `TrackAffiliateExposureBodySchema`
    - `TrackAffiliateExposureResponseDataSchema`
    - `ReportAffiliateComplaintBodySchema`
    - `ReportAffiliateComplaintResponseDataSchema`
    - `AffiliateImpactResponseDataSchema`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - new endpoints:
    - `POST /api/affiliate/exposure` (`trackAffiliateExposure`)
    - `POST /api/affiliate/complaint` (`reportAffiliateComplaint`)
    - `GET /api/affiliate/impact` (`getAffiliateImpact`)
  - impact summary derives:
    - exposures
    - clicks
    - attributedClicks
    - complaints
    - complaintRatePercent
- OpenAPI contract registry:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - includes operation IDs:
    - `getAffiliateImpact`
    - `trackAffiliateExposure`
    - `reportAffiliateComplaint`
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - validates exposure/click/complaint ingestion and impact summary aggregation.

---

## Window 4 execution (affiliate dashboard segmentation)

### TDD flow
1. Added shared dashboard contracts for partner-level conversion and trust-segment aggregates with filter query support.
2. Implemented dashboard endpoint deriving partner conversion and trust complaint segmentation from persisted affiliate events.
3. Expanded integration tests for dashboard totals/partner ratios/segment metrics and country-platform-channel filtering.
4. Re-ran focused server/shared typecheck and targeted server Vitest suites.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added:
    - `AffiliateDashboardQuerySchema`
    - `AffiliateDashboardResponseDataSchema`
    - partner and trust segment dashboard item schemas
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - new endpoint:
    - `GET /api/affiliate/dashboard` (`getAffiliateDashboard`)
  - provides:
    - totals (`exposures/clicks/attributedClicks/complaints`)
    - partner conversion stats (`clickThroughPercent`, `attributionRatePercent`)
    - trust segmentation by `country|platform|channel`
  - supports optional filter query:
    - `country`
    - `platform`
    - `channel`
- OpenAPI contract registry:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - includes operation id:
    - `getAffiliateDashboard`
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - validates dashboard aggregation semantics and filter behavior.

---

## Window 5 execution (conversion trend buckets)

### TDD flow
1. Added shared trend contracts for day/week bucketed affiliate metrics and optional segment filters.
2. Implemented trend endpoint deriving bucketed conversion/trust metrics from persisted affiliate event stream.
3. Expanded affiliate integration tests for day/week bucket behavior and filtered trend outputs.
4. Re-ran focused server/shared typecheck and targeted server Vitest suites.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added:
    - `AffiliateTrendsQuerySchema`
    - `AffiliateTrendsResponseDataSchema`
    - trend bucket schema with conversion/trust rates
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - new endpoint:
    - `GET /api/affiliate/trends` (`getAffiliateTrends`)
  - supports:
    - `granularity=day|week`
    - optional `country/platform/channel` filters
  - outputs per-bucket:
    - exposures/clicks/attributedClicks/complaints
    - clickThroughPercent/attributionRatePercent/complaintRatePercent
- OpenAPI contract registry:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - includes operation id:
    - `getAffiliateTrends`
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - validates day and week bucket aggregation + filtered trend behavior.

---

## Window 6 execution (KPI gate snapshot endpoint)

### TDD flow
1. Added shared KPI gate snapshot contracts including checkpoint booleans and optional segment filters.
2. Implemented KPI gate endpoint deriving phase-checkpoint metrics from persisted affiliate signals.
3. Expanded affiliate integration tests and OpenAPI operation coverage.
4. Re-ran focused server/shared typecheck and targeted server Vitest suites.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added:
    - `AffiliateKpiGatesQuerySchema`
    - `AffiliateKpiGatesResponseDataSchema`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - new endpoint:
    - `GET /api/affiliate/kpi-gates` (`getAffiliateKpiGates`)
  - snapshot fields:
    - exposures/clicks/attributedClicks/complaints
    - ctrPercent
    - clickToConversionProxyPercent
    - complaintRatePercent
    - retentionGuardProxyPercent
  - checkpoint booleans:
    - `ctrAtLeast3Percent`
    - `conversionProxyAtLeast5Percent`
    - `complaintRateUnder1Percent`
    - `retentionGuardProxyAtLeast95Percent`
- OpenAPI contract registry:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - includes operation id:
    - `getAffiliateKpiGates`
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - validates KPI snapshot values and checkpoint gating semantics.

---

## Window 7 execution (phase-exit readiness endpoint)

### TDD flow
1. Added shared phase-exit readiness contracts for criteria outcomes and missing-evidence reporting.
2. Implemented readiness endpoint deriving KPI gate status plus explicit evidence gaps.
3. Expanded affiliate integration tests and OpenAPI operation coverage.
4. Re-ran focused server/shared typecheck and targeted server Vitest suites.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added:
    - `AffiliatePhaseExitReadinessResponseDataSchema`
    - phase-exit criterion schema
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - new endpoint:
    - `GET /api/affiliate/phase-exit-readiness` (`getAffiliatePhaseExitReadiness`)
  - response includes:
    - `ready` aggregate boolean
    - criteria pass/fail entries with values/reasons
    - explicit `missingEvidence` list
- OpenAPI contract registry:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - includes operation id:
    - `getAffiliatePhaseExitReadiness`
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - validates readiness semantics for empty-data and populated-data scenarios.

---

## Window 8 execution (admin boundary for affiliate analytics)

### TDD flow
1. Added explicit admin permission guards to affiliate analytics endpoints while preserving user-facing offer and tracking endpoints.
2. Added access-control integration coverage validating `forbidden_permission` for non-admin users and success for admins.
3. Updated OpenAPI registration setup to initialize affiliate routes with auth module context for contract tests.
4. Re-ran focused Vitest suites and server typecheck.

### Implemented
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - added `admin.analytics.read` permission middleware on:
    - `GET /api/affiliate/metrics`
    - `GET /api/affiliate/impact`
    - `GET /api/affiliate/dashboard`
    - `GET /api/affiliate/trends`
    - `GET /api/affiliate/kpi-gates`
    - `GET /api/affiliate/phase-exit-readiness`
  - tagged analytics endpoints with `Admin` + `Affiliate` for OpenAPI boundary clarity.
  - added explicit admin audience marker in analytics payloads:
    - `meta: { audience: 'admin' }`
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added `meta.audience = 'admin'` requirement to:
    - metrics / impact / dashboard / trends / kpi-gates / phase-exit-readiness response schemas
- DI wiring:
  - `apps/server/src/infrastructure/di/container.ts`
  - passes `authModule` and `authHttpGuards` into `createAffiliateRouter(...)` so permission checks are active in production app wiring.
- Access-control coverage:
  - `apps/server/src/interfaces/http/__tests__/access-control.integration.test.ts`
  - new test:
    - `enforces admin-only access for affiliate analytics KPIs`
- Affiliate route integration harness:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - injects admin-shaped request user in local test app so analytics route behavior stays testable in module-isolated runs.
- OpenAPI contract setup:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - initializes affiliate router with stub auth module.

---

## Window 9 execution (disclosure audit metric + readiness integration)

### TDD flow
1. Added explicit shared contract for disclosure audit analytics payloads with admin audience metadata.
2. Implemented disclosure-violation event capture and new admin analytics endpoint for disclosure compliance.
3. Wired phase-exit readiness criterion `disclosure_compliance_full` to measured audit data instead of a static placeholder.
4. Expanded affiliate integration tests and OpenAPI operation-id coverage, then re-ran focused checks.

### Implemented
- Shared contracts:
  - `packages/shared/src/contracts/affiliate.ts`
  - added:
    - `AffiliateDisclosureAuditQuerySchema`
    - `AffiliateDisclosureAuditResponseDataSchema`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - added new event prefix:
    - `affiliate_disclosure_violation__*`
  - click/exposure ingestion now records disclosure-violation events when disclosure is absent.
  - new endpoint:
    - `GET /api/affiliate/disclosure-audit` (`getAffiliateDisclosureAudit`)
  - response includes:
    - `totals.trackedInteractions`
    - `totals.compliantInteractions`
    - `totals.violations`
    - `disclosureCompliancePercent`
    - `checkpoint.disclosureComplianceFull`
  - phase-exit readiness now derives:
    - `disclosure_compliance_full` from measured audit metrics
    - `affiliate_disclosure_audit` in `missingEvidence` when no tracked interactions exist.
- OpenAPI contract registry:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - includes operation id:
    - `getAffiliateDisclosureAudit`
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - validates:
    - disclosure audit aggregation semantics
    - readiness behavior for disclosure compliance pass/fail paths.
- Access matrix documentation:
  - `apps/server/ACCESS_MATRIX.md`
  - added affiliate endpoint access split (user interaction vs admin analytics).

---

## Window 10 execution (retention control-cohort linkage)

### TDD flow
1. Added retention cohort comparator logic using persisted user-level analytics events.
2. Replaced phase-exit retention placeholder with measured cohort delta evaluation.
3. Expanded affiliate integration coverage with explicit decline scenario and evidence completeness assertions.
4. Re-ran focused affiliate/openapi/access tests plus server typecheck.

### Implemented
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - added retention cohort comparator:
    - affiliate cohort users: users with affiliate exposure/click interactions
    - control cohort users: non-affiliate users with subscription retention-signal events
  - retention success signal:
    - `subscription_month2_active`
  - phase-exit readiness now derives:
    - `no_retention_decline_detected` from measured delta:
      - `affiliateRetentionRatePercent - controlRetentionRatePercent`
    - pass condition:
      - delta `>= 0`
    - evidence completeness:
      - `retention_control_cohort_comparison` only when either cohort is missing
    - explicit decline reason includes affiliate/control percentages.
- Integration coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - added scenario:
    - control cohort retained while affiliate cohort not retained -> negative delta
    - criterion fails with expected threshold/value
    - missing-evidence marker omitted once both cohorts exist.

---

## Window 11 execution (mobile high-intent affiliate activation)

### TDD flow
1. Regenerated OpenAPI + client types so affiliate endpoint contracts are consumable in mobile/API-client layers.
2. Added typed api-client hooks for affiliate offers and interaction tracking mutations.
3. Wired vehicle next-actions high-intent screen to display disclosed affiliate offers and emit exposure/click/complaint signals.
4. Re-ran api-client and mobile typechecks.

### Implemented
- OpenAPI/codegen reliability + contract sync:
  - `apps/server/scripts/generate-openapi.ts`
  - `apps/server/openapi.json`
  - `apps/server/openapi/affiliate.json`
  - `packages/api-client/src/types.gen.ts`
- API client hooks + cache keys:
  - `packages/api-client/src/react/hooks.ts`
    - `useAffiliateOffers`
    - `useTrackAffiliateExposure`
    - `useTrackAffiliateClick`
    - `useReportAffiliateComplaint`
  - `packages/api-client/src/query-keys.ts` (`queryKeys.affiliate.*`)
  - `packages/api-client/src/react/index.ts` exports
- Mobile high-intent activation surface:
  - `apps/mobile/app/vehicle/[id]/next.tsx`
  - Added "Sponsored recommendations" section on maintenance next-actions screen.
  - Exposure tracking on offer render, click attribution on offer open, complaint capture path.
  - Disclosure label is rendered per offer before click action.

### Verification
- `npm run openapi:sync` -> PASS
- `npm run typecheck -w @autocare/api-client` -> PASS
- `npm run typecheck -w @autocare/mobile` -> PASS

---

## Window 12 execution (mobile affiliate interaction test coverage)

### TDD flow
1. Extracted affiliate interaction payload and accessibility-label helpers from the next-actions screen into a pure helper module.
2. Added focused Vitest coverage for no-offers visibility, click payload, complaint payload, and accessibility label builders.
3. Rewired next-actions screen to consume tested helper logic.
4. Re-ran focused mobile Vitest and mobile typecheck.

### Implemented
- Helper logic:
  - `apps/mobile/app/vehicle/[id]/affiliate-offers.ts`
- Test coverage:
  - `apps/mobile/app/vehicle/[id]/affiliate-offers.test.ts`
- Screen wiring:
  - `apps/mobile/app/vehicle/[id]/next.tsx`
  - now consumes helper functions for:
    - no-offers message visibility
    - click payload construction
    - complaint payload construction
    - accessibility label construction

### Verification
- `npm run test:vitest -w @autocare/mobile -- "app/vehicle/[id]/affiliate-offers.test.ts"` -> PASS
- `npm run typecheck -w @autocare/mobile` -> PASS

---

## Window 13 execution (disclosure-label contract regression guard)

### TDD flow
1. Added server integration assertion that all affiliate offers expose canonical disclosure label copy.
2. Added OpenAPI contract assertion that `disclosureLabel` is fixed to `Sponsored recommendation`.
3. Re-ran focused affiliate + OpenAPI contract suites and server typecheck.

### Implemented
- Server integration regression coverage:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `listAffiliateOffers` flow now asserts all offers include `disclosureLabel: 'Sponsored recommendation'`.
- OpenAPI contract regression coverage:
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - validates `/api/affiliate/offers` response schema keeps `disclosureLabel` enum fixed to the canonical sponsored copy.

### Verification
- `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS
- `npm run typecheck -w @autocare/server` -> PASS

---

## Window 14 execution (api-client disclosure-label type contract guard)

### TDD flow
1. Added a dedicated api-client type-contract test that targets generated `listAffiliateOffers` response typing.
2. Asserted `disclosureLabel` resolves to canonical literal type (`'Sponsored recommendation'`) via compile-time type expectations.
3. Re-ran focused api-client Vitest and package typecheck.

### Implemented
- API client type-contract coverage:
  - `packages/api-client/src/affiliate-contract.test.ts`
  - derives offer item type from generated `operations['listAffiliateOffers']` schema path.
  - asserts `disclosureLabel` remains literal typed as `'Sponsored recommendation'`.

### Verification
- `npm run test:vitest -w @autocare/api-client -- src/affiliate-contract.test.ts` -> PASS
- `npm run typecheck -w @autocare/api-client` -> PASS

---

## Window 15 execution (CI disclosure-guard bundle command)

### TDD flow
1. Added a root-level command to run all affiliate disclosure regression guards as one CI-friendly bundle.
2. Executed the bundled command end-to-end to validate server integration, OpenAPI contract, api-client type contract, and package typechecks.
3. Confirmed bundle stability for repeated trust-regression verification.

### Implemented
- Root workspace script:
  - `package.json`
  - added `verify:affiliate:disclosure-guards`:
    - server focused tests:
      - `src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
      - `src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
    - api-client focused type-contract test:
      - `src/affiliate-contract.test.ts`
    - server + api-client typechecks

### Verification
- `npm run verify:affiliate:disclosure-guards` -> PASS

