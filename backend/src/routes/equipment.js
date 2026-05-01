import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { status, category } = req.query;
  const conditions = []; const params = [];
  if (status)   { params.push(status);   conditions.push('e.status=$'+params.length); }
  if (category) { params.push(category); conditions.push('e.category=$'+params.length); }
  const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
  const { rows } = await pool.query('SELECT e.*, u.name AS out_to_name FROM equipment e LEFT JOIN users u ON u.id=e.out_to '+where+' ORDER BY e.category,e.name', params);
  res.json(rows);
});
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM equipment WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
router.post('/', requireAuth, async (req, res) => {
  const { name, category, status, location, serial, note } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category required' });
  const { rows } = await pool.query('INSERT INTO equipment (name,category,status,location,serial,note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, category, status??'available', location??null, serial??null, note??null]);
  res.status(201).json(rows[0]);
});
router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['name','category','status','location','serial','note','out_to','due_date'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k],i) => k+'=$'+(i+2)).join(', ');
  const { rows } = await pool.query('UPDATE equipment SET '+sets+' WHERE id=$1 RETURNING *', [req.params.id, ...updates.map(([,v])=>v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
export default router;
