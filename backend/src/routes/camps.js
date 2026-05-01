import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM camps ORDER BY start_date');
  res.json(rows);
});
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM camps WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const { rows: p } = await pool.query('SELECT * FROM camp_participants WHERE camp_id=$1 ORDER BY registered', [req.params.id]);
  rows[0].participants = p;
  res.json(rows[0]);
});
router.post('/', requireAuth, async (req, res) => {
  const { name, description, start_date, end_date, capacity, location } = req.body;
  if (!name || !start_date || !end_date) return res.status(400).json({ error: 'name, start_date, end_date required' });
  const { rows } = await pool.query('INSERT INTO camps (name,description,start_date,end_date,capacity,location) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, description??null, start_date, end_date, capacity??20, location??null]);
  res.status(201).json(rows[0]);
});
export default router;
