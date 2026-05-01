import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT c.*, COUNT(DISTINCT mc.member_id)::int AS holder_count FROM certifications c LEFT JOIN member_certifications mc ON mc.cert_id=c.id GROUP BY c.id ORDER BY c.name');
  res.json(rows);
});
router.post('/', requireAuth, async (req, res) => {
  const { name, valid_days } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await pool.query('INSERT INTO certifications (name,valid_days) VALUES ($1,$2) RETURNING *', [name, valid_days??null]);
  res.status(201).json(rows[0]);
});
export default router;
