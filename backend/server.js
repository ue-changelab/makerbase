import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './src/routes/auth.js';
import equipmentRoutes from './src/routes/equipment.js';
import sessionsRoutes from './src/routes/sessions.js';
import certificationsRoutes from './src/routes/certifications.js';
import campsRoutes from './src/routes/camps.js';
import usersRoutes from './src/routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts — please try again later.' },
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/certifications', certificationsRoutes);
app.use('/api/camps', campsRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`MakerBase API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
