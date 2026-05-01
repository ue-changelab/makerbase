CREATE TABLE IF NOT EXISTS dance_camp_guardians (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, relationship TEXT, address TEXT, city_state_zip TEXT,
  dob DATE, email TEXT, cell_phone TEXT, work_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dance_camp_campers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  camp_name TEXT NOT NULL DEFAULT 'Dance Camp 2026',
  full_name TEXT NOT NULL, preferred_name TEXT, dob DATE, age_at_camp INTEGER,
  school TEXT, grade TEXT, race TEXT, shirt_size TEXT,
  medical_conditions TEXT, medication_required TEXT, food_restrictions TEXT, known_medical_issues TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','confirmed','waitlist','cancelled')),
  guardian_id TEXT REFERENCES dance_camp_guardians(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dance_camp_emergency_contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  camper_id TEXT NOT NULL REFERENCES dance_camp_campers(id) ON DELETE CASCADE,
  name TEXT NOT NULL, phone TEXT, relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dance_camp_campers_status ON dance_camp_campers(status);
CREATE INDEX IF NOT EXISTS idx_dance_camp_ec_camper ON dance_camp_emergency_contacts(camper_id);
