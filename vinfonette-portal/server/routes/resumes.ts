import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { RESUMES_DIR } from '../config';
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

// Configure secure local storage for uploaded resumes in the private data folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(RESUMES_DIR)) {
      fs.mkdirSync(RESUMES_DIR, { recursive: true });
    }
    cb(null, RESUMES_DIR);
  },
  filename: (req, file, cb) => {
    const candidateId = req.params.candidateId;
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFilename = `${candidateId}_${Date.now()}_${sanitizedOriginal}`;
    cb(null, safeFilename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX resume documents are permitted.'));
    }
  },
});

// Upload resume for a candidate
router.post(
  '/:candidateId',
  enforceManagementReadOnly,
  requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']),
  upload.single('resume'),
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No resume file uploaded.' });
      return;
    }

    const candidateId = req.params.candidateId;
    const db = getDb();
    const candidate = db.prepare('SELECT id, full_name, resume_filename FROM candidates WHERE id = ?').get(candidateId) as any;

    if (!candidate) {
      // Clean up orphaned uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      res.status(404).json({ error: 'Candidate not found.' });
      return;
    }

    // Clean up old resume file if one existed
    if (candidate.resume_filename) {
      const oldPath = path.join(RESUMES_DIR, candidate.resume_filename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch {}
      }
    }

    const savedFilename = req.file.filename;
    const resumeUrl = `/api/resumes/${candidateId}`;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE candidates SET
        resume_url = ?,
        resume_filename = ?,
        last_activity_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(resumeUrl, savedFilename, now, now, candidateId);

    db.prepare(`
      INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, 'RESUME_UPDATED', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      candidateId,
      req.user!.id,
      req.user!.full_name,
      `Resume document "${req.file.originalname}" uploaded by ${req.user!.full_name}.`,
      JSON.stringify({ originalName: req.file.originalname, size: req.file.size }),
      now
    );

    logAudit(db, req, 'UPLOAD_RESUME', 'candidate', candidateId, {
      filename: savedFilename,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    res.json({
      message: 'Resume uploaded successfully.',
      resumeUrl,
      resumeFilename: savedFilename,
      originalName: req.file.originalname,
    });
  }
);

// Stream private resume to authenticated staff
router.get('/:candidateId', (req: AuthenticatedRequest, res: Response) => {
  const candidateId = req.params.candidateId;
  const db = getDb();
  const candidate = db.prepare('SELECT id, full_name, resume_filename FROM candidates WHERE id = ?').get(candidateId) as any;

  if (!candidate || !candidate.resume_filename) {
    res.status(404).json({ error: 'No resume file on record for this candidate.' });
    return;
  }

  const filePath = path.join(RESUMES_DIR, candidate.resume_filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Resume file not found on local storage disk.' });
    return;
  }

  res.download(filePath, candidate.resume_filename);
});

export default router;
