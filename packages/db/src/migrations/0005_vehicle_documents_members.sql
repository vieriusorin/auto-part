-- Vehicle media-first evidence + household/micro-fleet member assignments.

CREATE TABLE IF NOT EXISTS vehicle_document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  organization_id text NOT NULL,
  maintenance_log_id uuid REFERENCES maintenance_log(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('invoice', 'inspection', 'photo', 'insurance', 'other')),
  title text NOT NULL,
  storage_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes >= 0),
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_document_vehicle_id_idx ON vehicle_document (vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vehicle_document_org_id_idx ON vehicle_document (organization_id);

CREATE TABLE IF NOT EXISTS vehicle_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  organization_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'driver', 'viewer')),
  assigned_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, user_id)
);

CREATE INDEX IF NOT EXISTS vehicle_member_vehicle_id_idx ON vehicle_member (vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_member_org_user_idx ON vehicle_member (organization_id, user_id);
