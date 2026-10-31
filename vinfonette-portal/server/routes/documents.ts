import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DOCUMENTS_DIR, RESUMES_DIR } from '../config';
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

const VALID_DOC_TYPES = ['resume', 'education_certificate', 'experience_certificate'] as const;
type DocType = (typeof VALID_DOC_TYPES)[number];

// Configure storage for all candidate documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
    }
    cb(null, DOCUMENTS_DIR);
  },
  filename: (req, file, cb) => {
    const candidateId = req.params.candidateId;
    const docType = req.params.docType || 'document';
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFilename = `${candidateId}_${docType}_${Date.now()}_${sanitizedOriginal}`;
    cb(null, safeFilename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: PDF, DOC, DOCX, JPG, and PNG documents.'));
    }
  },
});

// Upload document for a candidate
router.post(
  '/upload/:candidateId/:docType',
  enforceManagementReadOnly,
  requireRole(['ADMIN', 'PLACEMENT_COORDINATOR']),
  upload.single('file'),
  (req: AuthenticatedRequest, res: Response) => {
    const { candidateId, docType } = req.params;

    if (!VALID_DOC_TYPES.includes(docType as DocType)) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      res.status(400).json({ error: `Invalid document type "${docType}". Valid types: ${VALID_DOC_TYPES.join(', ')}` });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const db = getDb();
    const candidate = db.prepare('SELECT id, full_name, resume_filename, education_certificate_filename, experience_certificate_filename FROM candidates WHERE id = ?').get(candidateId) as any;

    if (!candidate) {
      try { fs.unlinkSync(req.file.path); } catch {}
      res.status(404).json({ error: 'Candidate not found.' });
      return;
    }

    const savedFilename = req.file.filename;
    const originalName = req.file.originalname;
    const downloadUrl = `/api/documents/download/${candidateId}/${docType}`;
    const now = new Date().toISOString();

    let docLabel = 'Document';
    if (docType === 'education_certificate') {
      docLabel = 'Educational Certificate';
      // Clean up previous file if any
      if (candidate.education_certificate_filename) {
        try { fs.unlinkSync(path.join(DOCUMENTS_DIR, candidate.education_certificate_filename)); } catch {}
      }
      db.prepare(`
        UPDATE candidates SET
          education_certificate_url = ?,
          education_certificate_filename = ?,
          last_activity_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(downloadUrl, savedFilename, now, now, candidateId);
    } else if (docType === 'experience_certificate') {
      docLabel = 'Experience Certificate';
      if (candidate.experience_certificate_filename) {
        try { fs.unlinkSync(path.join(DOCUMENTS_DIR, candidate.experience_certificate_filename)); } catch {}
      }
      db.prepare(`
        UPDATE candidates SET
          experience_certificate_url = ?,
          experience_certificate_filename = ?,
          last_activity_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(downloadUrl, savedFilename, now, now, candidateId);
    } else if (docType === 'resume') {
      docLabel = 'Resume';
      if (candidate.resume_filename) {
        try { fs.unlinkSync(path.join(RESUMES_DIR, candidate.resume_filename)); } catch {}
        try { fs.unlinkSync(path.join(DOCUMENTS_DIR, candidate.resume_filename)); } catch {}
      }
      db.prepare(`
        UPDATE candidates SET
          resume_url = ?,
          resume_filename = ?,
          last_activity_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(downloadUrl, savedFilename, now, now, candidateId);
    }

    // Log Activity
    db.prepare(`
      INSERT INTO candidate_activities (id, candidate_id, actor_id, actor_name, type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, 'DOCUMENT_UPLOADED', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      candidateId,
      req.user!.id,
      req.user!.full_name,
      `${docLabel} "${originalName}" uploaded by ${req.user!.full_name}.`,
      JSON.stringify({ docType, originalName, filename: savedFilename, size: req.file.size }),
      now
    );

    logAudit(db, req, 'UPLOAD_DOCUMENT', 'candidate', candidateId, {
      docType,
      filename: savedFilename,
      originalName,
      size: req.file.size,
    });

    res.json({
      message: `${docLabel} uploaded successfully.`,
      docType,
      url: downloadUrl,
      filename: savedFilename,
      originalName,
    });
  }
);

// Download or stream document
router.get('/download/:candidateId/:docType', (req: AuthenticatedRequest, res: Response) => {
  const { candidateId, docType } = req.params;
  const db = getDb();
  const candidate = db.prepare('SELECT id, full_name, resume_filename, education_certificate_filename, experience_certificate_filename FROM candidates WHERE id = ?').get(candidateId) as any;

  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found.' });
    return;
  }

  let filename = '';
  if (docType === 'education_certificate') {
    filename = candidate.education_certificate_filename;
  } else if (docType === 'experience_certificate') {
    filename = candidate.experience_certificate_filename;
  } else if (docType === 'resume') {
    filename = candidate.resume_filename;
  }

  if (!filename) {
    res.status(404).json({ error: `No ${docType} file on record for this candidate.` });
    return;
  }

  let filePath = path.join(DOCUMENTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    // Check resumes dir for backwards compatibility
    const fallbackPath = path.join(RESUMES_DIR, filename);
    if (fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    } else {
      res.status(404).json({ error: 'Document file not found on local storage disk.' });
      return;
    }
  }

  res.download(filePath, filename);
});

export default router;

