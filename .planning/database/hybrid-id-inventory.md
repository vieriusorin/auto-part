# Hybrid ID Inventory (Pilot)

## Scope

Pilot bounded context: vehicles and directly related relational tables.

- `users`
- `vehicle`
- `maintenance_log`
- `vehicle_reminder`
- `vehicle_document`
- `vehicle_member`

## Identifier Policy

- External/public identifier: existing UUID `id` column
- Internal relational identifier: new BIGINT `id_int` column
- Internal joins in pilot: prefer `*_id_int` shadow FKs

## Table Matrix

| Table | Public ID | Internal ID | Shadow FK Columns |
| --- | --- | --- | --- |
| `users` | `id` (uuid) | `id_int` (bigint) | n/a |
| `vehicle` | `id` (uuid) | `id_int` (bigint) | n/a |
| `maintenance_log` | `id` (uuid) | `id_int` (bigint) | `vehicle_id_int` |
| `vehicle_reminder` | `id` (uuid) | `id_int` (bigint) | `vehicle_id_int` |
| `vehicle_document` | `id` (uuid) | `id_int` (bigint) | `vehicle_id_int`, `maintenance_log_id_int`, `uploaded_by_int` |
| `vehicle_member` | `id` (uuid) | `id_int` (bigint) | `vehicle_id_int`, `user_id_int`, `assigned_by_int` |

## Non-pilot Tables (unchanged in this step)

UUID-only keys remain for now:

- `refresh_tokens`
- `organization_invites`
- `subscription_cancellations`
- analytics/consent/audit/banners tables

## Notes

- We intentionally reuse existing UUID `id` columns as public IDs (instead of introducing `public_id`), minimizing API/client breakage.
- Post-pilot extension can follow the same additive pattern for auth/org and analytics domains.
