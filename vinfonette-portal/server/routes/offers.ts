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

// Get all offers
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT o.*,
           c.full_name as candidate_name, c.candidate_id as candidate_code,
           j.title as job_title,
           comp.name as company_name
    FROM offers o
    JOIN candidates c ON o.candidate_id = c.id
    JOIN job_openings j ON o.job_id = j.id
    JOIN companies comp ON o.company_id = comp.id
    ORDER BY o.offer_date DESC
  `).all();

  res.json({ offers: rows });
});

// Create formal offer
router.post('/', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const {
    candidate_id,
    application_id,
    job_id,
    company_id,
    offer_date = new Date().toISOString().split('T')[0],
    joining_date,
    base_salary,
    variable_salary = 0,
    currency = 'INR',
    offer_letter_url,
  } = req.body;

  if (!candidate_id || !job_id || !company_id || !base_salary) {
    res.status(400).json({ error: 'Candidate, job opening, company, and base salary are required.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO offers (
      id, candidate_id, application_id, job_id, company_id, offer_date, joining_date,
      base_salary, variable_salary, currency, offer_letter_url, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, 'RECEIVED', ?, ?
    )
  `).run(
    id, candidate_id, application_id || null, job_id, company_id, offer_date, joining_date || null,
    Number(base_salary), Number(variable_salary), currency, offer_letter_url || null, now, now
  );

  // Update candidate stage to Offer Received
  db.prepare('UPDATE candidates SET current_stage = ?, last_activity_at = ?, updated_at = ? WHERE id = ?').run('Offer Received', now, now, candidate_id);

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'OFFER_RECEIVED', ?, '{}', ?)
  `).run(crypto.randomUUID(), candidate_id, req.user!.id, req.user!.full_name, `Received formal job offer with base salary ₹${Number(base_salary).toLocaleString('en-IN')}`, now);

  logAudit(db, req, 'INSERT', 'offer', id, { candidate_id, base_salary });

  const created = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  res.status(201).json({ offer: created });
});

// Update offer status
router.patch('/:id/status', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const { status, rejection_reason } = req.body;

  if (!status) {
    res.status(400).json({ error: 'status is required.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE offers SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?').run(status, rejection_reason || null, now, id);

  logAudit(db, req, 'UPDATE', 'offer', id, { status, rejection_reason });

  const updated = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  res.json({ offer: updated });
});

export default router;
