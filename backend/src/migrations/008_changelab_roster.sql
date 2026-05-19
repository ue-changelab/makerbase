-- Add student_id and citizenship to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS citizenship TEXT;

-- Historical ChangeLab roster (links students to projects/semesters)
-- Does not require changelabs to exist in the changelabs table
CREATE TABLE IF NOT EXISTS changelab_roster (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  semester    TEXT NOT NULL,
  instructor  TEXT,
  class_level TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, project_name, semester)
);

CREATE INDEX IF NOT EXISTS idx_changelab_roster_member   ON changelab_roster(member_id);
CREATE INDEX IF NOT EXISTS idx_changelab_roster_semester ON changelab_roster(semester);
CREATE INDEX IF NOT EXISTS idx_changelab_roster_project  ON changelab_roster(project_name);
