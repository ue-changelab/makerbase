CREATE TABLE certifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  valid_days  INT CHECK (valid_days > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
