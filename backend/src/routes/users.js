import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id,name,initials,email,role FROM users ORDER BY name');
  res.json(rows);
});
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id,name,initials,email,role FROM users WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
export default router;
