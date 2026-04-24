---
phase: phase-3-trust-safe-affiliate-window-1
validated: 2026-04-22
status: passed
validator: gsd:validate-phase
---

# Phase 3 Window 1 Validation

## Verdict
**PASS**

Window 1 affiliate baseline is implemented and validated for trust-safe disclosure and consent-aware attribution behavior.

## Window coverage
- AFF-01 baseline: high-intent affiliate offer listing by intent surface.
- AFF-02 baseline: explicit disclosure requirement + consent-aware attribution signal on click tracking.

## Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

## Executed checks
1. `npm run typecheck -w @autocare/server` -> PASS
2. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS

---

## Window 2 Validation Addendum

### Verdict
**PASS**

Window 2 persisted affiliate click + metrics baseline is implemented and validated.

### Window coverage
- AFF-03 baseline: track affiliate click event stream in persisted analytics storage and expose category/surface aggregates.
- AFF-02 hardening: reject invalid offer/intent combinations to prevent polluted attribution.

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run typecheck -w @autocare/server` -> PASS
2. `npm run typecheck -w @autocare/shared` -> PASS
3. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS

---

## Window 3 Validation Addendum

### Verdict
**PASS**

Window 3 trust-impact signal baseline is implemented and validated.

### Window coverage
- AFF-03 baseline extension: capture affiliate exposure + complaint signals and expose trust-impact summary.
- AFF-02 hardening extension: maintain explicit disclosure metadata in exposure/click pathways while adding trust complaint visibility.

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run typecheck -w @autocare/server` -> PASS
2. `npm run typecheck -w @autocare/shared` -> PASS
3. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS

---

## Window 4 Validation Addendum

### Verdict
**PASS**

Window 4 affiliate dashboard segmentation baseline is implemented and validated.

### Window coverage
- AFF-03 depth: expose partner-level conversion and trust complaint segmentation metrics.
- AFF-03 depth: provide filterable dashboard views by country/platform/channel for analysis workflows.

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run typecheck -w @autocare/server` -> PASS
2. `npm run typecheck -w @autocare/shared` -> PASS
3. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS

---

## Window 5 Validation Addendum

### Verdict
**PASS**

Window 5 affiliate trend bucket baseline is implemented and validated.

### Window coverage
- AFF-03 depth: provide day/week bucketed conversion and trust trend metrics.
- AFF-03 depth: enable segmented trend analysis via country/platform/channel filters.

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run typecheck -w @autocare/server` -> PASS
2. `npm run typecheck -w @autocare/shared` -> PASS
3. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS

---

## Window 6 Validation Addendum

### Verdict
**PASS**

Window 6 affiliate KPI gate snapshot baseline is implemented and validated.

### Window coverage
- AFF-03 depth: expose phase KPI checkpoint snapshot with pass/fail booleans.
- AFF-03 depth: provide filtered gate evaluation support by country/platform/channel.

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run typecheck -w @autocare/server` -> PASS
2. `npm run typecheck -w @autocare/shared` -> PASS
3. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS

---

## Window 7 Validation Addendum

### Verdict
**PASS**

Window 7 phase-exit readiness baseline is implemented and validated.

### Window coverage
- AFF-03 depth: provide explicit phase-exit readiness evaluation and missing-evidence visibility.
- AFF-03 depth: expose criteria-level rationale for operational decision-making.

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run typecheck -w @autocare/server` -> PASS
2. `npm run typecheck -w @autocare/shared` -> PASS
3. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS

---

## Window 8 Validation Addendum

### Verdict
**PASS**

Window 8 admin boundary for affiliate analytics is implemented and validated.

### Window coverage
- AFF-03 governance: enforce clear separation between user-facing affiliate interaction flows and internal/admin analytics surfaces.
- AFF-03 trust operations: restrict KPI/impact/dashboards/trends/readiness visibility to admin-capable actors only.
- AFF-03 boundary clarity: expose explicit admin audience marker in analytics payload contracts (`meta.audience = 'admin'`).

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - `apps/server/src/infrastructure/di/container.ts`
- Tests:
  - `apps/server/src/interfaces/http/__tests__/access-control.integration.test.ts`
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run test -w @autocare/server -- src/interfaces/http/__tests__/access-control.integration.test.ts src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS
2. `npm run typecheck -w @autocare/server` -> PASS

---

## Window 9 Validation Addendum

### Verdict
**PASS**

Window 9 disclosure-audit KPI baseline is implemented and validated.

### Window coverage
- AFF-02 trust transparency: enforce measurable disclosure compliance telemetry, not only request-time validation.
- AFF-03 readiness rigor: bind phase-exit disclosure criterion to persisted evidence and expose missing-evidence signal.

### Validation evidence
- Contracts:
  - `packages/shared/src/contracts/affiliate.ts`
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
  - `apps/server/ACCESS_MATRIX.md`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - `apps/server/src/interfaces/http/__tests__/access-control.integration.test.ts`

### Executed checks
1. `npm run test -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts src/interfaces/http/__tests__/access-control.integration.test.ts` -> PASS
2. `npm run typecheck -w @autocare/server` -> PASS
3. `npm run typecheck -w @autocare/shared` -> PASS

---

## Window 10 Validation Addendum

### Verdict
**PASS**

Window 10 retention-control cohort linkage baseline is implemented and validated.

### Window coverage
- AFF-03 readiness rigor: replace neutral retention placeholder with measurable affiliate-vs-control retention comparison.
- AFF-03 evidence quality: report retention comparison as missing only when cohort data is insufficient.

### Validation evidence
- Runtime:
  - `apps/server/src/modules/affiliate/interfaces/http/affiliate-routes.ts`
- Tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`
  - `apps/server/src/interfaces/http/__tests__/access-control.integration.test.ts`

### Executed checks
1. `npm run test -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts` -> PASS
2. `npm run test -w @autocare/server -- src/interfaces/http/openapi/__tests__/registry.contract.test.ts src/interfaces/http/__tests__/access-control.integration.test.ts` -> PASS
3. `npm run typecheck -w @autocare/server` -> PASS

---

## Window 11 Validation Addendum

### Verdict
**PASS**

Window 11 high-intent affiliate mobile activation is implemented and validated.

### Window coverage
- AFF-01 delivery depth: activate contextual affiliate placements in a real high-intent maintenance UI surface.
- AFF-02 delivery depth: preserve explicit disclosure rendering and consent/disclosure-aware tracking on interaction.
- AFF-03 delivery depth: ensure exposure/click/complaint signals are emitted from product surface, not only server tests.

### Validation evidence
- OpenAPI/codegen:
  - `apps/server/scripts/generate-openapi.ts`
  - `apps/server/openapi.json`
  - `apps/server/openapi/affiliate.json`
  - `packages/api-client/src/types.gen.ts`
- Client/mobile implementation:
  - `packages/api-client/src/react/hooks.ts`
  - `packages/api-client/src/query-keys.ts`
  - `packages/api-client/src/react/index.ts`
  - `apps/mobile/app/vehicle/[id]/next.tsx`

### Executed checks
1. `npm run openapi:sync` -> PASS
2. `npm run typecheck -w @autocare/api-client` -> PASS
3. `npm run typecheck -w @autocare/mobile` -> PASS

---

## Window 12 Validation Addendum

### Verdict
**PASS**

Window 12 mobile affiliate interaction behavior coverage is implemented and validated.

### Window coverage
- AFF-01/AFF-02 execution safety: high-intent affiliate interaction decisions are now deterministic and test-backed.
- AFF-03 signal integrity: click/complaint tracking payload builders are covered against regression.
- Accessibility hardening: user-facing sponsored-offer action labels are explicitly validated.

### Validation evidence
- Helpers + tests:
  - `apps/mobile/app/vehicle/[id]/affiliate-offers.ts`
  - `apps/mobile/app/vehicle/[id]/affiliate-offers.test.ts`
- Screen integration:
  - `apps/mobile/app/vehicle/[id]/next.tsx`

### Executed checks
1. `npm run test:vitest -w @autocare/mobile -- "app/vehicle/[id]/affiliate-offers.test.ts"` -> PASS
2. `npm run typecheck -w @autocare/mobile` -> PASS

---

## Window 13 Validation Addendum

### Verdict
**PASS**

Window 13 disclosure-label contract regression guard is implemented and validated.

### Window coverage
- AFF-02 trust transparency hardening: protects canonical sponsored disclosure copy from API/runtime drift.
- AFF-03 instrumentation reliability: ensures both runtime response behavior and published OpenAPI contract stay aligned for disclosure metadata.

### Validation evidence
- Integration + contract tests:
  - `apps/server/src/modules/affiliate/__tests__/affiliate-http.integration.test.ts`
  - `apps/server/src/interfaces/http/openapi/__tests__/registry.contract.test.ts`

### Executed checks
1. `npm run test:vitest -w @autocare/server -- src/modules/affiliate/__tests__/affiliate-http.integration.test.ts src/interfaces/http/openapi/__tests__/registry.contract.test.ts` -> PASS
2. `npm run typecheck -w @autocare/server` -> PASS

---

## Window 14 Validation Addendum

### Verdict
**PASS**

Window 14 api-client disclosure-label type contract guard is implemented and validated.

### Window coverage
- AFF-02 trust transparency hardening: adds client-side generated-type enforcement for canonical sponsored disclosure label.
- AFF-03 contract integrity: guards OpenAPI -> generated client type continuity for affiliate offers response shape.

### Validation evidence
- Type-contract test:
  - `packages/api-client/src/affiliate-contract.test.ts`

### Executed checks
1. `npm run test:vitest -w @autocare/api-client -- src/affiliate-contract.test.ts` -> PASS
2. `npm run typecheck -w @autocare/api-client` -> PASS

---

## Window 15 Validation Addendum

### Verdict
**PASS**

Window 15 CI disclosure-guard bundle command is implemented and validated.

### Window coverage
- AFF-02/AFF-03 operational hardening: creates a single deterministic verification entrypoint for disclosure trust-copy regressions across runtime, schema, and generated client types.
- Delivery reliability: simplifies repeatable local/CI gate execution for affiliate disclosure integrity.

### Validation evidence
- Root script:
  - `package.json` (`verify:affiliate:disclosure-guards`)

### Executed checks
1. `npm run verify:affiliate:disclosure-guards` -> PASS

