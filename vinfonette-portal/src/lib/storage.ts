// ==============================================================================
// VINFONETTE INTERNAL PLACEMENT MANAGEMENT PORTAL
// Private Local Storage Service (Local-First Mode)
// ==============================================================================

import { api } from './api';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface UploadResult {
  success: boolean;
  filePath?: string;
  filename?: string;
  error?: string;
}

export async function uploadCandidateDocument(
  candidateId: string,
  docType: 'education_certificate' | 'experience_certificate' | 'resume',
  file: File
): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExts = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'];

  if (!ALLOWED_MIME_TYPES.includes(file.type) && (!ext || !validExts.includes(ext))) {
    return {
      success: false,
      error: 'Invalid file format. Only PDF, DOC, DOCX, JPG, and PNG documents are permitted.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: 'File size exceeds maximum allowed limit of 25 MB.',
    };
  }

  try {
    const res = await api.uploadDocument(candidateId, docType, file);
    return {
      success: true,
      filePath: res.url,
      // Keep the server-generated storage filename in the candidate record.
      // The original name is for display only; using it as the storage name
      // makes the authenticated download endpoint look for a file that does
      // not exist on disk.
      filename: res.filename,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to upload ${docType} to local storage.`,
    };
  }
}

export async function uploadResume(candidateId: string, file: File): Promise<UploadResult> {
  // 1. Validation
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExts = ['pdf', 'doc', 'docx'];

  if (!ALLOWED_MIME_TYPES.includes(file.type) && (!ext || !validExts.includes(ext))) {
    return {
      success: false,
      error: 'Invalid file format. Only PDF, DOC, and DOCX documents are permitted.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: 'File size exceeds maximum allowed limit of 25 MB.',
    };
  }

  try {
    const res = await api.uploadResume(candidateId, file);
    return {
      success: true,
      filePath: res.resumeUrl,
      filename: res.originalName || file.name,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to upload resume to local storage.',
    };
  }
}

export async function getSecureDocumentUrl(
  filePath: string,
  candidateId?: string,
  docType: 'education_certificate' | 'experience_certificate' | 'resume' = 'resume'
): Promise<string> {
  if (!filePath && !candidateId) return '';
  if (filePath && (filePath.startsWith('data:') || filePath.startsWith('/sample-resumes/'))) {
    return filePath;
  }
  if (filePath && (filePath.startsWith('/api/documents/') || filePath.startsWith('/api/resumes/'))) {
    return filePath;
  }
  if (candidateId) {
    return `/api/documents/download/${candidateId}/${docType}`;
  }
  return filePath;
}

export async function getSecureResumeUrl(filePath: string, candidateId?: string): Promise<string> {
  if (!filePath && !candidateId) return '';
  if (filePath && (filePath.startsWith('data:') || filePath.startsWith('/sample-resumes/'))) {
    return filePath;
  }
  if (filePath && filePath.startsWith('/api/resumes/')) {
    return filePath;
  }
  if (candidateId) {
    return `/api/resumes/${candidateId}`;
  }
  return filePath;
}
