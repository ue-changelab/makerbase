import express from 'express';
import pool from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    res.json([]);
  } catch (err) {
    console.error('[camps/GET /]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
