-- Phase 1 auth: users + refresh_tokens.
-- Idempotent: safe to run on a database that already has prior migrations applied.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  organization_id text,
  email_verified_at timestamptz,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
CREATE INDEX IF NOT EXISTS users_organization_idx ON users (organization_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL,
  token_hash text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  replaced_by_token_id uuid,
  revoked_at timestamptz,
  revoked_reason text,
  user_agent text,
  ip_address text,
  client_kind text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_hash_key ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);

-- Optional FK from refresh_tokens.replaced_by_token_id to refresh_tokens.id
-- (skipped to avoid circular insert-time constraints; application enforces invariant).
