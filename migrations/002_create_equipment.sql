CREATE TABLE equipment (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'checked_out', 'maintenance', 'retired')),
  location      TEXT,
  serial_number TEXT,
  notes         TEXT,
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_status   ON equipment(status)   WHERE is_deleted = false;
CREATE INDEX idx_equipment_category ON equipment(category) WHERE is_deleted = false;