-- Vehicle profiles and maintenance logs (Phase 1 MVP loop).

CREATE TABLE IF NOT EXISTS vehicle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  vin text NOT NULL,
  plate text,
  euro_standard text,
  current_odometer integer NOT NULL DEFAULT 0,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  odometer integer NOT NULL,
  category text NOT NULL,
  description text,
  total_cost integer,
  integrity_hash text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  content_hash text,
  hash_algorithm text DEFAULT 'sha256',
  hash_version text DEFAULT 'v1',
  locked_at timestamptz,
  locked_by text,
  lock_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_log_vehicle_id_idx ON maintenance_log (vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_organization_id_idx ON vehicle (organization_id);
