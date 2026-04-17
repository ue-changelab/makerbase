CREATE TABLE equipment_checkouts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id    UUID NOT NULL REFERENCES equipment(id),
  checked_out_by  UUID NOT NULL REFERENCES users(id),
  checked_out_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_back_at     TIMESTAMPTZ,
  returned_at     TIMESTAMPTZ,
  notes           TEXT
);

CREATE INDEX idx_checkouts_equipment ON equipment_checkouts(equipment_id);
CREATE INDEX idx_checkouts_user      ON equipment_checkouts(checked_out_by);
CREATE INDEX idx_checkouts_active    ON equipment_checkouts(equipment_id) WHERE returned_at IS NULL;