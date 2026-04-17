# Trust + Data Model Research Notes (AutoCare)

**Scope:** integrity hashing, audit logs, lock mode, report verification, privacy redaction, offline sync conflicts
**Date:** 2026-04-16
**Confidence:** MEDIUM (high for hashing/canonicalization principles, medium for mobile plate-blur model choices)

## Current Baseline in Repo

- `packages/db/src/schema.ts` already has `maintenance_log.integrity_hash`, `maintenance_log.version`, `vehicle.is_locked`, and a basic `audit_log` table.
- `apps/mobile/src/hooks/useOfflineQueue.ts` is currently an in-memory queue (not durable, no retries, no conflict metadata).

This is a good skeleton, but trust guarantees are currently fragile.

## 1) Integrity Hashing (Tamper-Evident Records)

## Recommendation

Implement deterministic canonical payload hashing plus hash chain for trust-critical entities (`maintenance_log`, generated reports, lock events).

### Canonicalization and hash format

- Use RFC 8785 JSON Canonicalization Scheme before hashing.
- Hash algorithm: `SHA-256`.
- Store metadata fields:
  - `record_hash`
  - `prev_record_hash` (nullable for first entry)
  - `hash_algo` (`sha256`)
  - `canon_version` (`jcs-rfc8785-v1`)

### What to hash

Include immutable business fields only:

- `id`, `vehicle_id`, `date`, `odometer`, `category`, `description`, `total_cost`, `created_by`, `created_at`, `version`
- Exclude mutable operational fields (`updated_at`, sync transport metadata, local-only fields).

### Verification strategy

- On read/export/report generation, recompute and compare `record_hash`.
- Periodically verify full chains server-side and persist verification snapshots.
- Chain per `organization_id` and entity type.

### Why

- Single-entry hash catches direct mutation.
- Hash chain catches deletion and reordering.
- Canonicalization prevents false mismatch across runtimes.

## 2) Audit Logging (Forensic-Grade, Not Debug Logs)

## Recommendation

Upgrade `audit_log` to an append-only, actor-aware forensic log with immutable retention controls.

### Data model additions

- `actor_type` (`user` | `system` | `sync-worker`)
- `actor_id`
- `organization_id`
- `trace_id` or `request_id`
- `source` (`mobile-ios`, `mobile-android`, `server`)
- `occurred_at` (event time), `recorded_at` (ingestion time)
- `event_hash`, `prev_event_hash` (audit chain)
- `schema_version`

Retain existing `oldValues` and `newValues`, but redact sensitive fields before persistence.

### Write path rules

- Never update or delete audit events from application code.
- Only append.
- Put audit storage in immutable/WORM-compatible backend for retention windows.
- Log access to logs (read/export) as audit events too.

### Why

Audit logs without actor, causality, and immutability become weak evidence in disputes or compliance reviews.

## 3) Data Lock Mode (`vehicle.is_locked`)

## Recommendation

Treat lock as a policy state machine, not a boolean toggle.

### Replace with explicit lock state

- `lock_state`: `unlocked` | `pending_lock` | `locked` | `lock_override`
- `locked_at`, `locked_by`
- `lock_reason`
- `override_reason`, `override_by`, `override_expires_at`

### Enforcement

- Server-side write guard for trust-critical edits when locked.
- Client shows read-only UI, but server remains ultimate enforcement.
- Allowed post-lock actions should be explicit (example: append correction note, no destructive edits).

### Why

Boolean lock flags are easy to bypass and do not explain who locked, why, or under what override authority.

## 4) Report Verification (Shareable, Verifiable Outputs)

## Recommendation

Generate reports with signed verification envelope and public verification endpoint.

### Report envelope

- `report_id`, `org_id`, `generated_at`, `generator_version`
- `input_record_ids[]`
- `input_root_hash` (Merkle root or chain tip plus count)
- `report_payload_hash`
- `signature` (server private key)
- `key_id` for rotation

### Verification flow

- Add QR or verification URL in report (`/verify/{report_id}`).
- Endpoint returns verification status:
  - signature valid
  - source records unchanged
  - report revoked or replaced

### Why

Recipients can independently verify authenticity and detect altered PDFs or screenshots.

## 5) Privacy Redaction + Plate Blur

## Recommendation

Use privacy-by-default asset pipeline:

1. Detect sensitive regions (plate, faces, docs).
2. Apply irreversible redaction (strong blur or pixelation with minimum kernel threshold).
3. Persist redacted derivative as default user-visible asset.
4. Keep raw only in restricted storage when legally required.

### Implementation guidance

- Prefer on-device redaction before upload whenever feasible.
- Treat plate blur confidence below threshold as failed redaction and block publish.
- Persist redaction manifest:
  - `asset_id`
  - `redaction_version`
  - `detector_model`
  - `regions_redacted[]`
  - `performed_on_device` boolean

### Why

Privacy bugs are usually irreversible once media is shared. Block-on-failure is safer than best-effort blur.

## 6) Offline Sync Conflict Strategy

## Recommendation

Use hybrid strategy: optimistic local writes plus server reconciliation with per-field conflict policies.

### Replace current queue

Current in-memory queue is insufficient. Replace with persistent queue table:

- `action_id` (UUID)
- `entity_type`, `entity_id`
- `op_type` (`create` | `update` | `delete` | `lock` | `unlock`)
- `base_version`
- `client_timestamp`
- `device_id`
- `idempotency_key`
- `payload_canonical`
- `payload_hash`
- `status` (`pending` | `in_flight` | `acked` | `conflict` | `failed`)
- `retry_count`, `last_error`

### Conflict detection

- If `base_version` differs from server version, mark conflict.
- For trust-critical fields (odometer, cost, lock state): no silent last-write-wins.
- Use three-way merge for non-critical text fields.

### Conflict resolution policy

- `odometer`: monotonic max + audit note if competing edits.
- `total_cost`: manual resolution required.
- `description`: field-level merge, preserving both edits where possible.
- `lock_state`: server-authoritative, require override workflow.

### Why

Pure timestamp LWW is easy but can silently lose legally important maintenance facts.

## Priority Implementation Plan

1. **Schema hardening**
   - Add chain fields (`prev_*_hash`, algo/version metadata), richer lock state, and persistent sync queue schema.
2. **Server enforcement**
   - Add canonical-hash recomputation, lock policy guard, append-only audit write path.
3. **Verification surface**
   - Build report signature envelope plus verify endpoint and QR embedding.
4. **Privacy pipeline**
   - Add pre-upload blur/redaction gate and redaction manifest table.
5. **Conflict engine**
   - Implement per-field policy resolver plus user conflict review UI for high-risk fields.

## High-Risk Pitfalls to Avoid

1. **Hashing non-canonical JSON**
   - Causes false tamper alarms across platforms.
2. **Audit log mutability**
   - Breaks legal credibility of event history.
3. **Client-only lock enforcement**
   - Easy bypass through direct API calls.
4. **Best-effort redaction**
   - Leads to privacy leaks when detection confidence is low.
5. **Global LWW for all fields**
   - Silent corruption of critical maintenance records.
6. **Non-durable offline queue**
   - Data loss on app restart/crash and duplicate submissions.

## Suggested Ownership by Phase

- **Phase A (foundation):** canonical hashing, append-only audit schema, persistent queue.
- **Phase B (controls):** lock state machine + server enforcement, conflict engine policies.
- **Phase C (trust UX):** report verification endpoint, QR verifier, conflict resolution UI.
- **Phase D (privacy hardening):** on-device redaction pipeline and policy gates.

## Sources

- RFC 8785 JSON Canonicalization Scheme (IETF/RFC Editor):
  - https://www.rfc-editor.org/rfc/rfc8785
- Data integrity and tamper-evident audit logging guidance (industry references):
  - https://mattermost.com/blog/compliance-by-design-18-tips-to-implement-tamper-proof-audit-logs/
  - https://www.sonarsource.com/resources/library/audit-logging/
- Immutable retention and WORM-oriented operational patterns:
  - https://www.confluent.io/blog/build-real-time-compliance-audit-logging-kafka/
- Offline-first conflict strategy references:
  - https://www.ditto.com/blog/how-to-build-robust-offline-first-apps-a-technical-guide-to-conflict-resolution-with-crdts-and-ditto
  - https://dcdhameliya.com/blog/handling-data-conflicts-in-offline-first-systems
- Privacy blur context (plate/face redaction approaches):
  - https://blog.mapillary.com/update/2018/04/19/accurate-privacy-blurring-at-scale.html
  - https://www.celantur.com/blog/face-license-plate-blurring-opencv-python/
