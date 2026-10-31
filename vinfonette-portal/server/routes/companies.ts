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

// Get all companies
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM companies ORDER BY name ASC').all();
  res.json({ companies: rows });
});

// Get single company with jobs
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) {
    res.status(404).json({ error: 'Company not found.' });
    return;
  }

  const jobs = db.prepare('SELECT * FROM job_openings WHERE company_id = ? ORDER BY created_at DESC').all(req.params.id).map((j: any) => ({
    ...j,
    required_skills: typeof j.required_skills === 'string' ? JSON.parse(j.required_skills) : j.required_skills || [],
    eligible_batches: typeof j.eligible_batches === 'string' ? JSON.parse(j.eligible_batches) : j.eligible_batches || [],
  }));

  const placements = db.prepare('SELECT * FROM placements WHERE company_id = ?').all(req.params.id);

  res.json({ company, jobs, placements });
});

// Create company (Admin and Coordinator)
router.post('/', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { name, industry, website, office_location, contact_person, contact_email, contact_phone, tier = 'TIER_1', notes } = req.body;

  if (!name || !industry || !office_location || !contact_person || !contact_email) {
    res.status(400).json({ error: 'Name, industry, location, and contact person/email are required.' });
    return;
  }

  const countRow = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  const company_id = `CMP-${String(countRow.count + 1).padStart(3, '0')}`;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO companies (
      id, company_id, name, industry, website, office_location, contact_person, contact_email,
      contact_phone, relationship_owner_id, tier, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
  `).run(
    id, company_id, name.trim(), industry.trim(), website?.trim() || null, office_location.trim(),
    contact_person.trim(), contact_email.trim(), contact_phone?.trim() || null,
    req.user?.id || null, tier, notes || null, now, now
  );

  logAudit(db, req, 'INSERT', 'company', id, { name, company_id });

  const created = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
  res.status(201).json({ company: created });
});

// Update company
router.put('/:id', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const updates = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE companies SET
      name = COALESCE(?, name),
      industry = COALESCE(?, industry),
      website = COALESCE(?, website),
      office_location = COALESCE(?, office_location),
      contact_person = COALESCE(?, contact_person),
      contact_email = COALESCE(?, contact_email),
      contact_phone = COALESCE(?, contact_phone),
      tier = COALESCE(?, tier),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.name || null,
    updates.industry || null,
    updates.website || null,
    updates.office_location || null,
    updates.contact_person || null,
    updates.contact_email || null,
    updates.contact_phone || null,
    updates.tier || null,
    updates.status || null,
    updates.notes || null,
    now,
    id
  );

  logAudit(db, req, 'UPDATE', 'company', id, updates);

  const updated = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
  res.json({ company: updated });
});

export default router;
