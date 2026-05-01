import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [file]);
      if (rows.length) { console.log('  skip ', file); continue; }
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log('  apply', file);
      } catch (err) { await client.query('ROLLBACK'); console.error('  ERROR in', file, err.message); process.exit(1); }
    }
    console.log('\nMigrations complete.');
  } finally { client.release(); await pool.end(); }
}
migrate();
