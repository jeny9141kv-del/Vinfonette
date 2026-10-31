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

// Get all placements
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.*,
           c.full_name as candidate_name, c.candidate_id as candidate_code, c.email as candidate_email,
           comp.name as company_name,
           j.title as job_title
    FROM placements p
    JOIN candidates c ON p.candidate_id = c.id
    JOIN companies comp ON p.company_id = comp.id
    JOIN job_openings j ON p.job_id = j.id
    ORDER BY p.placed_at DESC
  `).all();

  res.json({ placements: rows });
});

// Confirm placement (enforcing single active placement rule)
router.post('/', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const {
    candidate_id,
    company_id,
    job_id,
    offer_id,
    application_id,
    designation,
    ctc,
    currency = 'INR',
    joining_date,
    confirmation_details,
    coordinator_id,
  } = req.body;

  if (!candidate_id || !company_id || !job_id || !designation || !ctc || !joining_date || !confirmation_details) {
    res.status(400).json({
      error: 'Candidate, employer, job opening, designation, CTC, joining date, and confirmation details are required.',
    });
    return;
  }

  // Enforce single placement rule
  const existing = db.prepare('SELECT id, status FROM placements WHERE candidate_id = ? AND status = ?').get(candidate_id, 'CONFIRMED') as any;
  if (existing) {
    res.status(409).json({
      error: 'Duplicate Placement: Candidate already has an active confirmed placement. A candidate may only have one active confirmed placement.',
    });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO placements (
      id, candidate_id, company_id, job_id, offer_id, application_id, designation,
      ctc, currency, joining_date, confirmation_details, placed_at, coordinator_id, status,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, 'CONFIRMED',
      ?, ?
    )
  `).run(
    id, candidate_id, company_id, job_id, offer_id || null, application_id || null, designation.trim(),
    Number(ctc), currency, joining_date, confirmation_details.trim(), now,
    coordinator_id || req.user?.id || null, now, now
  );

  // Automatically update candidate stage to 'Placed Successfully' and status to 'PLACED'
  db.prepare(`
    UPDATE candidates SET
      current_stage = 'Placed Successfully',
      placement_status = 'PLACED',
      last_activity_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(now, now, candidate_id);

  const comp = db.prepare('SELECT name FROM companies WHERE id = ?').get(company_id) as any;

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'PLACEMENT_CONFIRMED', ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    candidate_id,
    req.user!.id,
    req.user!.full_name,
    `Confirmed placement as ${designation} at ${comp?.name || 'Partner Company'} with CTC ₹${Number(ctc).toLocaleString('en-IN')}`,
    JSON.stringify({ company_name: comp?.name, designation, ctc, joining_date }),
    now
  );

  logAudit(db, req, 'PLACEMENT_CONFIRMED', 'placement', id, { candidate_id, company_id, ctc });

  const created = db.prepare('SELECT * FROM placements WHERE id = ?').get(id);
  res.status(201).json({ placement: created });
});

export default router;
