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

## DB Recovery And Phase 0 Bootstrap

- `npm run db:start` -> start Postgres container only
- `npm run db:stop` -> stop Postgres container only
- `npm run db:down` -> stop and remove compose services
- `npm run db:down:volumes` -> stop/remove services and wipe DB volume
- `npm run db:migrate` -> apply SQL migrations from `packages/db/src/migrations`
- `npm run db:reset:phase0` -> truncate Phase 0 tables
- `npm run db:seed:phase0` -> seed minimum Phase 0 analytics/trust evidence
- `npm run db:bootstrap:phase0` -> migrate + reset + seed
- `npm run phase0:verify:local` -> run integrity gate and full Phase 0 gate
- `npm run db:from-scratch:phase0` -> full rebuild path (wipe DB, start, migrate, seed, verify)

All DB commands require `DATABASE_URL` in environment (for example from `.env`).
