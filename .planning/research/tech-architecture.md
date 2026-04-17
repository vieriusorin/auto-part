# Tech Architecture Feasibility - AutoCare

**Scope:** React Native Expo + Express + Drizzle + PostgreSQL + Better Auth + Cloudflare R2 + Next.js report viewer  
**Date:** 2026-04-16  
**Mode:** Feasibility / Phase 1 sequencing  
**Overall confidence:** MEDIUM-HIGH

## Feasibility Verdict

**Verdict: YES, with conditions.**

This stack is feasible and coherent for an AutoCare product with a mobile-first client and a separate web reporting surface. The major integration risk is authentication across native (Expo) and web (Next.js) clients against a single Express API while keeping session/token flows secure and simple in Phase 1.

## Validated Constraints

## 1) Expo (native) + Better Auth + Express
- Better Auth supports Express via `toNodeHandler(auth)` and requires auth routes to be mounted before `express.json()` for reliable request handling.
- Better Auth has native/Expo client support and examples with secure storage integration (`expo-secure-store`).
- Expo guidance supports secure credential/session material in `expo-secure-store` on native platforms.
- **Constraint:** avoid cookie-only assumptions for mobile; use a mobile-safe auth strategy and secure storage.

## 2) Drizzle + PostgreSQL + Better Auth
- Better Auth supports Drizzle adapter with PostgreSQL (`provider: 'pg'`).
- Drizzle supports migration-driven schema workflows (`drizzle-kit generate/migrate`) and transaction support.
- **Constraint:** auth tables and domain tables should live in one migration strategy from day one to avoid drift.

## 3) Cloudflare R2 integration
- R2 supports S3-compatible APIs and presigned URL flows for controlled uploads/downloads.
- **Constraint:** mobile client should not upload directly with long-lived credentials; backend-issued short-lived signed URLs are required.

## 4) Next.js report viewer with Express backend
- Next.js App Router supports server-side data fetching with explicit cache modes (`force-cache`, `no-store`, revalidate options).
- API access to external Express backend is straightforward via server component fetches and/or rewrites.
- **Constraint:** if auth is shared, report viewer auth/session boundary must be designed early (same auth provider, consistent token/session validation).

## Dev Complexity Assessment

| Area | Complexity | Why |
|------|------------|-----|
| Expo app foundation | Medium | Navigation/state/query setup is standard, but mobile auth storage decisions matter early |
| Express API foundation | Medium | Straightforward, but auth middleware ordering and error handling are critical |
| Drizzle + PostgreSQL | Medium | Good type safety, but migration discipline needed from first commit |
| Better Auth integration | Medium-High | Multi-client auth (native + web) adds boundary complexity |
| R2 file pipeline | Medium | Presigned upload pattern is known; object key design and ACL policy need care |
| Next.js report viewer | Medium | Simple read-only viewer is easy; secure cross-surface auth increases effort |

## Critical Path for Phase 1

Sequence below minimizes rework and validates the highest-risk assumptions first:

1. **Backend skeleton first (Express + health + typed config + error pipeline)**
   - Establish runtime conventions, request tracing, and failure handling.

2. **Database baseline (PostgreSQL + Drizzle schema + migration pipeline)**
   - Create initial auth-compatible schema setup and one domain table.
   - CI task runs migration generation/apply checks.

3. **Auth vertical slice (Better Auth on Express + Expo client sign-in)**
   - Validate real sign-up/sign-in/sign-out flow from Expo simulator/device.
   - Persist auth state with secure storage.
   - This is the highest-risk integration and should be proven before feature expansion.

4. **Protected domain endpoint + mobile consumption**
   - One authenticated business endpoint from Express consumed by Expo TanStack Query hook.
   - Confirms end-to-end auth context and API boundaries.

5. **R2 minimal upload flow**
   - Backend issues short-lived presigned upload URL.
   - Expo uploads one asset and stores metadata in PostgreSQL.

6. **Next.js report viewer bootstrap (read-only)**
   - Render one report page from Express API.
   - Keep initial auth model simple (internal/admin scope) unless Phase 1 explicitly requires shared end-user login on web.

## Recommended Initial Stack Decisions (Lock for Phase 1)

1. **Monorepo layout**
   - `apps/mobile` (Expo), `apps/api` (Express), `apps/reports` (Next.js), shared package(s) for API types/contracts.

2. **Auth approach**
   - Better Auth on Express as system of record.
   - Expo client uses Better Auth client with native-safe storage.
   - Keep auth surface minimal in Phase 1: email/password only.

3. **Data access**
   - Drizzle as only ORM, PostgreSQL as single source of truth.
   - Migration-first workflow mandatory in local/dev/CI.

4. **File storage**
   - Cloudflare R2 only via backend-signed URLs.
   - No direct client credentials, no public-write buckets.

5. **Report viewer**
   - Next.js App Router with server-side fetches to Express.
   - Start read-only and low-interactivity; defer heavy dashboarding.

6. **Operational baseline**
   - Structured logging, centralized error format, and environment validation from day one.

## Recommended Deferrals (Do Not Build in Phase 1)

- Social login providers (Google/Apple/etc.) unless contractually required.
- Multi-tenant RBAC model beyond basic roles.
- Complex background job orchestration.
- Real-time websockets.
- Offline-first conflict resolution in mobile.
- Advanced Next.js report interactivity/caching strategy beyond basic SSR fetch behavior.
- CDN/media transformation pipeline beyond raw upload + retrieval.

## Phase 1 Exit Criteria (Feasibility-Proving Milestones)

1. Expo user can authenticate against Better Auth on Express and remain signed in across app restart.
2. Protected API endpoint works with authenticated mobile requests.
3. Drizzle migrations run cleanly in local and CI against PostgreSQL.
4. Mobile can upload one file via backend-signed R2 URL; metadata persisted in DB.
5. Next.js report page can securely render backend data from Express.

## Risks and Mitigations

### Risk 1: Auth mismatch across native and web
- **Mitigation:** define one canonical session/token validation contract in API before implementing web viewer login.

### Risk 2: Migration drift between auth and domain models
- **Mitigation:** one Drizzle migration pipeline and strict review for schema changes.

### Risk 3: Insecure storage/upload shortcuts
- **Mitigation:** secure store on mobile, signed URLs only, short expiry, scoped object keys.

### Risk 4: Premature dashboard complexity
- **Mitigation:** constrain Phase 1 reports to a small, read-only slice.

## Suggested Phase 1 Implementation Sequence

Week 1:
- API skeleton, Postgres connection, Drizzle setup, first migration, health endpoint
- Better Auth server integration + Expo client authentication proof

Week 2:
- Protected domain endpoint + mobile query integration
- R2 signed upload path + metadata persistence
- Next.js report viewer bootstrap with one report route

Week 3 (buffer/hardening):
- Error handling polish, test coverage on auth/upload/report route
- Deployment pipeline stabilization

## Sources (verification basis)

- Expo docs (authentication + secure storage patterns): https://docs.expo.dev  
- Better Auth docs (Express integration, adapters, native client patterns): https://www.better-auth.com/docs  
- Drizzle ORM docs (schema, migrations, transactions): https://orm.drizzle.team/docs/overview  
- Express docs (middleware/error handling, v5 behavior): https://expressjs.com  
- Cloudflare R2 docs (S3 compatibility, presigned URLs, lifecycle): https://developers.cloudflare.com/r2/  
- Next.js docs (App Router data fetching/caching/rewrites): https://nextjs.org/docs

## Confidence Notes

- **HIGH:** Express middleware/error model, Drizzle migration/transaction model, R2 presigned URL capability, Next.js App Router fetch behavior.
- **MEDIUM-HIGH:** Better Auth + Express + Drizzle feasibility and Expo/native client support (validated via docs/examples, but exact plugin subset should be pinned during implementation).
- **MEDIUM:** Final cross-surface auth UX (Expo + Next.js shared auth model) because this depends on product-specific session semantics and deployment topology.
