import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { PORT, HOST, DATA_DIR, DB_PATH } from './config';
import { getDb } from './db';

import authRouter from './routes/auth';
import candidatesRouter from './routes/candidates';
import companiesRouter from './routes/companies';
import jobsRouter from './routes/jobs';
import applicationsRouter from './routes/applications';
import interviewsRouter from './routes/interviews';
import offersRouter from './routes/offers';
import placementsRouter from './routes/placements';
import tasksRouter from './routes/tasks';
import teamRouter from './routes/team';
import reportsRouter from './routes/reports';
import notificationsRouter from './routes/notifications';
import auditRouter from './routes/audit';
import resumesRouter from './routes/resumes';
import documentsRouter from './routes/documents';
import backupRouter from './routes/backup';

export function createServer() {
  // Initialize local SQLite database
  getDb();

  const app = express();

  // Basic security middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // CORS restricted strictly to localhost and loopback origins
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile, curl, server-to-server)
        if (!origin) return callback(null, true);
        const allowedOrigins = [process.env.APP_ORIGIN, process.env.RENDER_EXTERNAL_URL].filter(Boolean);
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error('Blocked by CORS policy: Only local loopback access is allowed.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // System Diagnostics
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      product: 'VinfoNette Placement Management Portal',
      mode: 'PRIVATE_LOCAL_FIRST',
      host: HOST,
      port: PORT,
      database: DB_PATH,
      dataDirectory: DATA_DIR,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRouter);
  app.use('/api/candidates', candidatesRouter);
  app.use('/api/companies', companiesRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/interviews', interviewsRouter);
  app.use('/api/offers', offersRouter);
  app.use('/api/placements', placementsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/team', teamRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/resumes', resumesRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/backup', backupRouter);

  // In production, serve the built React app from the same origin as the API.
  const clientBuildDir = path.resolve(process.cwd(), 'dist');
  const clientIndex = path.join(clientBuildDir, 'index.html');
  app.use(express.static(clientBuildDir));
  app.get(/^(?!\/api\/).*/, (_req, res, next) => {
    if (!fs.existsSync(clientIndex)) return next();
    res.sendFile(clientIndex);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createServer();
  app.listen(PORT, HOST, () => {
    console.log(`================================================================`);
    console.log(`  VinfoNette Placement Management Portal — Local-First Backend  `);
    console.log(`================================================================`);
    console.log(`  Status:       Online (Bound strictly to private loopback)`);
    console.log(`  Address:      http://${HOST}:${PORT}`);
    console.log(`  Data Folder:  ${DATA_DIR}`);
    console.log(`  SQLite DB:    ${DB_PATH}`);
    console.log(`================================================================`);
  });
}
