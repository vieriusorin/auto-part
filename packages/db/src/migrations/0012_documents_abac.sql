CREATE TYPE IF NOT EXISTS document_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  status document_status NOT NULL DEFAULT 'draft',
  is_locked boolean NOT NULL DEFAULT false,
  creator_id uuid NOT NULL,
  last_edited_by_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_creator_id_idx ON document (creator_id);
CREATE INDEX IF NOT EXISTS document_status_idx ON document (status);
