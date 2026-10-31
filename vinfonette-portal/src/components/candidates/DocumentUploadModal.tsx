import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Candidate } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadCandidateDocument } from '../../lib/storage';
import {
  FileText,
  Upload,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export type CandidateDocType = 'education_certificate' | 'experience_certificate' | 'resume';

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  defaultDocType?: CandidateDocType;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  candidate,
  defaultDocType = 'education_certificate',
}) => {
  const { canEditCandidate } = useAuth();
  const { updateCandidate } = useData();
  const { success, error } = useToast();

  const [selectedType, setSelectedType] = useState<CandidateDocType>(defaultDocType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync defaultDocType when opening
  React.useEffect(() => {
    if (defaultDocType) {
      setSelectedType(defaultDocType);
    }
    setSelectedFile(null);
  }, [defaultDocType, isOpen]);

  if (!candidate) return null;

  const docTypesConfig = {
    education_certificate: {
      label: 'Educational Certificate',
      description: 'Degree Certificate, Provisional Certificate, Diploma or Consolidated Marksheet',
      icon: GraduationCap,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      currentFilename: candidate.education_certificate_filename,
      currentUrl: candidate.education_certificate_url,
      dbUrlKey: 'education_certificate_url' as const,
      dbFilenameKey: 'education_certificate_filename' as const,
    },
    experience_certificate: {
      label: 'Experience Certificate',
      description: 'Relieving Letter, Service Certificate, or Work Experience Proof',
      icon: Briefcase,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      currentFilename: candidate.experience_certificate_filename,
      currentUrl: candidate.experience_certificate_url,
      dbUrlKey: 'experience_certificate_url' as const,
      dbFilenameKey: 'experience_certificate_filename' as const,
    },
    resume: {
      label: 'Resume / Curriculum Vitae',
      description: 'Updated resume in PDF or Word format',
      icon: FileText,
      color: 'text-brand-600 bg-brand-50 border-brand-200',
      currentFilename: candidate.resume_filename,
      currentUrl: candidate.resume_url,
      dbUrlKey: 'resume_url' as const,
      dbFilenameKey: 'resume_filename' as const,
    },
  };

  const currentConfig = docTypesConfig[selectedType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await uploadCandidateDocument(candidate.id, selectedType, selectedFile);

      if (result.success && result.filePath) {
        await updateCandidate(candidate.id, {
          [currentConfig.dbUrlKey]: result.filePath,
          [currentConfig.dbFilenameKey]: result.filename || selectedFile.name,
        });

        success('Document Uploaded', `${currentConfig.label} "${selectedFile.name}" has been stored securely.`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
      } else {
        error('Upload Failed', result.error || 'Failed to upload document.');
      }
    } catch (err: any) {
      error('Upload Failed', err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const canEdit = canEditCandidate(candidate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Candidate Document"
      description={`Add or replace credential documents for ${candidate.full_name} (${candidate.candidate_id})`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Document Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-2">
            Select Document Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(Object.keys(docTypesConfig) as CandidateDocType[]).map((type) => {
              const cfg = docTypesConfig[type];
              const Icon = cfg.icon;
              const isSelected = selectedType === type;
              const hasFile = Boolean(cfg.currentFilename || cfg.currentUrl);

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-charcoal-200 hover:border-charcoal-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {hasFile && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-auto flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> On File
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-charcoal-900">{cfg.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Document Status */}
        <div className="p-3.5 rounded-xl border border-charcoal-200 bg-surface-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${currentConfig.color}`}>
              {React.createElement(currentConfig.icon, { className: 'w-4 h-4' })}
            </div>
            <div>
              <p className="text-xs font-bold text-charcoal-900">
                {currentConfig.currentFilename || 'No file uploaded yet'}
              </p>
              <p className="text-[11px] text-charcoal-500">{currentConfig.description}</p>
            </div>
          </div>
          {currentConfig.currentFilename && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
              Active
            </span>
          )}
        </div>

        {/* Upload Zone */}
        {canEdit ? (
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-2">
              Choose File to Upload
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-brand-500 bg-brand-50/20'
                  : 'border-charcoal-300 hover:border-brand-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-charcoal-900">{selectedFile.name}</p>
                  <p className="text-xs text-charcoal-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                  </p>
                  <span className="text-xs text-brand-600 underline font-semibold mt-1">
                    Click to select different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-charcoal-500 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-800">
                      Click to browse or drag and drop your document
                    </p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 25 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            You do not have permission to upload documents for this candidate.
          </div>
        )}

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-slate-50 border border-charcoal-200 flex items-start gap-2.5 text-[11px] text-charcoal-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Documents are stored in the portal's configured file storage. Only signed-in users with portal access can upload or download candidate documents. Files are not encrypted by the application.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-charcoal-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUploadSubmit}
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {isUploading ? 'Uploading Document...' : `Upload ${currentConfig.label}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

