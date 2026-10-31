import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import {
  authenticateToken,
  enforceManagementReadOnly,
  requireRole,
  hashPassword,
  logAudit,
  AuthenticatedRequest,
} from '../auth';

const router = Router();
router.use(authenticateToken);
router.use(enforceManagementReadOnly);

// Get all staff profiles
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT id, email, full_name, role, title, phone, avatar_url, status, created_at FROM profiles ORDER BY full_name ASC').all();
  res.json({ team: rows });
});

// Invite/Create new team member (Admin only)
router.post('/', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { email, password, full_name, role = 'PLACEMENT_COORDINATOR', title, phone } = req.body;

  if (!email || !full_name) {
    res.status(400).json({ error: 'Email and full name are required.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'A team member with this email already exists.' });
    return;
  }

  const id = crypto.randomUUID();
  const defaultPassword = password || crypto.randomBytes(6).toString('hex') + 'A1!';
  const password_hash = await hashPassword(defaultPassword);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO profiles (id, email, password_hash, full_name, role, title, phone, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `).run(
    id, email.trim().toLowerCase(), password_hash, full_name.trim(), role,
    title || null, phone || null, now, now
  );

  logAudit(db, req, 'USER_INVITED', 'profile', id, { email, role });

  const created = db.prepare('SELECT id, email, full_name, role, title, phone, avatar_url, status, created_at FROM profiles WHERE id = ?').get(id);
  res.status(201).json({ member: created, temporaryPassword: password ? undefined : defaultPassword });
});

// Update profile details (with self-role escalation prevention)
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const targetId = req.params.id;
  const updates = req.body;

  // Non-admins can only update their own profile
  if (req.user?.role !== 'ADMIN' && req.user?.id !== targetId) {
    res.status(403).json({ error: 'Forbidden: You can only update your own profile details.' });
    return;
  }

  // Non-admins CANNOT change roles
  if (updates.role && req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Only administrators can modify user roles or elevate permissions.' });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE profiles SET
      full_name = COALESCE(?, full_name),
      phone = COALESCE(?, phone),
      title = COALESCE(?, title),
      avatar_url = COALESCE(?, avatar_url),
      role = COALESCE(?, role),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(
    updates.full_name || null,
    updates.phone || null,
    updates.title || null,
    updates.avatar_url || null,
    req.user?.role === 'ADMIN' ? (updates.role || null) : null,
    req.user?.role === 'ADMIN' ? (updates.status || null) : null,
    now,
    targetId
  );

  logAudit(db, req, 'UPDATE', 'profile', targetId, updates);

  const updated = db.prepare('SELECT id, email, full_name, role, title, phone, avatar_url, status, created_at FROM profiles WHERE id = ?').get(targetId);
  res.json({ member: updated });
});

export default router;
