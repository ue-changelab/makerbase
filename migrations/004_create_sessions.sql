CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  opened_by     UUID NOT NULL REFERENCES users(id),
  open_time     TIME,
  close_time    TIME,
  visitor_count INT NOT NULL DEFAULT 0 CHECK (visitor_count >= 0),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_date      ON sessions(session_date DESC);
CREATE INDEX idx_sessions_opened_by ON sessions(opened_by);