CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'Nonprofit',
  contact TEXT, role TEXT, email TEXT, phone TEXT,
  mou_status TEXT NOT NULL DEFAULT 'none' CHECK (mou_status IN ('signed','mou_pending','informal','none')),
  mou_through TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='partners_updated_at') THEN
    CREATE TRIGGER partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END; $$;
CREATE TABLE IF NOT EXISTS partner_interactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE, summary TEXT NOT NULL,
  staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='changelabs_partner_id_fkey') THEN
    ALTER TABLE changelabs ADD CONSTRAINT changelabs_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
  END IF;
END; $$;
