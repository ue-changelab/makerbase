-- Semester milestone templates: shared checkpoints per semester applied to all labs
CREATE TABLE IF NOT EXISTS semester_milestones (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  semester    TEXT NOT NULL REFERENCES semesters(code) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  due_date    DATE NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_semester_milestones_sem ON semester_milestones(semester);

-- Per-lab milestone completions: tracks which labs have completed which milestones
CREATE TABLE IF NOT EXISTS lab_milestone_completions (
  milestone_id  TEXT NOT NULL REFERENCES semester_milestones(id) ON DELETE CASCADE,
  changelab_id  TEXT NOT NULL REFERENCES changelabs(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  PRIMARY KEY (milestone_id, changelab_id)
);

CREATE INDEX IF NOT EXISTS idx_lmc_changelab ON lab_milestone_completions(changelab_id);

-- Seed SP 2026 milestones based on the academic calendar
INSERT INTO semester_milestones (semester, title, due_date, sort_order) VALUES
  ('SP 2026', 'Project kick-off & team formation',      '2026-01-23', 1),
  ('SP 2026', 'Community partner meeting',               '2026-02-06', 2),
  ('SP 2026', 'Mid-semester check-in',                  '2026-03-06', 3),
  ('SP 2026', 'Spring break — no classes',              '2026-03-07', 4),
  ('SP 2026', 'Deliverable draft due',                  '2026-04-03', 5),
  ('SP 2026', 'Last day to withdraw',                   '2026-04-10', 6),
  ('SP 2026', 'Final presentations',                    '2026-04-24', 7),
  ('SP 2026', 'Reading/study day',                      '2026-04-30', 8),
  ('SP 2026', 'Final exams begin',                      '2026-05-01', 9),
  ('SP 2026', 'Last day of term',                       '2026-05-07', 10)
ON CONFLICT DO NOTHING;
