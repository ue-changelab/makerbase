import pg from 'pg';
import 'dotenv/config';
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX ?? '10', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
pool.on('error', err => console.error('pg idle error:', err.message));
pool.on('connect', () => { if (!isProduction) console.log('[db] client connected'); });
export default pool;
