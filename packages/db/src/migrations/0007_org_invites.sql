-- Organization invites and org-scoped role on users.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
    CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'manager', 'driver', 'viewer');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_invite_role') THEN
    CREATE TYPE organization_invite_role AS ENUM ('owner', 'admin', 'manager', 'driver', 'viewer');
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS organization_role organization_role NOT NULL DEFAULT 'owner';

CREATE TABLE IF NOT EXISTS organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  email text NOT NULL,
  role organization_invite_role NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  accepted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_invites_token_hash_key ON organization_invites (token_hash);
CREATE INDEX IF NOT EXISTS organization_invites_org_idx ON organization_invites (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS organization_invites_email_idx ON organization_invites (email);
