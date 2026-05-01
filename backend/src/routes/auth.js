import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
const router = Router();
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase().trim()]);
  if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, rows[0].password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: rows[0].role, name: rows[0].name, initials: rows[0].initials }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: rows[0].id, name: rows[0].name, initials: rows[0].initials, role: rows[0].role, email: rows[0].email } });
});
router.get('/me', async (req, res) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const p = jwt.verify(h.slice(7), process.env.JWT_SECRET);
  const { rows } = await pool.query('SELECT id,name,initials,email,role FROM users WHERE id=$1', [p.id]);
  if (!rows[0]) return res.status(401).json({ error: 'User not found' });
  res.json({ user: rows[0] });
});
export default router;
