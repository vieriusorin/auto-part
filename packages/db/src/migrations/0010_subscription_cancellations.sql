CREATE TABLE IF NOT EXISTS subscription_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_cancellations_org_id_idx
  ON subscription_cancellations (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS subscription_cancellations_reason_idx
  ON subscription_cancellations (reason);
