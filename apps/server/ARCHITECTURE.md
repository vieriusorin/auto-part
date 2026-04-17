# Server architecture blueprint (DDD + clean layers)

This document maps current `apps/server/src` files into a scalable DDD structure inspired by your `hr-profiller` backend style, adapted to Autocare's current codebase.

## Goals

- Keep domain logic framework-free.
- Move route/controller logic out of central `routes/index.ts`.
- Separate transport, application orchestration, and infrastructure adapters.
- Keep migration incremental with no big-bang rewrite.

## Target folder layout

```text
db/
  schema/
  index.ts
migrations/
docs/
  openapi/
scripts/
src/
  bootstrap/
    app.ts
    server.ts
    openapi.ts
  config/
    load-env.ts
  shared/
    errors/
    types/
    observability/
  modules/
    analytics/
      domain/
        entities/
        value-objects/
        services/
        ports/
      application/
        use-cases/
        dto/
      infrastructure/
        persistence/
        mappers/
      interfaces/
        http/
          analytics-routes.ts
          analytics-controller.ts
          analytics-validation.ts
      __tests__/
    trust/
      domain/
      application/
      infrastructure/
      interfaces/
        http/
      __tests__/
    system/
      domain/
      application/
      interfaces/
        http/
  infrastructure/
    di/
      container.ts
      tokens.ts
      modules/
    database/
      drizzle/
        schema/
        repositories/
        client.ts
        migrator.ts
    http/
      middleware/
        security.ts
        permission.ts
        error-handler.ts
  jobs/
    index.ts
```

## Dependency rule (must stay strict)

- `interfaces` -> `application` -> `domain`
- `infrastructure` implements `domain/application` ports
- `domain` imports nothing from `express`, `drizzle`, `pg`, `zod`, `inversify`

## Current -> target mapping

- `src/index.ts` -> split into:
  - `src/bootstrap/server.ts` (listen + startup logs + open browser)
  - `src/bootstrap/app.ts` (express app/middleware/routes registration)
  - `src/bootstrap/openapi.ts` (swagger mounting and spec endpoints)

- `src/routes/index.ts` -> split into:
  - `src/modules/*/interfaces/http/*-routes.ts` per bounded context
  - `src/modules/*/interfaces/http/*-controller.ts`
  - `src/modules/*/interfaces/http/*-validation.ts`

- `src/routes/auth.ts` -> `src/modules/auth/interfaces/http/auth-routes.ts`

- `src/middleware/security.ts` -> `src/infrastructure/http/middleware/security.ts`
- `src/middleware/permission.ts` -> `src/infrastructure/http/middleware/permission.ts`

- `src/docs/openapi.ts` -> `src/bootstrap/openapi.ts` (or `src/interfaces/http/openapi.ts`)
- Add generated/static specs under `docs/openapi/` for external consumers and CI publishing.

- `src/application/system/get-health-use-case.ts` -> keep, move under:
  - `src/modules/system/application/use-cases/get-health.ts`

- `src/domain/system/health.ts` -> keep, move under:
  - `src/modules/system/domain/entities/health.ts`

- `src/modules/analytics/controller.ts` -> 
  - `src/modules/analytics/interfaces/http/analytics-controller.ts`

- `src/modules/analytics/service.ts` ->
  - use-case files in `src/modules/analytics/application/use-cases/`
  - example:
    - `ingest-analytics-events.ts`
    - `get-analytics-dashboard.ts`

- `src/modules/analytics/repository.ts` ->
  - `src/modules/analytics/domain/ports/analytics-repository-port.ts` (interface only)
  - `src/modules/analytics/infrastructure/persistence/drizzle-analytics-repository.ts` (implementation)
  - table schema definitions move to `infrastructure/persistence/schema.ts`

- `src/modules/analytics/rollups.ts` ->
  - `src/modules/analytics/domain/services/rollup-service.ts`

- `src/modules/analytics/schemas.ts` ->
  - request validation bits to `interfaces/http/analytics-validation.ts`
  - canonical domain types to `domain/value-objects/`

- `src/modules/trust/consent-controller.ts` ->
  - `src/modules/trust/interfaces/http/consent-controller.ts`

- `src/modules/trust/consent-service.ts` ->
  - split into:
    - `domain/ports/consent-repository-port.ts`
    - `application/use-cases/create-consent.ts`
    - `application/use-cases/revoke-consent.ts`
    - `infrastructure/persistence/drizzle-consent-repository.ts`

- `src/modules/trust/policy-middleware.ts` ->
  - stay transport-layer middleware in `interfaces/http` or shared HTTP middleware in `infrastructure/http/middleware`

- `src/services/auditLog.ts` ->
  - if business-level: `modules/trust/domain/services/audit-log-service.ts`
  - if adapter-level: `modules/trust/infrastructure/audit/*`

- `src/services/integrity.ts` ->
  - `src/modules/maintenance/domain/services/integrity-hash-service.ts`

- `src/services/weather.ts` -> `src/modules/wash/application/use-cases/get-wash-suggestion.ts`
- `src/services/priceComparison.ts` -> `src/modules/pricing/application/use-cases/compare-maintenance-price.ts`
- `src/services/weeklySummary.ts` -> `src/modules/summary/application/use-cases/build-weekly-summary.ts`

- `src/jobs/index.ts` ->
  - keep as `jobs` entry, but call application use-cases instead of infra directly

- `src/infrastructure/di/container.ts`, `tokens.ts` ->
  - keep and expand with per-module bindings in `src/infrastructure/di/modules/*`

- Missing today in `apps/server` (compared to `hr-profiller` style):
  - `db/` root with centralized DB client/bootstrap
  - `migrations/` root for generated SQL artifacts
  - `drizzle.config.ts` colocated with backend app
  - `docs/` root for API and architecture artifacts
  - `infrastructure/database/drizzle/*` split (schema vs repositories vs client)

## What is currently wrong (architecturally)

- `routes/index.ts` is a God file mixing many domains and concerns.
- `modules/*/service.ts` mixes application and domain rules.
- `repository.ts` files currently carry both port contract and implementation.
- DB schema/persistence details live too close to business logic.
- Route handlers do inline business work (for maintenance, AI fair price) instead of use-cases.
- Error handling is per-controller `try/catch` with inconsistent response shape.

## Incremental migration plan

### Phase 1 (safe extraction, no behavior change)

- Create `bootstrap/app.ts` and move middleware + route mounting from `index.ts`.
- Create module route files (`analytics-routes.ts`, `trust-routes.ts`, etc.) and reduce `routes/index.ts`.
- Add shared `error-handler.ts` middleware and `AppError` base type.

### Phase 2 (application/domain split)

- For analytics and trust first:
  - introduce explicit `ports` interfaces
  - move orchestration logic into `application/use-cases`
  - keep existing Drizzle code but behind infrastructure adapters

### Phase 3 (infrastructure hardening)

- Move all table definitions and DB-specific mapping into infra persistence files.
- Add transaction boundary helper in infrastructure DB layer.
- Add unit tests for domain services and integration tests for adapters.
- Introduce `drizzle.config.ts` + app-local `migrations/` workflow (or keep monorepo root strategy, but choose one explicitly).

### Phase 4 (DI maturity)

- Expand Inversify registrations module by module.
- Controllers depend on use-case interfaces (ports), not concrete classes.
- Add architecture checks (import rules) to prevent forbidden cross-layer imports.

## Coding standards for this architecture

- Domain and application use `type`, no `interface` unless externally required.
- No `any`.
- Arrow functions for React components (frontend rule remains unaffected here).
- Single quotes for strings.
- Validation in HTTP layer; business invariants in domain/application layer.

## Reference inspiration

- Your reference backend structure: [hr-profiller/backend](https://github.com/vieriusorin/hr-profiller/tree/main/backend)
