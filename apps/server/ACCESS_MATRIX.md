# Server Access Matrix

This file documents the current access-control behavior for server endpoints.

## Policy Defaults

- `/api/*` requires authentication by default.
- Authorization is enforced through:
  - role permissions (`requirePermission`)
  - plan entitlements (`requirePlan`)
  - module/domain checks (for example org invite ownership rules)
- Plan precedence: `user plan override` > `organization plan`.

## Route Matrix

### Core

- `GET /api/users/:id/weekly-summary` -> `auth` + free
- `POST /api/sync` -> `auth` + free

### Analytics

- `POST /api/v1/events/batch` -> `auth` + free
- `GET /api/v1/analytics/dashboard` -> `auth` + `admin.analytics.read` + `premium`

### Trust / Consent

- `POST /api/v1/consent` -> `auth` + free
- `POST /api/v1/consent/revoke` -> `auth` + free
- `POST /api/v1/consent/export` -> `auth` + free
- `POST /api/v1/consent/delete` -> `auth` + free

### AI

- `POST /api/ai/parse-service-report` -> `auth` + `premium`
- `POST /api/ai/scan-receipt` -> `auth` + `premium`
- `POST /api/ai/fair-price` -> `auth` + `premium`

### Reports

- `POST /api/reports/generate` -> `auth` + `reports.read` + `premium`
- `GET /api/v1/kpis/spend` -> `auth` + `reports.read` + `premium`

### Audit

- `GET /api/audit-logs` -> `auth` + `audit.read.all`

### Banners

- `GET /api/banners` -> `auth` + free
- `POST /api/banners/:bannerKey/dismiss` -> `auth` + free

### Utility

- `GET /api/wash/suggestion` -> `auth` + free
- `GET /api/lez/check` -> `auth` + free
- `GET /api/parts/tires/recommendations` -> `auth` + free

### Vehicles

- `GET /api/vehicles` -> `auth` + `vehicles.read` + org context
- `GET /api/vehicles/:id` -> `auth` + `vehicles.read` + org context
- `POST /api/vehicles` -> `auth` + `vehicles.create` + org context
- `PUT /api/vehicles/:id` -> `auth` + `vehicles.update` + org context
- `POST /api/vehicles/:id/lock` -> `auth` + `vehicles.update` + org context
- `GET /api/vehicles/:id/maintenance` -> `auth` + `logs.read` + org context
- `POST /api/vehicles/:id/maintenance` -> `auth` + `logs.create` + org context
- `PUT /api/vehicles/:id/maintenance/:maintenanceId` -> `auth` + `logs.update` + org context + trust policy
- `GET /api/vehicles/:id/documents` -> `auth` + `vehicles.read` + org context
- `POST /api/vehicles/:id/documents` -> `auth` + `logs.create` + org context
- `GET /api/vehicles/:id/members` -> `auth` + `vehicles.read` + org context
- `PUT /api/vehicles/:id/members` -> `auth` + `admin.users.manage` + org context
- `GET /api/vehicles/:id/fuel` -> `auth` + `vehicles.read` + org context
- `POST /api/vehicles/scan-document` -> `auth` + `vehicles.create` + org context + `premium`
- `POST /api/upload` -> `auth`

### Organizations / Invites (under `/api`)

- `POST /api/organizations/:orgId/invites` -> `auth` + org invite use-case authorization
- `POST /api/organizations/:orgId/invites/:inviteId/resend` -> `auth` + org invite use-case authorization
- `GET /api/organizations/:orgId/invites` -> `auth` + org invite use-case authorization
- `POST /api/organizations/:orgId/invites/:inviteId/revoke` -> `auth` + org invite use-case authorization

## Public Endpoints (Intentional Exceptions)

- `GET /health`
- Docs endpoints:
  - `GET /docs`
  - `GET /docs/`
  - `GET /docs.json`
  - `GET /api/docs`
  - `GET /api/docs/`
  - `GET /api/docs.json`
  - `GET /api/openapi.json`
- Auth flow endpoints under `/auth` that remain public by design:
  - register/login/refresh
  - social start/exchange
  - invite preview
  - invite acceptance flows
