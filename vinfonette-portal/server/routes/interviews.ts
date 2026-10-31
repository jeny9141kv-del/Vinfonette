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

// Get all interviews
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT i.*,
           c.full_name as candidate_name, c.candidate_id as candidate_code, c.email as candidate_email,
           j.title as job_title,
           comp.name as company_name
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    JOIN job_openings j ON i.job_id = j.id
    JOIN companies comp ON i.company_id = comp.id
    ORDER BY i.scheduled_at ASC
  `).all();

  res.json({ interviews: rows });
});

// Helper function to check interview conflicts
function findInterviewConflict(db: any, candidateId: string, scheduledAt: string, durationMinutes: number, excludeId?: string) {
  const newStart = new Date(scheduledAt).getTime();
  const newEnd = newStart + durationMinutes * 60 * 1000;

  const existingInterviews = db.prepare(`
    SELECT id, round_name, scheduled_at, duration_minutes
    FROM interviews
    WHERE candidate_id = ? AND status NOT IN ('cancelled', 'completed')
  `).all(candidateId);

  for (const existing of existingInterviews) {
    if (excludeId && existing.id === excludeId) continue;
    const existStart = new Date(existing.scheduled_at).getTime();
    const existEnd = existStart + existing.duration_minutes * 60 * 1000;

    if (newStart < existEnd && newEnd > existStart) {
      return existing;
    }
  }
  return null;
}

// Schedule interview with conflict check
router.post('/', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR', 'TRAINER']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const {
    candidate_id,
    application_id,
    job_id,
    company_id,
    round_number = 1,
    round_name,
    scheduled_at,
    duration_minutes = 45,
    timezone = 'Asia/Kolkata',
    mode = 'VIRTUAL',
    meeting_link,
    location_details,
    interviewer_names,
  } = req.body;

  if (!candidate_id || !job_id || !company_id || !round_name || !scheduled_at) {
    res.status(400).json({ error: 'candidate, job, company, round name, and scheduled date/time are required.' });
    return;
  }

  // Check scheduling conflict
  const conflict = findInterviewConflict(db, candidate_id, scheduled_at, Number(duration_minutes));
  if (conflict) {
    res.status(409).json({
      error: `Interview Conflict: Candidate already has "${conflict.round_name}" scheduled at ${new Date(conflict.scheduled_at).toLocaleString()}.`,
    });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO interviews (
      id, candidate_id, application_id, job_id, company_id, round_number, round_name,
      scheduled_at, duration_minutes, timezone, mode, meeting_link, location_details,
      interviewer_names, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, 'scheduled', ?, ?
    )
  `).run(
    id, candidate_id, application_id || null, job_id, company_id, Number(round_number), round_name.trim(),
    scheduled_at, Number(duration_minutes), timezone, mode, meeting_link || null, location_details || null,
    interviewer_names || null, now, now
  );

  // Auto update candidate stage if earlier stage
  const cand = db.prepare('SELECT current_stage FROM candidates WHERE id = ?').get(candidate_id) as any;
  if (cand && ['Registered', 'Training in Progress', 'Training Completed', 'Resume Ready', 'Placement Ready', 'Applications Submitted'].includes(cand.current_stage)) {
    db.prepare('UPDATE candidates SET current_stage = ?, last_activity_at = ?, updated_at = ? WHERE id = ?').run('Interview Scheduled', now, now, candidate_id);
  }

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'INTERVIEW_SCHEDULED', ?, '{}', ?)
  `).run(crypto.randomUUID(), candidate_id, req.user!.id, req.user!.full_name, `Round ${round_number} (${round_name}) scheduled for ${new Date(scheduled_at).toLocaleDateString()}`, now);

  logAudit(db, req, 'INSERT', 'interview', id, { round_name, candidate_id });

  const created = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id);
  res.status(201).json({ interview: created });
});

// Update interview details
router.put('/:id', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR', 'TRAINER']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const updates = req.body;
  const now = new Date().toISOString();

  // If rescheduling, check conflict
  if (updates.scheduled_at) {
    const current = db.prepare('SELECT candidate_id, duration_minutes FROM interviews WHERE id = ?').get(id) as any;
    if (current) {
      const conflict = findInterviewConflict(
        db,
        current.candidate_id,
        updates.scheduled_at,
        Number(updates.duration_minutes || current.duration_minutes),
        id
      );
      if (conflict) {
        res.status(409).json({
          error: `Interview Conflict: Candidate already has "${conflict.round_name}" scheduled at ${new Date(conflict.scheduled_at).toLocaleString()}.`,
        });
        return;
      }
    }
  }

  db.prepare(`
    UPDATE interviews SET
      round_name = COALESCE(?, round_name),
      scheduled_at = COALESCE(?, scheduled_at),
      duration_minutes = COALESCE(?, duration_minutes),
      mode = COALESCE(?, mode),
      meeting_link = COALESCE(?, meeting_link),
      location_details = COALESCE(?, location_details),
      interviewer_names = COALESCE(?, interviewer_names),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.round_name || null,
    updates.scheduled_at || null,
    updates.duration_minutes !== undefined ? Number(updates.duration_minutes) : null,
    updates.mode || null,
    updates.meeting_link || null,
    updates.location_details || null,
    updates.interviewer_names || null,
    updates.status || null,
    now,
    id
  );

  logAudit(db, req, 'UPDATE', 'interview', id, updates);

  const updated = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id);
  res.json({ interview: updated });
});

// Record interview evaluation/feedback
router.post('/:id/feedback', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR', 'TRAINER']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const { feedback, result, next_round } = req.body;

  const current = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id) as any;
  if (!current) {
    res.status(404).json({ error: 'Interview not found.' });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE interviews SET
      feedback = ?,
      result = ?,
      next_round = ?,
      status = 'completed',
      updated_at = ?
    WHERE id = ?
  `).run(feedback || null, result || null, next_round || null, now, id);

  db.prepare(`
    INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, 'INTERVIEW_FEEDBACK', ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    current.candidate_id,
    req.user!.id,
    req.user!.full_name,
    `Interview outcome: ${result || 'Evaluated'}. ${feedback ? `Feedback: ${feedback}` : ''}`,
    JSON.stringify({ result, feedback, next_round }),
    now
  );

  // Update candidate stage to Interview Completed if candidate is on Interview Scheduled
  const cand = db.prepare('SELECT current_stage FROM candidates WHERE id = ?').get(current.candidate_id) as any;
  if (cand && cand.current_stage === 'Interview Scheduled') {
    db.prepare('UPDATE candidates SET current_stage = ?, last_activity_at = ?, updated_at = ? WHERE id = ?').run('Interview Completed', now, now, current.candidate_id);
  }

  logAudit(db, req, 'FEEDBACK_RECORDED', 'interview', id, { result, next_round });

  const updated = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id);
  res.json({ interview: updated });
});

export default router;
