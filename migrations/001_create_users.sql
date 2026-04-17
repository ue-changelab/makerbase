CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
   id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   name         TEXT NOT NULL,
   email        TEXT NOT NULL UNIQUE,
   password_hash TEXT NOT NULL,
   role         TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'intern')),
   created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
