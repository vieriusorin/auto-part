-- Hybrid ID extension for auth + banners + subscription cancellations.

-- refresh_tokens.id_int + refresh_tokens.user_id_int
CREATE SEQUENCE IF NOT EXISTS refresh_tokens_id_int_seq;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_id_int bigint;
ALTER TABLE refresh_tokens ALTER COLUMN id_int SET DEFAULT nextval('refresh_tokens_id_int_seq');
UPDATE refresh_tokens SET id_int = nextval('refresh_tokens_id_int_seq') WHERE id_int IS NULL;
UPDATE refresh_tokens rt
SET user_id_int = u.id_int
FROM users u
WHERE rt.user_id = u.id AND rt.user_id_int IS NULL;
ALTER TABLE refresh_tokens ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN user_id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_id_int_key ON refresh_tokens (id_int);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_int_idx ON refresh_tokens (user_id_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_user_id_int_fkey'
  ) THEN
    ALTER TABLE refresh_tokens
      ADD CONSTRAINT refresh_tokens_user_id_int_fkey
      FOREIGN KEY (user_id_int) REFERENCES users(id_int) ON DELETE CASCADE;
  END IF;
END $$;
SELECT setval('refresh_tokens_id_int_seq', COALESCE((SELECT MAX(id_int) FROM refresh_tokens), 1), true);

-- organization_invites.id_int + inviter/accepter int refs
CREATE SEQUENCE IF NOT EXISTS organization_invites_id_int_seq;
ALTER TABLE organization_invites ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE organization_invites ADD COLUMN IF NOT EXISTS invited_by_int bigint;
ALTER TABLE organization_invites ADD COLUMN IF NOT EXISTS accepted_by_int bigint;
ALTER TABLE organization_invites ALTER COLUMN id_int SET DEFAULT nextval('organization_invites_id_int_seq');
UPDATE organization_invites SET id_int = nextval('organization_invites_id_int_seq') WHERE id_int IS NULL;
UPDATE organization_invites oi
SET invited_by_int = u.id_int
FROM users u
WHERE oi.invited_by = u.id AND oi.invited_by_int IS NULL;
UPDATE organization_invites oi
SET accepted_by_int = u.id_int
FROM users u
WHERE oi.accepted_by = u.id AND oi.accepted_by_int IS NULL;
ALTER TABLE organization_invites ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE organization_invites ALTER COLUMN invited_by_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organization_invites_id_int_key ON organization_invites (id_int);
CREATE INDEX IF NOT EXISTS organization_invites_invited_by_int_idx ON organization_invites (invited_by_int);
CREATE INDEX IF NOT EXISTS organization_invites_accepted_by_int_idx ON organization_invites (accepted_by_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_invites_invited_by_int_fkey'
  ) THEN
    ALTER TABLE organization_invites
      ADD CONSTRAINT organization_invites_invited_by_int_fkey
      FOREIGN KEY (invited_by_int) REFERENCES users(id_int) ON DELETE RESTRICT;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_invites_accepted_by_int_fkey'
  ) THEN
    ALTER TABLE organization_invites
      ADD CONSTRAINT organization_invites_accepted_by_int_fkey
      FOREIGN KEY (accepted_by_int) REFERENCES users(id_int) ON DELETE SET NULL;
  END IF;
END $$;
SELECT setval('organization_invites_id_int_seq', COALESCE((SELECT MAX(id_int) FROM organization_invites), 1), true);

-- subscription_cancellations.id_int + user_id_int
CREATE SEQUENCE IF NOT EXISTS subscription_cancellations_id_int_seq;
ALTER TABLE subscription_cancellations ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE subscription_cancellations ADD COLUMN IF NOT EXISTS user_id_int bigint;
ALTER TABLE subscription_cancellations ALTER COLUMN id_int SET DEFAULT nextval('subscription_cancellations_id_int_seq');
UPDATE subscription_cancellations
SET id_int = nextval('subscription_cancellations_id_int_seq')
WHERE id_int IS NULL;
UPDATE subscription_cancellations sc
SET user_id_int = u.id_int
FROM users u
WHERE sc.user_id = u.id AND sc.user_id_int IS NULL;
ALTER TABLE subscription_cancellations ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE subscription_cancellations ALTER COLUMN user_id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscription_cancellations_id_int_key ON subscription_cancellations (id_int);
CREATE INDEX IF NOT EXISTS subscription_cancellations_user_id_int_idx ON subscription_cancellations (user_id_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_cancellations_user_id_int_fkey'
  ) THEN
    ALTER TABLE subscription_cancellations
      ADD CONSTRAINT subscription_cancellations_user_id_int_fkey
      FOREIGN KEY (user_id_int) REFERENCES users(id_int) ON DELETE CASCADE;
  END IF;
END $$;
SELECT setval(
  'subscription_cancellations_id_int_seq',
  COALESCE((SELECT MAX(id_int) FROM subscription_cancellations), 1),
  true
);

-- banners.id_int
CREATE SEQUENCE IF NOT EXISTS banners_id_int_seq;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE banners ALTER COLUMN id_int SET DEFAULT nextval('banners_id_int_seq');
UPDATE banners SET id_int = nextval('banners_id_int_seq') WHERE id_int IS NULL;
ALTER TABLE banners ALTER COLUMN id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS banners_id_int_key ON banners (id_int);
SELECT setval('banners_id_int_seq', COALESCE((SELECT MAX(id_int) FROM banners), 1), true);

-- user_banner_dismissals.id_int + user/banner int refs
CREATE SEQUENCE IF NOT EXISTS user_banner_dismissals_id_int_seq;
ALTER TABLE user_banner_dismissals ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE user_banner_dismissals ADD COLUMN IF NOT EXISTS user_id_int bigint;
ALTER TABLE user_banner_dismissals ADD COLUMN IF NOT EXISTS banner_id_int bigint;
ALTER TABLE user_banner_dismissals ALTER COLUMN id_int SET DEFAULT nextval('user_banner_dismissals_id_int_seq');
UPDATE user_banner_dismissals
SET id_int = nextval('user_banner_dismissals_id_int_seq')
WHERE id_int IS NULL;
UPDATE user_banner_dismissals ubd
SET user_id_int = u.id_int
FROM users u
WHERE ubd.user_id = u.id AND ubd.user_id_int IS NULL;
UPDATE user_banner_dismissals ubd
SET banner_id_int = b.id_int
FROM banners b
WHERE ubd.banner_key = b.key AND ubd.banner_id_int IS NULL;
ALTER TABLE user_banner_dismissals ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE user_banner_dismissals ALTER COLUMN user_id_int SET NOT NULL;
ALTER TABLE user_banner_dismissals ALTER COLUMN banner_id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_banner_dismissals_id_int_key ON user_banner_dismissals (id_int);
CREATE INDEX IF NOT EXISTS user_banner_dismissals_user_banner_int_idx
  ON user_banner_dismissals (user_id_int, banner_id_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_banner_dismissals_user_id_int_fkey'
  ) THEN
    ALTER TABLE user_banner_dismissals
      ADD CONSTRAINT user_banner_dismissals_user_id_int_fkey
      FOREIGN KEY (user_id_int) REFERENCES users(id_int) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_banner_dismissals_banner_id_int_fkey'
  ) THEN
    ALTER TABLE user_banner_dismissals
      ADD CONSTRAINT user_banner_dismissals_banner_id_int_fkey
      FOREIGN KEY (banner_id_int) REFERENCES banners(id_int) ON DELETE CASCADE;
  END IF;
END $$;
SELECT setval(
  'user_banner_dismissals_id_int_seq',
  COALESCE((SELECT MAX(id_int) FROM user_banner_dismissals), 1),
  true
);
