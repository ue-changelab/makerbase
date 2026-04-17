CREATE TABLE camp_staff (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camp_id  UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id),
  role     TEXT NOT NULL DEFAULT 'assistant'
             CHECK (role IN ('lead', 'assistant', 'volunteer')),
  UNIQUE(camp_id, user_id)
);

CREATE INDEX idx_camp_staff_camp ON camp_staff(camp_id);
CREATE INDEX idx_camp_staff_user ON camp_staff(user_id);
