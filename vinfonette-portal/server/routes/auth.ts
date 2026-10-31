import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  requireRole,
  logAudit,
  AuthenticatedRequest,
  AuthUser,
} from '../auth';
import { seedDemoData } from '../seed';

const router = Router();

// Check if first-time installation setup is required
router.get('/setup-status', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
  const setupRequired = row.count === 0;

  res.json({
    setupRequired,
    userCount: row.count,
    mode: 'LOCAL_FIRST',
    message: setupRequired
      ? 'No administrator configured yet. First-run administrator initialization required.'
      : 'Local database initialized and ready.',
  });
});

// Create initial administrator account on an uninitialized computer
router.post('/setup-admin', async (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };

  if (row.count > 0) {
    res.status(403).json({
      error: 'Initial setup has already been completed on this computer. Please log in with existing credentials.',
    });
    return;
  }

  const { email, password, full_name, title, phone } = req.body;

  if (!email || !password || !full_name) {
    res.status(400).json({ error: 'Full name, email, and password are required.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  try {
    const password_hash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, title, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, 'ACTIVE', ?, ?)
    `).run(userId, email.trim().toLowerCase(), password_hash, full_name.trim(), title || 'System Administrator', phone || '', now, now);

    const user: AuthUser = {
      id: userId,
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: 'ADMIN',
      status: 'ACTIVE',
    };

    const token = generateToken(user);
    logAudit(db, req as AuthenticatedRequest, 'SETUP_ADMIN', 'profile', userId, { email: user.email });

    res.status(201).json({
      message: 'Local Administrator initialized successfully.',
      token,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create local administrator: ' + (err.message || 'Database error') });
  }
});

// Local User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const db = getDb();
  const userRow = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email.trim().toLowerCase()) as any;

  if (!userRow) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (userRow.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
    return;
  }

  const isValid = await comparePassword(password, userRow.password_hash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const user: AuthUser = {
    id: userRow.id,
    email: userRow.email,
    full_name: userRow.full_name,
    role: userRow.role,
    status: userRow.status,
  };

  const token = generateToken(user);
  logAudit(db, req as AuthenticatedRequest, 'LOGIN', 'profile', user.id, { email: user.email });

  res.json({
    token,
    user: {
      ...user,
      title: userRow.title,
      phone: userRow.phone,
      avatar_url: userRow.avatar_url,
    },
  });
});

// Get current authenticated user
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userRow = db.prepare('SELECT id, email, full_name, role, title, phone, avatar_url, status, created_at FROM profiles WHERE id = ?').get(req.user!.id) as any;

  if (!userRow) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ user: userRow });
});

// Logout (audited locally)
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  logAudit(db, req, 'LOGOUT', 'profile', req.user!.id, {});
  res.json({ message: 'Logged out successfully.' });
});

// Seed synthetic demonstration records on demand
router.post(
  '/seed-demo',
  ...(process.env.CODESPACES === 'true' ? [authenticateToken, requireRole(['ADMIN'])] : []),
  async (req, res) => {
  const db = getDb();
  try {
    await seedDemoData(db);
    res.json({ message: 'Demonstration dataset seeded successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed demo data: ' + err.message });
  }
  },
);

export default router;
