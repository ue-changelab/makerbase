CREATE TABLE IF NOT EXISTS import_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  filename TEXT NOT NULL,
  sheet_type TEXT NOT NULL,
  rows_found INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  imported_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_logs_date ON import_logs(imported_at DESC);
