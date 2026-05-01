import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.post('/', requireAuth, async (req, res) => {
  const { title, code, brief, partner_id, faculty, disciplines=[], semester, meets, capacity, milestones=[] } = req.body;
  if (!title || !code || !semester) return res.status(400).json({ error: 'title, code, semester required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('INSERT INTO changelabs (code,title,semester,faculty_id,partner_id,brief,meets,capacity,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [code,title,semester,faculty??null,partner_id??null,brief??null,meets??null,capacity??12,'proposed']);
    const cl = rows[0];
    for (const d of disciplines) await client.query('INSERT INTO changelab_disciplines (changelab_id,discipline) VALUES ($1,$2) ON CONFLICT DO NOTHING', [cl.id,d]);
    for (const [i,m] of milestones.entries()) await client.query('INSERT INTO changelab_milestones (changelab_id,due_date,title,sort_order) VALUES ($1,$2,$3,$4)', [cl.id,m.due_date,m.title,i+1]);
    await client.query('COMMIT');
    res.status(201).json(cl);
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
});
export default router;
