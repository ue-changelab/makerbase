CREATE TABLE camps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  capacity    INT NOT NULL CHECK (capacity > 0),
  status      TEXT NOT NULL DEFAULT 'planning'
                CHECK (status IN ('planning', 'open', 'full', 'completed', 'cancelled')),
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_camps_status     ON camps(status);
CREATE INDEX idx_camps_start_date ON camps(start_date DESC);