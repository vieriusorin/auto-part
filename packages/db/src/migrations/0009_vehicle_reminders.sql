CREATE TABLE IF NOT EXISTS vehicle_reminder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  organization_id text NOT NULL,
  title text NOT NULL,
  notes text,
  frequency_type text NOT NULL CHECK (frequency_type IN ('days', 'miles')),
  interval_value integer NOT NULL CHECK (interval_value > 0),
  due_at timestamptz,
  due_odometer integer CHECK (due_odometer >= 0),
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('due_now', 'upcoming', 'deferred', 'done')),
  deferred_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_reminder_vehicle_id_idx
  ON vehicle_reminder (vehicle_id, status, due_at);

CREATE INDEX IF NOT EXISTS vehicle_reminder_org_id_idx
  ON vehicle_reminder (organization_id);
