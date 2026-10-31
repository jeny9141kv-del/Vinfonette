import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { DB_PATH, DATA_DIR, RESUMES_DIR, DOCUMENTS_DIR, BACKUPS_DIR } from '../config';
import { getDb } from '../db';
import {
  authenticateToken,
  requireRole,
  logAudit,
  AuthenticatedRequest,
} from '../auth';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// 1. Get local storage, database, and backup diagnostics
router.get('/info', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  let dbSizeBytes = 0;
  if (fs.existsSync(DB_PATH)) {
    dbSizeBytes = fs.statSync(DB_PATH).size;
  }

  let resumesCount = 0;
  let resumesSizeBytes = 0;
  if (fs.existsSync(RESUMES_DIR)) {
    const files = fs.readdirSync(RESUMES_DIR);
    resumesCount = files.length;
    for (const f of files) {
      try {
        resumesSizeBytes += fs.statSync(path.join(RESUMES_DIR, f)).size;
      } catch {}
    }
  }

  const existingBackups: any[] = [];
  if (fs.existsSync(BACKUPS_DIR)) {
    const entries = fs.readdirSync(BACKUPS_DIR);
    for (const entry of entries) {
      const entryPath = path.join(BACKUPS_DIR, entry);
      try {
        const stat = fs.statSync(entryPath);
        if (stat.isDirectory()) {
          const manifestPath = path.join(entryPath, 'manifest.json');
          let manifest = null;
          if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          }
          existingBackups.push({
            id: entry,
            name: entry,
            createdAt: stat.mtime.toISOString(),
            sizeBytes: stat.size,
            manifest,
          });
        }
      } catch {}
    }
  }

  existingBackups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    dataDir: DATA_DIR,
    dbPath: DB_PATH,
    dbSizeBytes,
    resumesDir: RESUMES_DIR,
    resumesCount,
    resumesSizeBytes,
    backupsDir: BACKUPS_DIR,
    backups: existingBackups,
    privacyNotice: 'Local database files and backups are stored unencrypted on disk. Use BitLocker or Windows Device Encryption to protect candidate PII.',
  });
});

// 2. Create manual local backup snapshot
router.post('/create', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFolder = path.join(BACKUPS_DIR, `vinfonette_backup_${timestamp}`);

  try {
    fs.mkdirSync(backupFolder, { recursive: true });

    // Copy SQLite database file using VACUUM INTO or file copy
    const targetDbPath = path.join(backupFolder, 'vinfonette.db');
    try {
      db.exec(`VACUUM INTO '${targetDbPath.replace(/'/g, "''")}';`);
    } catch {
      fs.copyFileSync(DB_PATH, targetDbPath);
    }

    // Copy resumes folder
    const targetResumesDir = path.join(backupFolder, 'resumes');
    fs.mkdirSync(targetResumesDir, { recursive: true });
    if (fs.existsSync(RESUMES_DIR)) {
      const files = fs.readdirSync(RESUMES_DIR);
      for (const file of files) {
        fs.copyFileSync(path.join(RESUMES_DIR, file), path.join(targetResumesDir, file));
      }
    }

    // Copy documents folder (education certificates, experience certificates)
    const targetDocsDir = path.join(backupFolder, 'documents');
    fs.mkdirSync(targetDocsDir, { recursive: true });
    if (fs.existsSync(DOCUMENTS_DIR)) {
      const files = fs.readdirSync(DOCUMENTS_DIR);
      for (const file of files) {
        fs.copyFileSync(path.join(DOCUMENTS_DIR, file), path.join(targetDocsDir, file));
      }
    }

    // Query stats for manifest
    const candCount = (db.prepare('SELECT COUNT(*) as c FROM candidates').get() as any).c;
    const plcCount = (db.prepare('SELECT COUNT(*) as c FROM placements').get() as any).c;

    const manifest = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      createdBy: req.user!.email,
      candidateCount: candCount,
      placementCount: plcCount,
      backupPath: backupFolder,
    };

    fs.writeFileSync(path.join(backupFolder, 'manifest.json'), JSON.stringify(manifest, null, 2));

    logAudit(db, req, 'BACKUP_CREATED', 'system', backupFolder, manifest);

    res.status(201).json({
      message: 'Local backup created successfully.',
      backupId: `vinfonette_backup_${timestamp}`,
      destination: backupFolder,
      manifest,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create local backup: ' + (err.message || 'IO Error') });
  }
});

// 3. Restore from a selected local backup
router.post('/restore', (req: AuthenticatedRequest, res: Response) => {
  const { backupId } = req.body;

  if (!backupId) {
    res.status(400).json({ error: 'backupId is required.' });
    return;
  }

  const backupFolder = path.join(BACKUPS_DIR, backupId);
  const sourceDbPath = path.join(backupFolder, 'vinfonette.db');

  if (!fs.existsSync(sourceDbPath)) {
    res.status(404).json({ error: 'Backup database file not found in destination folder.' });
    return;
  }

  try {
    // Overwrite database file
    fs.copyFileSync(sourceDbPath, DB_PATH);

    // Overwrite resumes
    const sourceResumes = path.join(backupFolder, 'resumes');
    if (fs.existsSync(sourceResumes)) {
      if (!fs.existsSync(RESUMES_DIR)) {
        fs.mkdirSync(RESUMES_DIR, { recursive: true });
      }
      const files = fs.readdirSync(sourceResumes);
      for (const file of files) {
        fs.copyFileSync(path.join(sourceResumes, file), path.join(RESUMES_DIR, file));
      }
    }

    const db = getDb();
    logAudit(db, req, 'BACKUP_RESTORED', 'system', backupId, { restoredFrom: backupFolder });

    res.json({
      message: 'Local backup restored successfully. The portal has re-synchronized with the restored dataset.',
      backupId,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to restore backup: ' + (err.message || 'IO Error') });
  }
});

export default router;
