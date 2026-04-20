# AutoCare

AI-powered car ownership manager with a trust-first architecture.

## Workspace

- `apps/mobile`: Expo app
- `apps/server`: Express API
- `apps/web`: Next.js public viewer
- `packages/db`: Drizzle schema
- `packages/shared`: Shared Zod schemas
- `packages/auth`: Role + permission helpers

## Quick Start

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   - `npm install`
3. Start local infrastructure:
   - `docker compose up -d postgres`
4. Run apps:
   - API: `npm run dev -w @autocare/server`
   - Web: `npm run dev -w @autocare/web`
   - Mobile: `npm run dev -w @autocare/mobile`

## DB Recovery And Bootstrap

- `npm run db:start` -> start Postgres container only
- `npm run db:stop` -> stop Postgres container only
- `npm run db:down` -> stop and remove compose services
- `npm run db:down:volumes` -> stop/remove services and wipe DB volume
- `npm run db:migrate` -> apply SQL migrations from `packages/db/src/migrations`
- `npm run db:reset` -> truncate seeded runtime tables
- `npm run db:seed` -> seed deterministic baseline data (expanded each phase)
- `npm run db:bootstrap` -> migrate + reset + seed
- `npm run phase0:verify:local` -> run integrity gate and full Phase 0 gate
- `npm run db:from-scratch` -> full rebuild path (wipe DB, start, migrate, seed, verify)

All DB commands require `DATABASE_URL` in environment (for example from `.env`).

## Access Control Model

- `/api/*` routes require authentication by default.
- Authorization combines:
  - **Role permissions** (`user`, `admin`) for action scope.
  - **Plan entitlements** (`free`, `premium`) for feature gating.
- Plan precedence:
  - user plan override (if set) takes priority;
  - otherwise organization default plan is used.
- Public unauthenticated routes are explicit under `/auth` only (for example register/login/invite preview).

## Spend KPI Definitions

- `GET /api/v1/kpis/spend` returns org-scoped spend analytics for a filtered date range.
- Required query fields: `from`, `to`; optional filters: `granularity`, `vehicleIds`, `categories`.
- KPI formulas:
  - `totalSpend` = sum of maintenance `totalCost` in the selected range.
  - `trendDeltaPercent` = ((current window spend - previous window spend) / previous window spend) * 100.
  - `forecastNextPeriodSpend` = arithmetic mean of spend across current period buckets.
  - `anomalies` = buckets above `mean * 1.6` threshold for the filtered window.
