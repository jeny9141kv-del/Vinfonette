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

// Helper to format candidate row from SQLite (parsing JSON fields)
function formatCandidate(row: any) {
  if (!row) return null;
  return {
    ...row,
    technical_skills: typeof row.technical_skills === 'string' ? JSON.parse(row.technical_skills) : row.technical_skills || [],
    certifications: typeof row.certifications === 'string' ? JSON.parse(row.certifications) : row.certifications || [],
    preferred_roles: typeof row.preferred_roles === 'string' ? JSON.parse(row.preferred_roles) : row.preferred_roles || [],
    preferred_locations: typeof row.preferred_locations === 'string' ? JSON.parse(row.preferred_locations) : row.preferred_locations || [],
    service_history: typeof row.service_history === 'string' ? JSON.parse(row.service_history) : row.service_history || [],
    has_experience: Boolean(row.has_experience),
    payment_status: row.payment_status || 'PENDING',
    payment_amount: row.payment_amount !== null && row.payment_amount !== undefined ? Number(row.payment_amount) : 0,
    amount_paid: row.amount_paid !== null && row.amount_paid !== undefined ? Number(row.amount_paid) : 0,
    total_experience_years: row.total_experience_years !== null && row.total_experience_years !== undefined ? Number(row.total_experience_years) : 0,
    pf_status: row.pf_status || 'NOT_APPLICABLE',
  };
}

// 1. Get all candidates (with optional search, stage, batch, readiness, payment_status filters)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { stage, batch, readiness, search, payment_status } = req.query;

  let sql = 'SELECT * FROM candidates WHERE 1=1';
  const params: any[] = [];

  // Coordinator isolation: if coordinator, only view assigned or unassigned if strict isolation requested
  if (req.user?.role === 'PLACEMENT_COORDINATOR' && req.query.strictCoord === 'true') {
    sql += ' AND (coordinator_id = ? OR coordinator_id IS NULL)';
    params.push(req.user.id);
  }

  if (stage) {
    sql += ' AND current_stage = ?';
    params.push(stage);
  }
  if (batch) {
    sql += ' AND batch = ?';
    params.push(batch);
  }
  if (readiness) {
    sql += ' AND readiness_assessment = ?';
    params.push(readiness);
  }
  if (payment_status && payment_status !== 'ALL') {
    sql += ' AND payment_status = ?';
    params.push(payment_status);
  }
  if (search) {
    sql += ' AND (full_name LIKE ? OR email LIKE ? OR candidate_id LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ candidates: rows.map(formatCandidate) });
});

// 2. Get single candidate by ID with associated data (activities, applications, interviews, offers, placement, tasks)
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;

  const candidateRow = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  if (!candidateRow) {
    res.status(404).json({ error: 'Candidate not found.' });
    return;
  }

  const activities = db.prepare('SELECT * FROM candidate_activities WHERE candidate_id = ? ORDER BY created_at DESC').all(id).map((a: any) => ({
    ...a,
    metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata || {},
  }));

  const applications = db.prepare('SELECT * FROM job_applications WHERE candidate_id = ? ORDER BY applied_at DESC').all(id);
  const interviews = db.prepare('SELECT * FROM interviews WHERE candidate_id = ? ORDER BY scheduled_at ASC').all(id);
  const offers = db.prepare('SELECT * FROM offers WHERE candidate_id = ? ORDER BY offer_date DESC').all(id);
  const placement = db.prepare('SELECT * FROM placements WHERE candidate_id = ?').get(id);
  const tasks = db.prepare('SELECT * FROM tasks WHERE related_candidate_id = ? ORDER BY due_date ASC').all(id);

  res.json({
    candidate: formatCandidate(candidateRow),
    activities,
    applications,
    interviews,
    offers,
    placement,
    tasks,
  });
});

// 3. Create Candidate (Admin and Coordinator only)
router.post('/', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const {
    full_name,
    email,
    phone,
    education,
    specialization,
    graduation_year,
    batch,
    technical_skills = [],
    certifications = [],
    training_program_id,
    training_progress = 0,
    preferred_roles = [],
    preferred_locations = [],
    coordinator_id,
    trainer_id,
    readiness_assessment = 'NOT_EVALUATED',
    readiness_score = 0,
    internal_notes,
    payment_status = 'PENDING',
    payment_amount = 0,
    amount_paid = 0,
    payment_date,
    payment_reference,
    payment_notes,
    education_certificate_url,
    education_certificate_filename,
    pf_status = 'NOT_APPLICABLE',
    pf_uan,
    pf_number,
    pf_notes,
    has_experience = false,
    total_experience_years = 0,
    service_history = [],
    experience_certificate_url,
    experience_certificate_filename,
  } = req.body;

  if (!full_name || !email || !phone || !education || !specialization || !graduation_year || !batch) {
    res.status(400).json({ error: 'Missing required candidate information.' });
    return;
  }

  // Check duplicate email
  const existing = db.prepare('SELECT id FROM candidates WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'A candidate with this email address already exists.' });
    return;
  }

  const countRow = db.prepare('SELECT COUNT(*) as count FROM candidates').get() as { count: number };
  const nextSeq = countRow.count + 1;
  const candidate_id = `VN-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const assignedCoordId = coordinator_id || (req.user?.role === 'PLACEMENT_COORDINATOR' ? req.user.id : null);

  db.prepare(`
    INSERT INTO candidates (
      id, candidate_id, full_name, email, phone, education, specialization, graduation_year, batch,
      technical_skills, certifications, training_program_id, training_progress, preferred_roles,
      preferred_locations, current_stage, placement_status, coordinator_id, trainer_id,
      readiness_assessment, readiness_score, registration_date, last_activity_at, internal_notes,
      payment_status, payment_amount, amount_paid, payment_date, payment_reference, payment_notes,
      education_certificate_url, education_certificate_filename,
      pf_status, pf_uan, pf_number, pf_notes,
      has_experience, total_experience_years, service_history,
      experience_certificate_url, experience_certificate_filename,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, 'Registered', 'ACTIVE', ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?
    )
  `).run(
    id, candidate_id, full_name.trim(), email.trim().toLowerCase(), phone.trim(), education.trim(),
    specialization.trim(), Number(graduation_year), batch.trim(),
    JSON.stringify(technical_skills), JSON.stringify(certifications), training_program_id || null,
    Number(training_progress), JSON.stringify(preferred_roles), JSON.stringify(preferred_locations),
    assignedCoordId, trainer_id || null, readiness_assessment, Number(readiness_score),
    now.split('T')[0], now, internal_notes || null,
    payment_status, Number(payment_amount || 0), Number(amount_paid || 0), payment_date || null, payment_reference || null, payment_notes || null,
    education_certificate_url || null, education_certificate_filename || null,
    pf_status, pf_uan || null, pf_number || null, pf_notes || null,
    has_experience ? 1 : 0, Number(total_experience_years || 0), JSON.stringify(service_history || []),
    experience_certificate_url || null, experience_certificate_filename || null,
    now, now
  );

  // Add initial activity
  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'CANDIDATE_REGISTERED', ?, '{}', ?)
  `).run(crypto.randomUUID(), id, req.user!.id, req.user!.full_name, `Candidate registered with ID ${candidate_id}`, now);

  logAudit(db, req, 'INSERT', 'candidate', id, { candidate_id, name: full_name });

  const created = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  res.status(201).json({ candidate: formatCandidate(created) });
});

// 4. Update Candidate details
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;

  const current = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id) as any;
  if (!current) {
    res.status(404).json({ error: 'Candidate not found.' });
    return;
  }

  // Permission enforcement
  if (req.user?.role === 'PLACEMENT_COORDINATOR') {
    if (current.coordinator_id && current.coordinator_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: You cannot modify candidates assigned to another coordinator.' });
      return;
    }
  } else if (req.user?.role === 'TRAINER') {
    if (current.trainer_id && current.trainer_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: You can only update candidates assigned to your training batch.' });
      return;
    }
    // Trainers can only update readiness/score/progress
    const allowedKeys = ['readiness_assessment', 'readiness_score', 'training_progress', 'internal_notes'];
    const invalidKey = Object.keys(req.body).find((k) => !allowedKeys.includes(k));
    if (invalidKey) {
      res.status(403).json({ error: `Forbidden: Trainers cannot modify profile field '${invalidKey}'.` });
      return;
    }
  }

  const updates = req.body;
  const now = new Date().toISOString();

  const technical_skills = updates.technical_skills !== undefined ? JSON.stringify(updates.technical_skills) : current.technical_skills;
  const certifications = updates.certifications !== undefined ? JSON.stringify(updates.certifications) : current.certifications;
  const preferred_roles = updates.preferred_roles !== undefined ? JSON.stringify(updates.preferred_roles) : current.preferred_roles;
  const preferred_locations = updates.preferred_locations !== undefined ? JSON.stringify(updates.preferred_locations) : current.preferred_locations;
  const service_history = updates.service_history !== undefined ? JSON.stringify(updates.service_history) : current.service_history;
  const has_experience = updates.has_experience !== undefined ? (updates.has_experience ? 1 : 0) : current.has_experience;

  db.prepare(`
    UPDATE candidates SET
      full_name = COALESCE(?, full_name),
      phone = COALESCE(?, phone),
      education = COALESCE(?, education),
      specialization = COALESCE(?, specialization),
      graduation_year = COALESCE(?, graduation_year),
      batch = COALESCE(?, batch),
      technical_skills = ?,
      certifications = ?,
      training_program_id = COALESCE(?, training_program_id),
      training_progress = COALESCE(?, training_progress),
      preferred_roles = ?,
      preferred_locations = ?,
      coordinator_id = COALESCE(?, coordinator_id),
      trainer_id = COALESCE(?, trainer_id),
      readiness_assessment = COALESCE(?, readiness_assessment),
      readiness_score = COALESCE(?, readiness_score),
      internal_notes = COALESCE(?, internal_notes),
      payment_status = COALESCE(?, payment_status),
      payment_amount = COALESCE(?, payment_amount),
      amount_paid = COALESCE(?, amount_paid),
      payment_date = COALESCE(?, payment_date),
      payment_reference = COALESCE(?, payment_reference),
      payment_notes = COALESCE(?, payment_notes),
      education_certificate_url = COALESCE(?, education_certificate_url),
      education_certificate_filename = COALESCE(?, education_certificate_filename),
      pf_status = COALESCE(?, pf_status),
      pf_uan = COALESCE(?, pf_uan),
      pf_number = COALESCE(?, pf_number),
      pf_notes = COALESCE(?, pf_notes),
      has_experience = ?,
      total_experience_years = COALESCE(?, total_experience_years),
      service_history = ?,
      experience_certificate_url = COALESCE(?, experience_certificate_url),
      experience_certificate_filename = COALESCE(?, experience_certificate_filename),
      last_activity_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.full_name || null,
    updates.phone || null,
    updates.education || null,
    updates.specialization || null,
    updates.graduation_year || null,
    updates.batch || null,
    technical_skills,
    certifications,
    updates.training_program_id || null,
    updates.training_progress !== undefined ? Number(updates.training_progress) : null,
    preferred_roles,
    preferred_locations,
    updates.coordinator_id || null,
    updates.trainer_id || null,
    updates.readiness_assessment || null,
    updates.readiness_score !== undefined ? Number(updates.readiness_score) : null,
    updates.internal_notes || null,
    updates.payment_status || null,
    updates.payment_amount !== undefined ? Number(updates.payment_amount) : null,
    updates.amount_paid !== undefined ? Number(updates.amount_paid) : null,
    updates.payment_date || null,
    updates.payment_reference || null,
    updates.payment_notes || null,
    updates.education_certificate_url || null,
    updates.education_certificate_filename || null,
    updates.pf_status || null,
    updates.pf_uan || null,
    updates.pf_number || null,
    updates.pf_notes || null,
    has_experience,
    updates.total_experience_years !== undefined ? Number(updates.total_experience_years) : null,
    service_history,
    updates.experience_certificate_url || null,
    updates.experience_certificate_filename || null,
    now,
    now,
    id
  );

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'PROFILE_UPDATED', ?, '{}', ?)
  `).run(crypto.randomUUID(), id, req.user!.id, req.user!.full_name, `Candidate profile details updated by ${req.user!.full_name}.`, now);

  logAudit(db, req, 'UPDATE', 'candidate', id, updates);

  const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  res.json({ candidate: formatCandidate(updated) });
});

// 5. Update Candidate Pipeline Stage
router.patch('/:id/stage', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const { newStage, note } = req.body;

  if (!newStage) {
    res.status(400).json({ error: 'newStage is required.' });
    return;
  }

  const current = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id) as any;
  if (!current) {
    res.status(404).json({ error: 'Candidate not found.' });
    return;
  }

  // Strict enterprise rule: candidate cannot be moved to 'Placed Successfully' without active confirmed placement!
  if (newStage === 'Placed Successfully') {
    const placement = db.prepare('SELECT id FROM placements WHERE candidate_id = ? AND status = ?').get(id, 'CONFIRMED');
    if (!placement) {
      res.status(400).json({
        error: 'Placement Details Required: Candidate cannot be moved to Placed Successfully without a confirmed employer, job, and CTC record.',
      });
      return;
    }
  }

  const now = new Date().toISOString();
  const placementStatus = newStage === 'Placed Successfully' ? 'PLACED' : (['Not Interested', 'Withdrawn'].includes(newStage) ? 'OPTED_OUT' : 'ACTIVE');

  db.prepare(`
    UPDATE candidates SET
      current_stage = ?,
      placement_status = ?,
      last_activity_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(newStage, placementStatus, now, now, id);

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'STAGE_CHANGE', ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    id,
    req.user!.id,
    req.user!.full_name,
    `Stage changed from "${current.current_stage}" to "${newStage}"${note ? ` · Note: ${note}` : ''}`,
    JSON.stringify({ previousStage: current.current_stage, newStage, note }),
    now
  );

  logAudit(db, req, 'STAGE_CHANGE', 'candidate', id, { previousStage: current.current_stage, newStage, note });

  const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  res.json({ candidate: formatCandidate(updated) });
});

// 6. Archive Candidate (Admin only)
router.delete('/:id', requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const now = new Date().toISOString();

  db.prepare('UPDATE candidates SET placement_status = ?, updated_at = ? WHERE id = ?').run('ARCHIVED', now, id);
  logAudit(db, req, 'ARCHIVE', 'candidate', id, {});

  res.json({ message: 'Candidate archived successfully.' });
});

export default router;
