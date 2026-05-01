CREATE TABLE IF NOT EXISTS changelabs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL, title TEXT NOT NULL, semester TEXT NOT NULL,
  faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  student_lead TEXT, partner_id TEXT, brief TEXT, meets TEXT, location TEXT,
  capacity INTEGER NOT NULL DEFAULT 12, enrolled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','in_progress','completed','cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  impact TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='changelabs_updated_at') THEN
    CREATE TRIGGER changelabs_updated_at BEFORE UPDATE ON changelabs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END; $$;
CREATE TABLE IF NOT EXISTS changelab_milestones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  changelab_id TEXT NOT NULL REFERENCES changelabs(id) ON DELETE CASCADE,
  due_date DATE NOT NULL, title TEXT NOT NULL, done BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS changelab_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  changelab_id TEXT NOT NULL REFERENCES changelabs(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (changelab_id, member_id)
);
CREATE TABLE IF NOT EXISTS changelab_disciplines (
  changelab_id TEXT NOT NULL REFERENCES changelabs(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL, PRIMARY KEY (changelab_id, discipline)
);
CREATE TABLE IF NOT EXISTS changelab_artifacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  changelab_id TEXT NOT NULL REFERENCES changelabs(id) ON DELETE CASCADE,
  filename TEXT NOT NULL, url TEXT,
  kind TEXT NOT NULL DEFAULT 'document' CHECK (kind IN ('document','image','spreadsheet','archive','other')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cert_changelab_requirements (
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  changelab_id TEXT NOT NULL REFERENCES changelabs(id) ON DELETE CASCADE,
  PRIMARY KEY (cert_id, changelab_id)
);
