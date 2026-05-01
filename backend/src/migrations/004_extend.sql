DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='equipment_for_changelab_id_fkey') THEN
    ALTER TABLE equipment ADD CONSTRAINT equipment_for_changelab_id_fkey FOREIGN KEY (for_changelab_id) REFERENCES changelabs(id) ON DELETE SET NULL;
  END IF;
END; $$;
CREATE INDEX IF NOT EXISTS idx_changelabs_status ON changelabs(status);
CREATE INDEX IF NOT EXISTS idx_changelabs_semester ON changelabs(semester);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_member_certs ON member_certifications(member_id);
