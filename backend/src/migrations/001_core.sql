CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, initials TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff','intern')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, email TEXT UNIQUE, major TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  joined DATE NOT NULL DEFAULT CURRENT_DATE, last_visit DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, valid_days INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS member_certifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  issued_at DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at DATE, UNIQUE (member_id, cert_id)
);
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','checked_out','maintenance','retired')),
  location TEXT, serial TEXT, note TEXT,
  out_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE, for_changelab_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL, opened_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  open_time TEXT, close_time TEXT, visitors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS session_projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT, patron TEXT, description TEXT
);
CREATE TABLE IF NOT EXISTS camps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, description TEXT, start_date DATE NOT NULL, end_date DATE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20, registered INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','open','full','completed','cancelled')),
  location TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS camp_staff (
  camp_id TEXT NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (camp_id, user_id)
);
CREATE TABLE IF NOT EXISTS camp_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  camp_id TEXT NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  name TEXT NOT NULL, age INTEGER, guardian TEXT, phone TEXT, email TEXT,
  registered DATE NOT NULL DEFAULT CURRENT_DATE, notes TEXT
);
