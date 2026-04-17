CREATE TABLE IF NOT EXISTS analytics_events_raw (
  id uuid PRIMARY KEY,
  event_id text NOT NULL,
  event_name text NOT NULL,
  occurred_at_client timestamptz NOT NULL,
  received_at_server timestamptz NOT NULL,
  user_id text,
  session_id text NOT NULL,
  device_id text NOT NULL,
  platform text NOT NULL,
  country text NOT NULL,
  channel text NOT NULL,
  app_version text NOT NULL,
  schema_version integer NOT NULL,
  integrity_valid integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_daily_rollups (
  id uuid PRIMARY KEY,
  date text NOT NULL,
  country text NOT NULL,
  platform text NOT NULL,
  channel text NOT NULL,
  activation_count integer NOT NULL DEFAULT 0,
  d1_retained integer NOT NULL DEFAULT 0,
  d7_retained integer NOT NULL DEFAULT 0,
  d30_retained integer NOT NULL DEFAULT 0,
  wau integer NOT NULL DEFAULT 0,
  mau integer NOT NULL DEFAULT 0,
  maintenance_actions_completed integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_user_cohorts (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  signup_date text NOT NULL,
  country text NOT NULL,
  platform text NOT NULL,
  channel text NOT NULL
);

CREATE TABLE IF NOT EXISTS consent_ledger (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  consent_type text NOT NULL,
  status text NOT NULL,
  legal_basis text NOT NULL,
  policy_version text NOT NULL,
  capture_source text NOT NULL,
  request_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL,
  actor_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  reason_code text,
  source text NOT NULL,
  request_id text NOT NULL,
  metadata_json jsonb
);
