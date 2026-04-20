-- Promote key categorical fields to native Postgres enums.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_document_type') THEN
    CREATE TYPE vehicle_document_type AS ENUM ('invoice', 'inspection', 'photo', 'insurance', 'other');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_member_role') THEN
    CREATE TYPE vehicle_member_role AS ENUM ('owner', 'manager', 'driver', 'viewer');
  END IF;
END $$;

ALTER TABLE users
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE user_role USING role::user_role,
  ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE vehicle_document
  DROP CONSTRAINT IF EXISTS vehicle_document_type_check,
  ALTER COLUMN type TYPE vehicle_document_type USING type::vehicle_document_type;

ALTER TABLE vehicle_member
  DROP CONSTRAINT IF EXISTS vehicle_member_role_check,
  ALTER COLUMN role TYPE vehicle_member_role USING role::vehicle_member_role;
