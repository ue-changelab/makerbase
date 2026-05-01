import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM partners ORDER BY name');
  res.json(rows);
});
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM partners WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
router.post('/', requireAuth, async (req, res) => {
  const { name, kind, contact, role, email, phone, mou_status, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await pool.query('INSERT INTO partners (name,kind,contact,role,email,phone,mou_status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [name, kind??'Nonprofit', contact??null, role??null, email??null, phone??null, mou_status??'none', notes??null]);
  res.status(201).json(rows[0]);
});
router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['name','kind','contact','role','email','phone','mou_status','mou_through','notes'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k],i) => k+'=$'+(i+2)).join(', ');
  const { rows } = await pool.query('UPDATE partners SET '+sets+', updated_at=NOW() WHERE id=$1 RETURNING *', [req.params.id, ...updates.map(([,v])=>v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
export default router;
