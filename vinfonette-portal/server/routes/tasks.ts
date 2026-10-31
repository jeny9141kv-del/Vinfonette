import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import {
  authenticateToken,
  enforceManagementReadOnly,
  logAudit,
  AuthenticatedRequest,
} from '../auth';

const router = Router();
router.use(authenticateToken);
router.use(enforceManagementReadOnly);

// Get all tasks (filtered by user if requested)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { owner_id, status } = req.query;

  let sql = `
    SELECT t.*, p.full_name as owner_name, c.full_name as candidate_name
    FROM tasks t
    JOIN profiles p ON t.owner_id = p.id
    LEFT JOIN candidates c ON t.related_candidate_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (owner_id) {
    sql += ' AND t.owner_id = ?';
    params.push(owner_id);
  }
  if (status) {
    sql += ' AND t.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY t.due_date ASC';

  const rows = db.prepare(sql).all(...params);
  res.json({ tasks: rows });
});

// Create task
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const {
    title,
    description,
    related_candidate_id,
    related_company_id,
    related_job_id,
    related_interview_id,
    owner_id,
    priority = 'Medium',
    due_date,
    notes,
  } = req.body;

  if (!title || !due_date) {
    res.status(400).json({ error: 'Title and due date are required.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const assignedOwner = owner_id || req.user!.id;

  db.prepare(`
    INSERT INTO tasks (
      id, title, description, related_candidate_id, related_company_id, related_job_id,
      related_interview_id, owner_id, priority, due_date, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'To Do', ?, ?, ?)
  `).run(
    id, title.trim(), description?.trim() || null, related_candidate_id || null, related_company_id || null,
    related_job_id || null, related_interview_id || null, assignedOwner, priority, due_date, notes || null, now, now
  );

  logAudit(db, req, 'INSERT', 'task', id, { title });

  const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json({ task: created });
});

// Update task
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const updates = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.title || null,
    updates.description || null,
    updates.priority || null,
    updates.due_date || null,
    updates.status || null,
    updates.notes || null,
    now,
    id
  );

  logAudit(db, req, 'UPDATE', 'task', id, updates);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ task: updated });
});

// Reversible toggle task status
router.patch('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const id = req.params.id;

  const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  if (!current) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const isCompleted = current.status === 'Completed';
  const nextStatus = isCompleted ? 'To Do' : 'Completed';
  const now = new Date().toISOString();
  const completed_at = !isCompleted ? now : null;

  db.prepare(`
    UPDATE tasks SET
      status = ?,
      completed_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(nextStatus, completed_at, now, id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ task: updated });
});

export default router;
