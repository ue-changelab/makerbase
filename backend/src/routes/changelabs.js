import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { semester, status } = req.query;
  const conditions = []; const params = [];
  if (semester) { params.push(semester); conditions.push('cl.semester=$'+params.length); }
  if (status)   { params.push(status);   conditions.push('cl.status=$'+params.length); }
  const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT cl.*, u.name AS faculty_name, p.name AS partner_name
     FROM changelabs cl
     LEFT JOIN users u ON u.id=cl.faculty_id
     LEFT JOIN partners p ON p.id=cl.partner_id
     ${where}
     ORDER BY cl.semester DESC, cl.title`,
    params
  );
  res.json(rows);
});

// ── Semester routes — MUST be before /:id ────────────────────────────────────

router.get('/semesters/all', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM semesters ORDER BY start_date DESC');
  res.json(rows);
});

router.get('/semesters/:code', requireAuth, async (req, res) => {
  const code = decodeURIComponent(req.params.code);
  const { rows } = await pool.query('SELECT * FROM semesters WHERE code=$1', [code]);
  if (!rows[0]) return res.status(404).json({ error: 'Semester not found' });
  res.json(rows[0]);
});

router.get('/semesters/:code/milestones', requireAuth, async (req, res) => {
  const code = decodeURIComponent(req.params.code);
  const { lab_id } = req.query;
  const { rows } = await pool.query(
    `SELECT sm.*,
      CASE WHEN lmc.milestone_id IS NOT NULL THEN true ELSE false END AS completed,
      lmc.completed_at, lmc.notes, u.name AS completed_by_name
     FROM semester_milestones sm
     LEFT JOIN lab_milestone_completions lmc
       ON lmc.milestone_id=sm.id AND ($2::text IS NULL OR lmc.changelab_id=$2)
     LEFT JOIN users u ON u.id=lmc.completed_by
     WHERE sm.semester=$1
     ORDER BY sm.sort_order`,
    [code, lab_id || null]
  );
  res.json(rows);
});

router.post('/semesters/:code/milestones', requireAdmin, async (req, res) => {
  const code = decodeURIComponent(req.params.code);
  const { title, due_date, sort_order } = req.body;
  if (!title || !due_date) return res.status(400).json({ error: 'title and due_date required' });
  const { rows } = await pool.query(
    'INSERT INTO semester_milestones (semester, title, due_date, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
    [code, title, due_date, sort_order ?? 0]
  );
  res.status(201).json(rows[0]);
});

router.patch('/milestones/:id', requireAdmin, async (req, res) => {
  const allowed = ['title', 'due_date', 'sort_order'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k], i) => `${k}=$${i+2}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE semester_milestones SET ${sets} WHERE id=$1 RETURNING *`,
    [req.params.id, ...updates.map(([,v]) => v)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.delete('/milestones/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM semester_milestones WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

router.post('/milestones/:id/complete', requireAdmin, async (req, res) => {
  const { changelab_id, notes } = req.body;
  if (!changelab_id) return res.status(400).json({ error: 'changelab_id required' });
  const { rows: existing } = await pool.query(
    'SELECT 1 FROM lab_milestone_completions WHERE milestone_id=$1 AND changelab_id=$2',
    [req.params.id, changelab_id]
  );
  if (existing.length) {
    await pool.query(
      'DELETE FROM lab_milestone_completions WHERE milestone_id=$1 AND changelab_id=$2',
      [req.params.id, changelab_id]
    );
    res.json({ completed: false });
  } else {
    await pool.query(
      'INSERT INTO lab_milestone_completions (milestone_id, changelab_id, completed_by, notes) VALUES ($1,$2,$3,$4)',
      [req.params.id, changelab_id, req.user.id, notes ?? null]
    );
    res.json({ completed: true });
  }
});

// ── ChangeLab CRUD — /:id routes AFTER static routes ─────────────────────────
  const { rows } = await pool.query(
    `SELECT cl.*, u.name AS faculty_name, p.name AS partner_name
     FROM changelabs cl
     LEFT JOIN users u ON u.id=cl.faculty_id
     LEFT JOIN partners p ON p.id=cl.partner_id
     WHERE cl.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const { rows: m } = await pool.query(
    'SELECT * FROM changelab_milestones WHERE changelab_id=$1 ORDER BY sort_order',
    [req.params.id]
  );
  const { rows: r } = await pool.query(
    'SELECT cm.*, mb.name, mb.major FROM changelab_members cm JOIN members mb ON mb.id=cm.member_id WHERE cm.changelab_id=$1',
    [req.params.id]
  );
  rows[0].milestones = m; rows[0].roster = r;
  res.json(rows[0]);
});

// Roster from changelab_roster table (historical imports)
router.get('/:id/roster', requireAuth, async (req, res) => {
  const { rows: labRows } = await pool.query(
    'SELECT title, semester FROM changelabs WHERE id=$1',
    [req.params.id]
  );
  if (!labRows[0]) return res.status(404).json({ error: 'Not found' });
  const { title, semester } = labRows[0];
  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.email, m.major, cr.class_level, cr.instructor, cr.phone
     FROM changelab_roster cr
     JOIN members m ON m.id=cr.member_id
     WHERE cr.project_name=$1 AND cr.semester=$2
     ORDER BY m.name`,
    [title, semester]
  );
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { code, title, semester, faculty_id, partner_id, brief, meets, location, capacity, status } = req.body;
  if (!code || !title || !semester) return res.status(400).json({ error: 'code, title, semester required' });
  const { rows } = await pool.query(
    'INSERT INTO changelabs (code,title,semester,faculty_id,partner_id,brief,meets,location,capacity,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [code,title,semester,faculty_id??null,partner_id??null,brief??null,meets??null,location??null,capacity??12,status??'proposed']
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['code','title','semester','faculty_id','partner_id','brief','meets','location','capacity','enrolled','status','progress','impact'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k],i) => k+'=$'+(i+2)).join(', ');
  const { rows } = await pool.query(
    'UPDATE changelabs SET '+sets+', updated_at=NOW() WHERE id=$1 RETURNING *',
    [req.params.id, ...updates.map(([,v])=>v)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

export default router;
