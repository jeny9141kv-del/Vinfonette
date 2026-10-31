import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../auth';

const router = Router();
router.use(authenticateToken);

// Get in-app notifications for authenticated user
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user!.id);
  res.json({ notifications: rows.map((n: any) => ({ ...n, read: Boolean(n.read) })) });
});

// Mark single notification as read
router.patch('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// Mark all as read
router.patch('/read-all', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user!.id);
  res.json({ success: true });
});

export default router;
