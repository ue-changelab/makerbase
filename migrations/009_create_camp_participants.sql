CREATE TABLE camp_participants (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camp_id          UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  age              INT CHECK (age > 0 AND age < 120),
  email            TEXT,
  guardian_name    TEXT,
  guardian_phone   TEXT,
  notes            TEXT,
  registered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_participants_camp ON camp_participants(camp_id);