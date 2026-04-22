-- Hybrid ID pilot (vehicle bounded context):
-- keep UUID id columns as public IDs, add BIGINT internal IDs + shadow FK columns.

-- users.id_int (needed for vehicle_member/vehicle_document shadow refs)
CREATE SEQUENCE IF NOT EXISTS users_id_int_seq;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE users ALTER COLUMN id_int SET DEFAULT nextval('users_id_int_seq');
UPDATE users SET id_int = nextval('users_id_int_seq') WHERE id_int IS NULL;
ALTER TABLE users ALTER COLUMN id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_id_int_key ON users (id_int);
SELECT setval('users_id_int_seq', COALESCE((SELECT MAX(id_int) FROM users), 1), true);

-- vehicle.id_int
CREATE SEQUENCE IF NOT EXISTS vehicle_id_int_seq;
ALTER TABLE vehicle ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE vehicle ALTER COLUMN id_int SET DEFAULT nextval('vehicle_id_int_seq');
UPDATE vehicle SET id_int = nextval('vehicle_id_int_seq') WHERE id_int IS NULL;
ALTER TABLE vehicle ALTER COLUMN id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_id_int_key ON vehicle (id_int);
SELECT setval('vehicle_id_int_seq', COALESCE((SELECT MAX(id_int) FROM vehicle), 1), true);

-- maintenance_log.id_int + maintenance_log.vehicle_id_int
CREATE SEQUENCE IF NOT EXISTS maintenance_log_id_int_seq;
ALTER TABLE maintenance_log ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE maintenance_log ADD COLUMN IF NOT EXISTS vehicle_id_int bigint;
ALTER TABLE maintenance_log ALTER COLUMN id_int SET DEFAULT nextval('maintenance_log_id_int_seq');
UPDATE maintenance_log SET id_int = nextval('maintenance_log_id_int_seq') WHERE id_int IS NULL;
UPDATE maintenance_log ml
SET vehicle_id_int = v.id_int
FROM vehicle v
WHERE ml.vehicle_id = v.id AND ml.vehicle_id_int IS NULL;
ALTER TABLE maintenance_log ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE maintenance_log ALTER COLUMN vehicle_id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS maintenance_log_id_int_key ON maintenance_log (id_int);
CREATE INDEX IF NOT EXISTS maintenance_log_vehicle_id_int_idx ON maintenance_log (vehicle_id_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_log_vehicle_id_int_fkey'
  ) THEN
    ALTER TABLE maintenance_log
      ADD CONSTRAINT maintenance_log_vehicle_id_int_fkey
      FOREIGN KEY (vehicle_id_int) REFERENCES vehicle(id_int) ON DELETE CASCADE;
  END IF;
END $$;
SELECT setval('maintenance_log_id_int_seq', COALESCE((SELECT MAX(id_int) FROM maintenance_log), 1), true);

-- vehicle_reminder.id_int + vehicle_reminder.vehicle_id_int
CREATE SEQUENCE IF NOT EXISTS vehicle_reminder_id_int_seq;
ALTER TABLE vehicle_reminder ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE vehicle_reminder ADD COLUMN IF NOT EXISTS vehicle_id_int bigint;
ALTER TABLE vehicle_reminder ALTER COLUMN id_int SET DEFAULT nextval('vehicle_reminder_id_int_seq');
UPDATE vehicle_reminder SET id_int = nextval('vehicle_reminder_id_int_seq') WHERE id_int IS NULL;
UPDATE vehicle_reminder vr
SET vehicle_id_int = v.id_int
FROM vehicle v
WHERE vr.vehicle_id = v.id AND vr.vehicle_id_int IS NULL;
ALTER TABLE vehicle_reminder ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE vehicle_reminder ALTER COLUMN vehicle_id_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_reminder_id_int_key ON vehicle_reminder (id_int);
CREATE INDEX IF NOT EXISTS vehicle_reminder_vehicle_id_int_idx ON vehicle_reminder (vehicle_id_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_reminder_vehicle_id_int_fkey'
  ) THEN
    ALTER TABLE vehicle_reminder
      ADD CONSTRAINT vehicle_reminder_vehicle_id_int_fkey
      FOREIGN KEY (vehicle_id_int) REFERENCES vehicle(id_int) ON DELETE CASCADE;
  END IF;
END $$;
SELECT setval('vehicle_reminder_id_int_seq', COALESCE((SELECT MAX(id_int) FROM vehicle_reminder), 1), true);

-- vehicle_document.id_int + shadow refs
CREATE SEQUENCE IF NOT EXISTS vehicle_document_id_int_seq;
ALTER TABLE vehicle_document ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE vehicle_document ADD COLUMN IF NOT EXISTS vehicle_id_int bigint;
ALTER TABLE vehicle_document ADD COLUMN IF NOT EXISTS maintenance_log_id_int bigint;
ALTER TABLE vehicle_document ADD COLUMN IF NOT EXISTS uploaded_by_int bigint;
ALTER TABLE vehicle_document ALTER COLUMN id_int SET DEFAULT nextval('vehicle_document_id_int_seq');
UPDATE vehicle_document SET id_int = nextval('vehicle_document_id_int_seq') WHERE id_int IS NULL;
UPDATE vehicle_document vd
SET vehicle_id_int = v.id_int
FROM vehicle v
WHERE vd.vehicle_id = v.id AND vd.vehicle_id_int IS NULL;
UPDATE vehicle_document vd
SET maintenance_log_id_int = ml.id_int
FROM maintenance_log ml
WHERE vd.maintenance_log_id = ml.id AND vd.maintenance_log_id_int IS NULL;
UPDATE vehicle_document vd
SET uploaded_by_int = u.id_int
FROM users u
WHERE vd.uploaded_by = u.id AND vd.uploaded_by_int IS NULL;
ALTER TABLE vehicle_document ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE vehicle_document ALTER COLUMN vehicle_id_int SET NOT NULL;
ALTER TABLE vehicle_document ALTER COLUMN uploaded_by_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_document_id_int_key ON vehicle_document (id_int);
CREATE INDEX IF NOT EXISTS vehicle_document_vehicle_id_int_idx ON vehicle_document (vehicle_id_int);
CREATE INDEX IF NOT EXISTS vehicle_document_maintenance_log_id_int_idx ON vehicle_document (maintenance_log_id_int);
CREATE INDEX IF NOT EXISTS vehicle_document_uploaded_by_int_idx ON vehicle_document (uploaded_by_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_document_vehicle_id_int_fkey'
  ) THEN
    ALTER TABLE vehicle_document
      ADD CONSTRAINT vehicle_document_vehicle_id_int_fkey
      FOREIGN KEY (vehicle_id_int) REFERENCES vehicle(id_int) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_document_maintenance_log_id_int_fkey'
  ) THEN
    ALTER TABLE vehicle_document
      ADD CONSTRAINT vehicle_document_maintenance_log_id_int_fkey
      FOREIGN KEY (maintenance_log_id_int) REFERENCES maintenance_log(id_int) ON DELETE SET NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_document_uploaded_by_int_fkey'
  ) THEN
    ALTER TABLE vehicle_document
      ADD CONSTRAINT vehicle_document_uploaded_by_int_fkey
      FOREIGN KEY (uploaded_by_int) REFERENCES users(id_int) ON DELETE RESTRICT;
  END IF;
END $$;
SELECT setval('vehicle_document_id_int_seq', COALESCE((SELECT MAX(id_int) FROM vehicle_document), 1), true);

-- vehicle_member.id_int + shadow refs
CREATE SEQUENCE IF NOT EXISTS vehicle_member_id_int_seq;
ALTER TABLE vehicle_member ADD COLUMN IF NOT EXISTS id_int bigint;
ALTER TABLE vehicle_member ADD COLUMN IF NOT EXISTS vehicle_id_int bigint;
ALTER TABLE vehicle_member ADD COLUMN IF NOT EXISTS user_id_int bigint;
ALTER TABLE vehicle_member ADD COLUMN IF NOT EXISTS assigned_by_int bigint;
ALTER TABLE vehicle_member ALTER COLUMN id_int SET DEFAULT nextval('vehicle_member_id_int_seq');
UPDATE vehicle_member SET id_int = nextval('vehicle_member_id_int_seq') WHERE id_int IS NULL;
UPDATE vehicle_member vm
SET vehicle_id_int = v.id_int
FROM vehicle v
WHERE vm.vehicle_id = v.id AND vm.vehicle_id_int IS NULL;
UPDATE vehicle_member vm
SET user_id_int = u.id_int
FROM users u
WHERE vm.user_id = u.id AND vm.user_id_int IS NULL;
UPDATE vehicle_member vm
SET assigned_by_int = u.id_int
FROM users u
WHERE vm.assigned_by = u.id AND vm.assigned_by_int IS NULL;
ALTER TABLE vehicle_member ALTER COLUMN id_int SET NOT NULL;
ALTER TABLE vehicle_member ALTER COLUMN vehicle_id_int SET NOT NULL;
ALTER TABLE vehicle_member ALTER COLUMN user_id_int SET NOT NULL;
ALTER TABLE vehicle_member ALTER COLUMN assigned_by_int SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_member_id_int_key ON vehicle_member (id_int);
CREATE INDEX IF NOT EXISTS vehicle_member_vehicle_id_int_idx ON vehicle_member (vehicle_id_int);
CREATE INDEX IF NOT EXISTS vehicle_member_user_id_int_idx ON vehicle_member (user_id_int);
CREATE INDEX IF NOT EXISTS vehicle_member_assigned_by_int_idx ON vehicle_member (assigned_by_int);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_member_vehicle_id_int_fkey'
  ) THEN
    ALTER TABLE vehicle_member
      ADD CONSTRAINT vehicle_member_vehicle_id_int_fkey
      FOREIGN KEY (vehicle_id_int) REFERENCES vehicle(id_int) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_member_user_id_int_fkey'
  ) THEN
    ALTER TABLE vehicle_member
      ADD CONSTRAINT vehicle_member_user_id_int_fkey
      FOREIGN KEY (user_id_int) REFERENCES users(id_int) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_member_assigned_by_int_fkey'
  ) THEN
    ALTER TABLE vehicle_member
      ADD CONSTRAINT vehicle_member_assigned_by_int_fkey
      FOREIGN KEY (assigned_by_int) REFERENCES users(id_int) ON DELETE RESTRICT;
  END IF;
END $$;
SELECT setval('vehicle_member_id_int_seq', COALESCE((SELECT MAX(id_int) FROM vehicle_member), 1), true);
