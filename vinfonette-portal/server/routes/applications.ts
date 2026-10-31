import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import {
  authenticateToken,
  enforceManagementReadOnly,
  requireRole,
  logAudit,
  AuthenticatedRequest,
} from '../auth';

const router = Router();
router.use(authenticateToken);
router.use(enforceManagementReadOnly);

// Get all applications
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT a.*,
           c.full_name as candidate_name, c.candidate_id as candidate_code, c.email as candidate_email,
           j.title as job_title, j.job_id as job_code,
           comp.name as company_name
    FROM job_applications a
    JOIN candidates c ON a.candidate_id = c.id
    JOIN job_openings j ON a.job_id = j.id
    JOIN companies comp ON j.company_id = comp.id
    ORDER BY a.applied_at DESC
  `).all();

  res.json({ applications: rows });
});

// Submit job application
router.post('/', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { candidate_id, job_id, notes, match_score = 85 } = req.body;

  if (!candidate_id || !job_id) {
    res.status(400).json({ error: 'candidate_id and job_id are required.' });
    return;
  }

  // Check existing application
  const existing = db.prepare('SELECT id FROM job_applications WHERE candidate_id = ? AND job_id = ?').get(candidate_id, job_id);
  if (existing) {
    res.status(409).json({ error: 'This candidate has already been submitted for this job opening.' });
    return;
  }

  const job = db.prepare(`
    SELECT j.*, co.status AS company_status
    FROM job_openings j
    JOIN companies co ON co.id = j.company_id
    WHERE j.id = ?
  `).get(job_id) as any;
  if (!job) {
    res.status(404).json({ error: 'Job opening not found.' });
    return;
  }

  const deadlinePassed = job.application_deadline &&
    new Date(`${String(job.application_deadline).slice(0, 10)}T23:59:59`).getTime() < Date.now();
  const hiredApplications = db.prepare(`
    SELECT COUNT(*) AS count FROM job_applications
    WHERE job_id = ? AND status = 'Hired'
  `).get(job_id) as { count: number };
  const remainingVacancies = Math.max(0, Number(job.vacancies || 0) - hiredApplications.count);
  const companyIsActive = ['ACTIVE', 'PARTNERED'].includes(job.company_status);

  if (job.status !== 'OPEN' || !companyIsActive || deadlinePassed || remainingVacancies <= 0) {
    res.status(409).json({ error: 'This position is not currently available in this company.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO job_applications (id, candidate_id, job_id, status, match_score, applied_at, notes, created_at, updated_at)
    VALUES (?, ?, ?, 'Submitted', ?, ?, ?, ?, ?)
  `).run(id, candidate_id, job_id, Number(match_score), now, notes || null, now, now);

  const candidateJob = db.prepare('SELECT title FROM job_openings WHERE id = ?').get(job_id) as any;
  const cand = db.prepare('SELECT full_name FROM candidates WHERE id = ?').get(candidate_id) as any;

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'APPLICATION_SUBMITTED', ?, '{}', ?)
  `).run(crypto.randomUUID(), candidate_id, req.user!.id, req.user!.full_name, `Application submitted for ${candidateJob?.title || 'Job Opening'}`, now);

  logAudit(db, req, 'INSERT', 'job_application', id, { candidate: cand?.full_name, job: candidateJob?.title });

  const created = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(id);
  res.status(201).json({ application: created });
});

// Update application status
router.patch('/:id/status', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: 'status is required.' });
    return;
  }

  const app = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(id) as any;
  if (!app) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE job_applications SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'APPLICATION_STATUS', ?, '{}', ?)
  `).run(crypto.randomUUID(), app.candidate_id, req.user!.id, req.user!.full_name, `Application status changed to ${status}`, now);

  logAudit(db, req, 'UPDATE', 'job_application', id, { status });

  const updated = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(id);
  res.json({ application: updated });
});

export default router;
