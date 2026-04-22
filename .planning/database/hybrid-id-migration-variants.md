# Hybrid ID Migration Variants

## Variant A: Dev Reset Fast Path

Use this for local/dev and short-lived environments.

1. Apply additive migration `0011_hybrid_ids_vehicle_pilot.sql`.
2. Recreate DB if needed (`db:down:volumes` + `db:start`).
3. Run `db:migrate`.
4. Run updated seed (`db:seed`) to populate `id_int` and `*_id_int` through normal insert paths.
5. Run typecheck/tests and validate route behavior.

### Pros

- Fast iteration
- Easy rollback (drop volumes)
- Clean baseline for new contributors

### Cons

- Destructive for existing local data
- Not production-safe as a process

---

## Variant B: Existing-Data Phased Cutover (Recommended for persistent envs)

Use this for staging/prod-like environments.

1. Add columns/sequences/indexes/constraints without removing UUID paths.
2. Backfill all `id_int` and `*_id_int` from UUID references.
3. Keep UUID APIs unchanged; start dual-write in repositories.
4. Switch internal joins to `*_id_int`.
5. Run integrity checks repeatedly until stable.
6. (Future step) remove UUID FK dependencies only after monitoring window.

### Pros

- Zero external contract breakage
- Minimal downtime risk
- Supports gradual rollout

### Cons

- More temporary schema complexity
- Requires consistency checks during transition

---

## Rollback Strategy

- Keep UUID columns and UUID-based query capability until full confidence.
- If bigint path causes issues, revert repositories to UUID join path and continue operating on legacy columns.
- Because migration is additive, emergency rollback is mostly application-level (query path), not destructive schema rollback.
