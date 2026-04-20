-- Subscription plan support: org default + per-user override.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
    CREATE TYPE plan_tier AS ENUM ('free', 'premium');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS organization_plans (
  organization_id text PRIMARY KEY,
  plan plan_tier NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_plans_plan_idx ON organization_plans (plan);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_override plan_tier;

INSERT INTO organization_plans (organization_id, plan)
SELECT DISTINCT organization_id, 'free'::plan_tier
FROM users
WHERE organization_id IS NOT NULL
ON CONFLICT (organization_id) DO NOTHING;
