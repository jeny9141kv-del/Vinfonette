import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config';
import { getDb, DatabaseInstance } from './db';

export type UserRole = 'ADMIN' | 'PLACEMENT_COORDINATOR' | 'MANAGEMENT' | 'TRAINER';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Authentication token is required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const db = getDb();
    const userRow = db.prepare('SELECT id, email, full_name, role, status FROM profiles WHERE id = ?').get(decoded.id) as any;

    if (!userRow || userRow.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Unauthorized: User account is inactive or revoked.' });
      return;
    }

    req.user = {
      id: userRow.id,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role,
      status: userRow.status,
    };
    next();
  } catch {
    res.status(403).json({ error: 'Forbidden: Invalid or expired session token.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: This operation requires one of the following roles: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

export function enforceManagementReadOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user && req.user.role === 'MANAGEMENT') {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      res.status(403).json({
        error: 'Forbidden: MANAGEMENT role is strictly restricted to read-only access.',
      });
      return;
    }
  }
  next();
}

export function logAudit(
  db: DatabaseInstance,
  req: AuthenticatedRequest,
  action: string,
  entity_type: string,
  entity_id: string,
  details: Record<string, any>
): void {
  try {
    const id = crypto.randomUUID();
    const actor_id = req.user?.id || null;
    const actor_email = req.user?.email || 'system@local';
    const ip_address = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_email, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      actor_id,
      actor_email,
      action,
      entity_type,
      entity_id,
      JSON.stringify(details),
      ip_address,
      created_at
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
