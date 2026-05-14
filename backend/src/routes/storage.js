import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/storage/orgs
router.get('/orgs', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM storage_orgs ORDER BY name');
  res.json(rows);
});

// GET /api/storage/items?org=&search=&flagged=true
router.get('/items', requireAuth, async (req, res) => {
  const { org, search, flagged } = req.query;
  const conditions = [];
  const params = [];

  if (org) {
    params.push(org);
    conditions.push('i.org_id=$' + params.length);
  }
  if (search) {
    params.push('%' + search + '%');
    const n = params.length;
    conditions.push(`(i.name ILIKE $${n} OR i.description ILIKE $${n} OR o.name ILIKE $${n})`);
  }
  if (flagged === 'true') {
    conditions.push('i.flagged=TRUE');
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const { rows } = await pool.query(
    `SELECT i.*,
            o.name  AS org_name,
            o.color AS org_color,
            COALESCE(
              (SELECT json_agg(c ORDER BY c.checked_out_at DESC)
               FROM storage_checkouts c
               WHERE c.item_id=i.id AND c.returned_at IS NULL),
              '[]'::json
            ) AS active_checkouts
     FROM storage_items i
     LEFT JOIN storage_orgs o ON o.id=i.org_id
     ${where}
     ORDER BY o.name NULLS LAST, i.name`,
    params
  );
  res.json(rows);
});

// GET /api/storage/items/:id
router.get('/items/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, o.name AS org_name, o.color AS org_color
     FROM storage_items i
     LEFT JOIN storage_orgs o ON o.id=i.org_id
     WHERE i.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const history = await pool.query(
    'SELECT * FROM storage_checkouts WHERE item_id=$1 ORDER BY checked_out_at DESC',
    [req.params.id]
  );
  res.json({ ...rows[0], checkouts: history.rows });
});

// POST /api/storage/items
router.post('/items', requireAuth, async (req, res) => {
  const { org_id, name, description, zone, shelf_position, quantity, condition } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await pool.query(
    `INSERT INTO storage_items (org_id,name,description,zone,shelf_position,quantity,condition)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [org_id ?? null, name.trim(), description ?? null, zone ?? null, shelf_position ?? null, quantity ?? 1, condition ?? 'good']
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/storage/items/:id
router.patch('/items/:id', requireAuth, async (req, res) => {
  const allowed = ['org_id', 'name', 'description', 'zone', 'shelf_position', 'quantity', 'condition'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map(([k], i) => `${k}=$${i + 2}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE storage_items SET ${sets}, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [req.params.id, ...updates.map(([, v]) => v)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// PATCH /api/storage/items/:id/flag (admin only)
router.patch('/items/:id/flag', requireAdmin, async (req, res) => {
  const { flagged } = req.body;
  const { rows } = await pool.query(
    'UPDATE storage_items SET flagged=$2, updated_at=NOW() WHERE id=$1 RETURNING *',
    [req.params.id, !!flagged]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// DELETE /api/storage/items/:id (admin only)
router.delete('/items/:id', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM storage_items WHERE id=$1 RETURNING id',
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// POST /api/storage/checkouts
router.post('/checkouts', requireAuth, async (req, res) => {
  const { item_id, borrower_name, event_name, expected_return, notes } = req.body;
  if (!item_id || !borrower_name?.trim()) {
    return res.status(400).json({ error: 'item_id and borrower_name required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO storage_checkouts
       (item_id,borrowed_by_user_id,borrower_name,event_name,expected_return,notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [item_id, req.user.id, borrower_name.trim(), event_name ?? null, expected_return ?? null, notes ?? null]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/storage/checkouts/:id/return
router.patch('/checkouts/:id/return', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE storage_checkouts SET returned_at=NOW() WHERE id=$1 AND returned_at IS NULL RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found or already returned' });
  res.json(rows[0]);
});

export default router;
