import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import changeLabsRouter from './routes/changelabs.js';
import partnersRouter from './routes/partners.js';
import proposalsRouter from './routes/proposals.js';
import showcaseRouter from './routes/showcase.js';
import membersRouter from './routes/members.js';
import equipmentRouter from './routes/equipment.js';
import certsRouter from './routes/certifications.js';
import campsRouter from './routes/camps.js';
import sessionsRouter from './routes/sessions.js';
import usersRouter from './routes/users.js';
import importRouter from './routes/import.js';

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "https://unpkg.com"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:"],
    }
  }
}));
app.set('trust proxy', 1);

const allowedOrigins = [process.env.FRONTEND_URL,'http://localhost:5173','http://localhost:3000','http://localhost:4000','https://localhost:4000'].filter(Boolean);
app.use(cors({ origin: (origin,cb) => (!origin||allowedOrigins.includes(origin))?cb(null,true):cb(new Error('CORS: '+origin+' not allowed')), credentials:true, methods:['GET','POST','PATCH','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization'] }));

app.use(express.json({ limit:'256kb' }));
app.use(requestLogger);
app.use(rateLimit({ windowMs:15*60*1000, max:300, standardHeaders:'draft-7', legacyHeaders:false, skip:req=>req.path==='/health' }));
app.use('/api/auth', rateLimit({ windowMs:15*60*1000, max:20, standardHeaders:'draft-7', legacyHeaders:false, message:{error:'Too many attempts'} }));

app.use('/admin', express.static(path.join(__dirname,'../public')));
app.get('/health', (_req,res) => res.json({ok:true,ts:new Date().toISOString(),env:process.env.NODE_ENV}));

app.use('/api/auth', authRouter);
app.use('/api/changelabs', changeLabsRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/showcase', showcaseRouter);
app.use('/api/members', membersRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/certifications', certsRouter);
app.use('/api/camps', campsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/import', importRouter);

app.use((_req,res) => res.status(404).json({error:'Route not found'}));
app.use(errorHandler);

app.listen(PORT, () => console.log('MakerBase API running at http://localhost:'+PORT));
