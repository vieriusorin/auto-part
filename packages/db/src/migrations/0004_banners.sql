-- Banners bounded context: server-driven campaigns + per-user dismissals.

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  cta_label text,
  cta_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS banners_active_window_idx
  ON banners (is_active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS user_banner_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banner_key text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, banner_key)
);

CREATE INDEX IF NOT EXISTS user_banner_dismissals_user_banner_idx
  ON user_banner_dismissals (user_id, banner_key);
