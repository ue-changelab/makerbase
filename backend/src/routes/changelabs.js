import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  const { semester, status } = req.query;
  const conditions = []; const params = [];
  if (semester) { params.push(semester); conditions.push('cl.semester=$'+params.length); }
  if (status)   { params.push(status);   conditions.push('cl.status=$'+params.length); }
  const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
  const { rows } = await pool.query('SELECT cl.*, u.name AS faculty_name, p.name AS partner_name FROM changelabs cl LEFT JOIN users u ON u.id=cl.faculty_id LEFT JOIN partners p ON p.id=cl.partner_id '+where+' ORDER BY cl.semester DESC,cl.code', params);
  res.json(rows);
});
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT cl.*, u.name AS faculty_name, p.name AS partner_name FROM changelabs cl LEFT JOIN users u ON u.id=cl.faculty_id LEFT JOIN partners p ON p.id=cl.partner_id WHERE cl.id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const { rows: m } = await pool.query('SELECT * FROM changelab_milestones WHERE changelab_id=$1 ORDER BY sort_order', [req.params.id]);
  const { rows: r } = await pool.query('SELECT cm.*, mb.name, mb.major FROM changelab_members cm JOIN members mb ON mb.id=cm.member_id WHERE cm.changelab_id=$1', [req.params.id]);
  rows[0].milestones = m; rows[0].roster = r;
  res.json(rows[0]);
});
router.post('/', requireAuth, async (req, res) => {
  const { code, title, semester, faculty_id, partner_id, brief, meets, location, capacity, status } = req.body;
  if (!code || !title || !semester) return res.status(400).json({ error: 'code, title, semester required' });
  const { rows } = await pool.query('INSERT INTO changelabs (code,title,semester,faculty_id,partner_id,brief,meets,location,capacity,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [code,title,semester,faculty_id??null,partner_id??null,brief??null,meets??null,location??null,capacity??12,status??'proposed']);
  res.status(201).json(rows[0]);
});
router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['code','title','semester','faculty_id','partner_id','brief','meets','location','capacity','enrolled','status','progress','impact'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k],i) => k+'=$'+(i+2)).join(', ');
  const { rows } = await pool.query('UPDATE changelabs SET '+sets+', updated_at=NOW() WHERE id=$1 RETURNING *', [req.params.id, ...updates.map(([,v])=>v)]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});
export default router;
