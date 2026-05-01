import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { status, q } = req.query;
  const conditions = []; const params = [];
  if (status) { params.push(status); conditions.push('m.status=$' + params.length); }
  if (q) { params.push('%'+q+'%'); conditions.push('(m.name ILIKE $'+params.length+' OR m.major ILIKE $'+params.length+')'); }
  const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
  const { rows } = await pool.query('SELECT * FROM members m '+where+' ORDER BY m.name', params);
  res.json(rows);
});
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM members WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
router.post('/', requireAuth, async (req, res) => {
  const { name, email, major, status, joined } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await pool.query('INSERT INTO members (name,email,major,status,joined) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, email??null, major??null, status??'active', joined??new Date().toISOString().slice(0,10)]);
  res.status(201).json(rows[0]);
});
router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['name','email','major','status','last_visit'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k],i) => k+'=$'+(i+2)).join(', ');
  const { rows } = await pool.query('UPDATE members SET '+sets+' WHERE id=$1 RETURNING *', [req.params.id, ...updates.map(([,v])=>v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
export default router;
