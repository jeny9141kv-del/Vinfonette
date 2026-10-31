import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../auth';

const router = Router();
router.use(authenticateToken);

// Audit logs are visible strictly to ADMIN and MANAGEMENT
router.get('/', requireRole(['ADMIN', 'MANAGEMENT']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { action, entity_type, limit = 100 } = req.query;

  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (action) {
    sql += ' AND action = ?';
    params.push(action);
  }
  if (entity_type) {
    sql += ' AND entity_type = ?';
    params.push(entity_type);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit) || 100);

  const rows = db.prepare(sql).all(...params).map((a: any) => ({
    ...a,
    details: typeof a.details === 'string' ? JSON.parse(a.details) : a.details || {},
  }));

  res.json({ auditLogs: rows });
});

export default router;
