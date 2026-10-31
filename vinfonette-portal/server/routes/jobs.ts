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

function formatJob(row: any) {
  if (!row) return null;
  return {
    ...row,
    required_skills: typeof row.required_skills === 'string' ? JSON.parse(row.required_skills) : row.required_skills || [],
    eligible_batches: typeof row.eligible_batches === 'string' ? JSON.parse(row.eligible_batches) : row.eligible_batches || [],
  };
}

// Get all jobs
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT j.*, c.name as company_name, c.office_location as company_location
    FROM job_openings j
    JOIN companies c ON j.company_id = c.id
    ORDER BY j.created_at DESC
  `).all();

  res.json({ jobs: rows.map(formatJob) });
});

// Get single job with applications
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const job = db.prepare(`
    SELECT j.*, c.name as company_name, c.office_location as company_location
    FROM job_openings j
    JOIN companies c ON j.company_id = c.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) {
    res.status(404).json({ error: 'Job opening not found.' });
    return;
  }

  const applications = db.prepare(`
    SELECT a.*, c.full_name as candidate_name, c.candidate_id as candidate_code, c.email as candidate_email
    FROM job_applications a
    JOIN candidates c ON a.candidate_id = c.id
    WHERE a.job_id = ?
    ORDER BY a.applied_at DESC
  `).all(req.params.id);

  res.json({ job: formatJob(job), applications });
});

// Create job opening
router.post('/', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const {
    company_id,
    title,
    description,
    required_skills = [],
    experience_min_years = 0,
    education_requirements,
    eligible_batches = [],
    work_location,
    work_mode = 'HYBRID',
    salary_min,
    salary_max,
    currency = 'INR',
    vacancies = 1,
    application_deadline,
    recruiter_name,
    recruiter_email,
    interview_process,
  } = req.body;

  if (!company_id || !title || !description || !work_location) {
    res.status(400).json({ error: 'Company, title, description, and work location are required.' });
    return;
  }

  const countRow = db.prepare('SELECT COUNT(*) as count FROM job_openings').get() as { count: number };
  const job_id = `JOB-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(2, '0')}`;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO job_openings (
      id, job_id, company_id, title, description, required_skills, experience_min_years,
      education_requirements, eligible_batches, work_location, work_mode, salary_min, salary_max,
      currency, vacancies, application_deadline, recruiter_name, recruiter_email, interview_process,
      status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      'OPEN', ?, ?
    )
  `).run(
    id, job_id, company_id, title.trim(), description.trim(), JSON.stringify(required_skills),
    Number(experience_min_years), education_requirements || null, JSON.stringify(eligible_batches),
    work_location.trim(), work_mode, salary_min ? Number(salary_min) : null, salary_max ? Number(salary_max) : null,
    currency, Number(vacancies), application_deadline || null, recruiter_name || null,
    recruiter_email || null, interview_process || null, now, now
  );

  logAudit(db, req, 'INSERT', 'job_opening', id, { title, job_id });

  const created = db.prepare('SELECT * FROM job_openings WHERE id = ?').get(id);
  res.status(201).json({ job: formatJob(created) });
});

// Update job opening
router.put('/:id', requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const updates = req.body;
  const now = new Date().toISOString();

  const required_skills = updates.required_skills !== undefined ? JSON.stringify(updates.required_skills) : undefined;
  const eligible_batches = updates.eligible_batches !== undefined ? JSON.stringify(updates.eligible_batches) : undefined;

  db.prepare(`
    UPDATE job_openings SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      required_skills = COALESCE(?, required_skills),
      experience_min_years = COALESCE(?, experience_min_years),
      education_requirements = COALESCE(?, education_requirements),
      eligible_batches = COALESCE(?, eligible_batches),
      work_location = COALESCE(?, work_location),
      work_mode = COALESCE(?, work_mode),
      salary_min = COALESCE(?, salary_min),
      salary_max = COALESCE(?, salary_max),
      currency = COALESCE(?, currency),
      vacancies = COALESCE(?, vacancies),
      application_deadline = COALESCE(?, application_deadline),
      recruiter_name = COALESCE(?, recruiter_name),
      recruiter_email = COALESCE(?, recruiter_email),
      interview_process = COALESCE(?, interview_process),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.title || null,
    updates.description || null,
    required_skills || null,
    updates.experience_min_years !== undefined ? Number(updates.experience_min_years) : null,
    updates.education_requirements || null,
    eligible_batches || null,
    updates.work_location || null,
    updates.work_mode || null,
    updates.salary_min !== undefined ? Number(updates.salary_min) : null,
    updates.salary_max !== undefined ? Number(updates.salary_max) : null,
    updates.currency || null,
    updates.vacancies !== undefined ? Number(updates.vacancies) : null,
    updates.application_deadline || null,
    updates.recruiter_name || null,
    updates.recruiter_email || null,
    updates.interview_process || null,
    updates.status || null,
    now,
    id
  );

  logAudit(db, req, 'UPDATE', 'job_opening', id, updates);

  const updated = db.prepare('SELECT * FROM job_openings WHERE id = ?').get(id);
  res.json({ job: formatJob(updated) });
});

export default router;
