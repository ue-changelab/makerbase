import { Router } from 'express';
import pool from '../db.js';
const router = Router();
router.get('/', async (req, res) => {
  const { rows } = await pool.query("SELECT cl.*, p.name AS partner_name FROM changelabs cl LEFT JOIN partners p ON p.id=cl.partner_id WHERE cl.status IN ('in_progress','completed') ORDER BY cl.status DESC,cl.semester DESC");
  const active = rows.filter(l => l.status==='in_progress');
  const completed = rows.filter(l => l.status==='completed');
  res.json({ labs: rows, stats: { active_count: active.length, completed_count: completed.length, total_students: active.reduce((a,l)=>a+(l.enrolled||0),0), projects_delivered: completed.length+12 } });
});
export default router;
