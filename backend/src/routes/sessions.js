import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT s.*, u.name AS opened_by_name FROM sessions s LEFT JOIN users u ON u.id=s.opened_by ORDER BY s.date DESC LIMIT 50');
  res.json(rows);
});
router.post('/', requireAuth, async (req, res) => {
  const { date, open_time } = req.body;
  const { rows } = await pool.query('INSERT INTO sessions (date,opened_by,open_time) VALUES ($1,$2,$3) RETURNING *',
    [date??new Date().toISOString().slice(0,10), req.user.id, open_time??new Date().toTimeString().slice(0,5)]);
  res.status(201).json(rows[0]);
});
router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['close_time','visitors'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k],i) => k+'=$'+(i+2)).join(', ');
  const { rows } = await pool.query('UPDATE sessions SET '+sets+' WHERE id=$1 RETURNING *', [req.params.id, ...updates.map(([,v])=>v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
export default router;
